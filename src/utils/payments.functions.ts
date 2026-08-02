import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

type Env = StripeEnv;

const ALLOWED_RETURN_HOSTS = [
  "layercake.site",
  "www.layercake.site",
  "domain-discover-magic.lovable.app",
];

function validateReturnUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid returnUrl");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid returnUrl");
  }
  const host = parsed.hostname;
  const ok =
    ALLOWED_RETURN_HOSTS.includes(host) ||
    host.endsWith(".lovable.app") ||
    host === "localhost" ||
    host === "127.0.0.1";
  if (!ok) throw new Error("Invalid returnUrl");
  return parsed.toString();
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      sliceId?: string;
      returnUrl: string;
      environment: Env;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      const safe = validateReturnUrl(data.returnUrl);
      if (!safe) throw new Error("returnUrl required");
      return { ...data, returnUrl: safe };
    },
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const metadata: Record<string, string> = {
      userId,
      priceId: data.priceId,
    };
    if (data.sliceId) metadata.sliceId = data.sliceId;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      ...(data.customerEmail && { customer_email: data.customerEmail }),
      metadata,
      ...(isRecurring && {
        subscription_data: { metadata: { userId } },
      }),
      managed_payments: { enabled: true },
    } as any);

    return session.client_secret;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: Env }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return { ...data, returnUrl: validateReturnUrl(data.returnUrl) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) throw new Error("No subscription found");

    const stripe = createStripeClient(data.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      ...(data.returnUrl && { return_url: data.returnUrl }),
    });
    return portal.url;
  });

const UPGRADEABLE = ["community_monthly", "pro_monthly", "pro_yearly", "business_monthly", "business_yearly"];

/**
 * Switches an existing subscription to a different plan with prorated billing.
 * Stripe credits the unused portion of the current plan and invoices the
 * difference immediately (upgrades) or credits the balance (downgrades).
 */
export const upgradeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; environment: Env }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    if (!UPGRADEABLE.includes(data.priceId)) throw new Error("Invalid plan");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, price_id, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id || !["active", "trialing", "past_due"].includes(sub.status as string)) {
      return { ok: false as const, error: "no_subscription" };
    }
    if (sub.price_id === data.priceId) {
      return { ok: false as const, error: "already_on_plan" };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const target = prices.data[0];

      const current = await stripe.subscriptions.retrieve(sub.stripe_subscription_id as string);
      const itemId = current.items.data[0]?.id;
      if (!itemId) throw new Error("Subscription has no billable item");

      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
        items: [{ id: itemId, price: target.id }],
        // Prorate: credit the unused time on the old plan and bill the
        // difference right away so the new slice allowance starts today.
        proration_behavior: "always_invoice",
        cancel_at_period_end: false,
        metadata: { userId, priceId: data.priceId },
      });

      return { ok: true as const, status: updated.status, priceId: data.priceId };
    } catch (error) {
      return { ok: false as const, error: (error as Error).message || "Upgrade failed" };
    }
  });
