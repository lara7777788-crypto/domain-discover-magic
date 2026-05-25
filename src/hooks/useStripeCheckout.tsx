import { useState, useCallback, lazy, Suspense } from "react";

// Lazy import — keeps @stripe/react-stripe-js out of the initial /bake bundle
// and ensures it only loads in the browser when a checkout actually opens.
const StripeEmbeddedCheckout = lazy(() =>
  import("@/components/StripeEmbeddedCheckout").then((m) => ({ default: m.StripeEmbeddedCheckout })),
);

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  sliceId?: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement =
    isOpen && options ? (
      <Suspense fallback={<div className="py-10 text-center text-sm text-foreground/60">Loading checkout…</div>}>
        <StripeEmbeddedCheckout {...options} />
      </Suspense>
    ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
