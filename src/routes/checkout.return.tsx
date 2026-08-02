import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCheckoutSessionStatus } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/lib/auth-context";
import { useCredits, formatSlices } from "@/hooks/useCredits";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Checkout complete — Layercake" },
      { name: "description", content: "Your Layercake subscription is active. Pro features and slice unlocks are ready to use." },
      { property: "og:title", content: "Checkout complete — Layercake" },
      { property: "og:description", content: "Your Pro subscription is active — start baking unlimited slices." },
      { property: "og:url", content: "https://layercake.site/checkout/return" },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "canonical", href: "https://layercake.site/checkout/return" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

type Outcome =
  | { kind: "loading" }
  | { kind: "paid"; amount: number | null; currency: string | null }
  | { kind: "processing" }
  | { kind: "failed" }
  | { kind: "expired" }
  | { kind: "unknown"; message: string };

const money = (amount: number | null, currency: string | null) =>
  amount == null ? null : (amount / 100).toLocaleString(undefined, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  });

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const { user } = useAuth();
  const credits = useCredits();
  const [outcome, setOutcome] = useState<Outcome>(session_id ? { kind: "loading" } : { kind: "unknown", message: "" });

  useEffect(() => {
    if (!session_id || !user) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getCheckoutSessionStatus({
          data: { sessionId: session_id, environment: getStripeEnvironment() },
        });
        if (cancelled) return;
        if ("error" in res) {
          setOutcome({ kind: "unknown", message: res.error });
          return;
        }
        if (res.state === "paid") {
          setOutcome({ kind: "paid", amount: res.amount, currency: res.currency });
          // Slices land via webhook — give it a beat, then re-read the balance.
          setTimeout(() => void credits.refresh(), 2500);
        } else if (res.state === "processing") setOutcome({ kind: "processing" });
        else if (res.state === "expired") setOutcome({ kind: "expired" });
        else setOutcome({ kind: "failed" });
      } catch (e) {
        if (!cancelled) {
          setOutcome({
            kind: "unknown",
            message: (e as Error).message || "We couldn't confirm this payment.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session_id, user]);

  const paidAmount = outcome.kind === "paid" ? money(outcome.amount, outcome.currency) : null;

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background: "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 30%, #FFF5C2 60%, #DFF5DD 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white bg-white/85 px-8 py-10 text-center shadow-[0_20px_40px_-25px_rgba(0,0,0,0.25)] backdrop-blur">
        {outcome.kind === "loading" && (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
              Checking with the bakery
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
              Confirming your payment…
            </h1>
            <p className="mt-3 text-sm text-foreground/60">
              Don't pay again — we're reading the result from Stripe.
            </p>
          </>
        )}

        {outcome.kind === "paid" && (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
              Sweet success
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-foreground">You're in.</h1>
            <p className="mt-3 text-foreground/65">
              {paidAmount ? `${paidAmount} paid.` : "Payment complete."} Your slices appear within a
              few seconds — no need to buy again.
            </p>
            {!credits.loading && !credits.isAdmin && (
              <p className="mt-2 text-sm text-foreground/50">
                Balance now: 🍰 {formatSlices(credits.total)}
              </p>
            )}
          </>
        )}

        {outcome.kind === "processing" && (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
              Almost there
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
              Payment is still processing
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">
              Your bank hasn't finalised this one yet. <strong>Please don't buy again</strong> — it
              usually settles within a few minutes and your slices appear automatically.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground"
            >
              Check again
            </button>
          </>
        )}

        {(outcome.kind === "failed" || outcome.kind === "expired") && (
          <>
            <p className="text-2xl" aria-hidden>
              🍰💔
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
              {outcome.kind === "expired" ? "That checkout expired" : "Payment wasn't completed"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">
              <strong>No charge was made</strong> and your slice balance is unchanged. You can start
              a fresh checkout whenever you're ready.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                to="/pricing"
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try again
              </Link>
              <a
                href="mailto:hello@layercake.site?subject=Layercake%20payment%20problem"
                className="rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                Email support
              </a>
            </div>
          </>
        )}

        {outcome.kind === "unknown" && (
          <>
            <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
              {session_id ? "We couldn't confirm this payment" : "All done."}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">
              {session_id
                ? outcome.message ||
                  "Stripe didn't answer in time. Check your slice balance before trying again — if it went through, your slices are already there."
                : "Welcome back."}
            </p>
            {session_id && (
              <p className="mt-2 text-xs text-foreground/50">
                Reference: <span className="font-mono">{session_id.slice(0, 20)}…</span> — include
                this if you contact support.
              </p>
            )}
          </>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/bake"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white"
          >
            Bake a slice
          </Link>
          <Link
            to="/slices"
            className="rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            My slices
          </Link>
          <Link
            to="/usage"
            className="rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            Receipts
          </Link>
        </div>
      </div>
    </main>
  );
}
