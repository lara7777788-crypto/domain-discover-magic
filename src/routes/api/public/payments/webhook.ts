import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function handleSubscriptionCreated(s: any, env: StripeEnv) {
  const userId = s.metadata?.userId;
  if (!userId) return;
  const item = s.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? s.current_period_start;
  const periodEnd = item?.current_period_end ?? s.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: s.id,
      stripe_customer_id: s.customer,
      product_id: productId,
      price_id: priceId,
      status: s.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: s.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Mirror to profiles.is_pro for legacy gating
  await getSupabase()
    .from("profiles")
    .update({
      is_pro: true,
      pro_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq("id", userId);
}

async function handleSubscriptionUpdated(s: any, env: StripeEnv) {
  const item = s.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? s.current_period_start;
  const periodEnd = item?.current_period_end ?? s.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: s.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: s.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", s.id)
    .eq("environment", env);

  const userId = s.metadata?.userId;
  if (userId) {
    const stillActive =
      ["active", "trialing"].includes(s.status) ||
      (s.status === "canceled" && periodEnd && periodEnd * 1000 > Date.now());
    await getSupabase()
      .from("profiles")
      .update({
        is_pro: !!stillActive,
        pro_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      })
      .eq("id", userId);
  }
}

async function handleSubscriptionDeleted(s: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", s.id)
    .eq("environment", env);

  const userId = s.metadata?.userId;
  if (userId) {
    await getSupabase().from("profiles").update({ is_pro: false }).eq("id", userId);
  }
}

async function handleCheckoutCompleted(session: any) {
  if (session.mode !== "payment") return;
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId) return;

  // 10-pack of slice unlock credits — atomic increment
  if (priceId === "slice_pack_10") {
    await getSupabase().rpc("grant_slice_credits", {
      p_user_id: userId,
      p_amount: 10,
    });
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  // Idempotency: skip if event already processed
  const eventId = (event as any).id as string | undefined;
  if (eventId) {
    const { error: dedupeErr } = await getSupabase()
      .from("processed_webhook_events")
      .insert({ stripe_event_id: eventId });
    if (dedupeErr) {
      // Unique violation = already processed; any error here means skip processing
      console.log("Webhook event already processed or insert failed:", eventId, dedupeErr.message);
      return;
    }
  }

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv as StripeEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
