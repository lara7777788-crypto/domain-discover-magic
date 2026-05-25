
# Fix the `/bake` "dispatcher.useContext" crash

## What we know

- User clicked the homepage CTA → navigated to `/bake` → error boundary rendered with `null is not an object (evaluating 'dispatcher.useContext')`.
- Console shows `Warning: Error in route match: /bake/bake` (note the doubled segment).
- Stripe's `stripe.js` was injected immediately before the crash.
- The error did NOT appear before this turn's homepage rewrite — but nothing I changed touches `/bake` or Stripe directly, so the most likely trigger is a pre-existing latent bug in `bake.tsx` / `StripeEmbeddedCheckout` that the new CTA path now reaches more easily.

`dispatcher.useContext is null` in React almost always means one of:
1. A hook is being called outside a React render (e.g. at module top-level, in a class, in an event handler).
2. Two copies of React are loaded (Stripe's embedded checkout sometimes pulls one in via a dynamic bundle).
3. A component is rendered before its provider is mounted (e.g. `useAuth()` outside `AuthProvider`).

The `/bake/bake` warning suggests a `<Link to="bake">` somewhere is being resolved relative to `/bake`, doubling the path. That's a separate, smaller bug but worth fixing in the same pass.

## Investigation steps

1. Read `src/routes/bake.tsx`, `src/components/StripeEmbeddedCheckout.tsx`, `src/hooks/useStripeCheckout.tsx`, `src/lib/stripe.ts` to find:
   - any hook called outside a component body,
   - any module-level `useContext`/store access,
   - any `<Link to="bake">` that should be `to="/bake"`.
2. Check whether `@stripe/react-stripe-js` and `@stripe/stripe-js` are both pinned (a version mismatch is a known cause).
3. Check `package.json` for a duplicate React (e.g. an alias or a `resolutions` override gone wrong).
4. Reproduce: I'll add a one-line `console.error` with the real error object in `src/router.tsx`'s `DefaultErrorComponent` so the next run prints the full stack instead of just the message.

## Likely fix shape (pending investigation)

Most probable: the `StripeEmbeddedCheckout` component is being rendered during SSR or before the auth context is ready, and one of its hooks dereferences a null React internal because it runs on the server where Stripe.js has no DOM.

Planned remedy:
- Gate `<StripeEmbeddedCheckout>` behind a client-only mount guard (`useEffect`-driven `mounted` flag) so it never renders during SSR.
- Wrap it in an isolated error boundary so a Stripe failure doesn't blow up the whole `/bake` route.
- If a `<Link to="bake">` is found inside `/bake`, change it to `to="/bake"` (absolute) to kill the `/bake/bake` warning.
- If versions are mismatched, align `@stripe/stripe-js` and `@stripe/react-stripe-js`.

## Out of scope

- No changes to the homepage I just shipped.
- No changes to auth, RLS, server functions, or pricing logic.
- No new dependencies unless a version mismatch is the proven cause.

## Verification

- Reload `/`, click "Bake your first slice", confirm `/bake` mounts without the error boundary.
- Confirm console no longer shows `Error in route match: /bake/bake`.
- Confirm Stripe checkout still loads when reached normally.
