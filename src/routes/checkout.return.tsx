import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Checkout complete — Layercake" }] }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background: "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 30%, #FFF5C2 60%, #DFF5DD 100%)",
      }}
    >
      <div className="rounded-3xl border border-white bg-white/80 px-10 py-12 text-center shadow-[0_20px_40px_-25px_rgba(0,0,0,0.25)] backdrop-blur">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
          Sweet success
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-foreground">
          {session_id ? "You're in." : "All done."}
        </h1>
        <p className="mt-3 max-w-sm text-foreground/60">
          {session_id
            ? "Your payment is complete. Pro features and unlocks will appear in a moment."
            : "Welcome back."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
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
        </div>
      </div>
    </main>
  );
}
