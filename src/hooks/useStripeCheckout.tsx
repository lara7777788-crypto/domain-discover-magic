import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useStripeCheckout as useStripeCheckoutInner } from "./useStripeCheckout.inner";

// Re-exports the inner hook untouched; centralizing the import here means
// any caller naturally picks up the lazy/SSR-safe StripeEmbeddedCheckout.
export function useStripeCheckout() {
  return useStripeCheckoutInner();
}
