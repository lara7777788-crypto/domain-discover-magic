import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { createPortalSession } from "@/utils/payments.functions";
import { redeemCoupon } from "@/server/coupons.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { TopNav } from "@/components/TopNav";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Layercake" },
      {
        name: "description",
        content:
          "Layercake Pro: unlimited slices, HD downloads, and full unlocks. Try free or upgrade for $12/month.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { user } = useAuth();
  const { sub, isActive } = useSubscription();
  const { openCheckout, checkoutElement, closeCheckout, isOpen } = useStripeCheckout();
  const [portalLoading, setPortalLoading] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onRedeem = async () => {
    if (!user) { window.location.href = "/login"; return; }
    if (!code.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const res = await redeemCoupon({ data: { code } });
      setRedeemMsg({ ok: true, text: `🍰 ${res.granted} slices added! Balance: ${res.balance}.` });
      setCode("");
    } catch (e) {
      setRedeemMsg({ ok: false, text: (e as Error).message || "Couldn't redeem code" });
    } finally {
      setRedeeming(false);
    }
  };

  const buy = (priceId: "pro_monthly" | "pro_yearly") => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    openCheckout({
      priceId,
      userId: user.id,
      customerEmail: user.email ?? undefined,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const url = await createPortalSession({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.origin + "/pricing" },
      });
      if (url) window.open(url, "_blank");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 30%, #FFF5C2 60%, #DFF5DD 100%)",
      }}
    >
      <PaymentTestModeBanner />
      <TopNav />
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-28">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
            Pricing
          </p>
          <h1 className="mt-2 font-display text-5xl font-semibold text-foreground md:text-6xl">
            Bake more. Pay less.
          </h1>
          <p className="mt-4 text-foreground/60">
            Pro unlocks unlimited generation and HD downloads on every slice.
          </p>
        </div>

        {isActive && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white bg-white/80 p-4 text-center backdrop-blur">
            <p className="text-sm text-foreground/70">
              You're on Pro
              {sub?.current_period_end &&
                ` until ${new Date(sub.current_period_end).toLocaleDateString()}`}
              .
            </p>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="mt-3 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white"
            >
              {portalLoading ? "Opening…" : "Manage billing"}
            </button>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          <PlanCard
            name="Monthly"
            price="$20"
            period="/month"
            features={[
              "90 slices per month",
              "HD downloads",
              "All slices unlocked",
              "Cancel anytime",
            ]}
            cta="Go Pro monthly"
            highlight={false}
            onClick={() => buy("pro_monthly")}
            disabled={isActive && sub?.price_id === "pro_monthly"}
          />
          <PlanCard
            name="Yearly"
            price="$110"
            period="/year"
            features={[
              "45 slices per month (540/year)",
              "HD downloads",
              "Save $130 vs monthly",
              "Cancel anytime",
            ]}
            cta="Go Pro yearly"
            highlight
            onClick={() => buy("pro_yearly")}
            disabled={isActive && sub?.price_id === "pro_yearly"}
          />
        </div>

        <div className="mt-10 text-center text-sm text-foreground/50">
          Need just a few? Grab a 10‑pack of slices for $3 — stacks on top of any Pro plan.
        </div>

        <div className="mt-8 text-center">
          <Link to="/slices" className="text-sm text-foreground/60 underline">
            Back to my slices
          </Link>
        </div>
      </section>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-[#FFFDF8] px-4 py-5"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            <button
              onClick={closeCheckout}
              className="ml-auto rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/10"
            >
              Close ✕
            </button>
            <div className="mt-4">{checkoutElement}</div>
          </div>
        </div>
      )}
    </main>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  cta,
  highlight,
  onClick,
  disabled,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-8 backdrop-blur transition ${
        highlight
          ? "border-foreground/20 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]"
          : "border-white bg-white/70"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/50">
        {name}
      </p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-5xl font-semibold text-foreground">{price}</span>
        <span className="text-foreground/50">{period}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm text-foreground/75">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground/60" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
          highlight
            ? "bg-foreground text-white hover:-translate-y-0.5"
            : "border border-foreground/20 text-foreground hover:bg-foreground/5"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {disabled ? "Current plan" : cta}
      </button>
    </div>
  );
}
