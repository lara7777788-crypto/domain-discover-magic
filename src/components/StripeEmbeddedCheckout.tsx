import { useEffect, useMemo, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

interface Props {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  sliceId?: string;
  returnUrl?: string;
  onClose?: () => void;
}

export function StripeEmbeddedCheckout(props: Props) {
  // Client-only mount guard — prevents SSR from instantiating the Stripe React
  // tree, which is the canonical fix for `dispatcher.useContext is null` crashes
  // when @stripe/react-stripe-js renders outside a DOM.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Bumping this remounts the provider — the only safe way to retry, since
  // EmbeddedCheckoutProvider rejects a changed clientSecret after mount.
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Snapshot the props once — `EmbeddedCheckoutProvider` errors if its
  // `options` reference (and the clientSecret it returns) changes after mount.
  const snapshot = useMemo(() => ({ ...props }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const stripePromise = useMemo(() => (mounted ? getStripe() : null), [mounted]);

  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        try {
          const result = await createCheckoutSession({
            data: {
              priceId: snapshot.priceId,
              quantity: snapshot.quantity,
              customerEmail: snapshot.customerEmail,
              sliceId: snapshot.sliceId,
              returnUrl:
                snapshot.returnUrl ||
                `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
              environment: getStripeEnvironment(),
            },
          });
          if ("error" in result) throw new Error(result.error);
          setError(null);
          return result.clientSecret;
        } catch (e) {
          const message =
            (e as Error)?.message ||
            "We couldn't open the payment form. No charge was made — please try again.";
          setError(message);
          throw new Error(message);
        }
      },
    }),
    // `attempt` intentionally re-creates the options object on retry.
    [snapshot, attempt],
  );

  if (!mounted || !stripePromise) {
    return <div className="py-10 text-center text-sm text-foreground/60">Loading checkout…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-center">
        <p className="text-2xl" aria-hidden>
          🍰💔
        </p>
        <h2 className="mt-2 text-lg font-semibold text-rose-800">Payment couldn't start</h2>
        <p className="mt-2 text-sm leading-relaxed text-rose-900/80">{error}</p>
        <p className="mt-2 text-xs text-rose-900/60">
          Nothing has been charged. Your slices and balance are unchanged.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setError(null);
              setAttempt((a) => a + 1);
            }}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          {snapshot.onClose && (
            <button
              onClick={snapshot.onClose}
              className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground"
            >
              Back to plans
            </button>
          )}
          <a
            href="mailto:hello@layercake.site?subject=Layercake%20payment%20problem"
            className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground"
          >
            Email support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider key={attempt} stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
