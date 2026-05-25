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
}

export function StripeEmbeddedCheckout(props: Props) {
  // Client-only mount guard — prevents SSR from instantiating the Stripe React
  // tree, which is the canonical fix for `dispatcher.useContext is null` crashes
  // when @stripe/react-stripe-js renders outside a DOM.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Snapshot the props once — `EmbeddedCheckoutProvider` errors if its
  // `options` reference (and the clientSecret it returns) changes after mount.
  const snapshot = useMemo(() => ({ ...props }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const stripePromise = useMemo(() => (mounted ? getStripe() : null), [mounted]);

  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        const result = await createCheckoutSession({
          data: {
            ...snapshot,
            returnUrl:
              snapshot.returnUrl ||
              `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
            environment: getStripeEnvironment(),
          },
        });
        if (!result) throw new Error("Failed to create checkout session");
        return result;
      },
    }),
    [snapshot],
  );

  if (!mounted || !stripePromise) {
    return <div className="py-10 text-center text-sm text-foreground/60">Loading checkout…</div>;
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
