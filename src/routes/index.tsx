import { createFileRoute, Link } from "@tanstack/react-router";
import { LayerCake } from "../components/LayerCake";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* candy confetti backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "var(--strawberry)", opacity: 0.35 }} />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full blur-3xl" style={{ background: "var(--ramune)", opacity: 0.3 }} />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-3xl" style={{ background: "var(--matcha)", opacity: 0.3 }} />
        <div className="absolute -right-10 bottom-20 h-72 w-72 rounded-full blur-3xl" style={{ background: "var(--taiyaki)", opacity: 0.35 }} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="font-display text-2xl font-bold tracking-tight">layercake<span style={{ color: "var(--strawberry)" }}>.</span></div>
        <nav className="flex items-center gap-2 text-sm">
          <span className="hidden rounded-full bg-foreground/5 px-3 py-1.5 text-foreground/70 md:inline">1 free slice · then $</span>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pt-6 pb-16 text-center md:pt-10">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-cream/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--strawberry)" }} />
          patent-pending prompt layer
        </span>

        <h1 className="font-display text-6xl font-bold leading-[0.9] md:text-8xl">
          visual generation,
          <br />
          <span style={{ color: "var(--ube)" }}>layer</span> <span style={{ color: "var(--strawberry)" }}>by</span> <span style={{ color: "var(--matcha)" }}>layer</span>.
        </h1>

        <p className="mt-6 max-w-xl text-base md:text-lg text-foreground/70">
          Other generators dump a blank box on you. Layercake adds a sweet step in between — it rewrites your wish into a prompt that actually works.
        </p>

        <div className="my-10">
          <LayerCake size={340} interactive />
        </div>

        <Link
          to="/bake"
          className="group relative inline-flex items-center gap-3 rounded-full px-9 py-5 text-lg font-semibold text-cream shadow-[0_8px_0_0_var(--ube)] transition-all hover:translate-y-1 hover:shadow-[0_4px_0_0_var(--ube)]"
          style={{ background: "var(--foreground)" }}
        >
          🍰 Slice into it
          <span className="text-cream/60 text-sm">— first slice on the house</span>
        </Link>

        <ul className="mt-12 flex flex-wrap justify-center gap-2 text-xs">
          {[
            ["🍓", "Visual"],
            ["🍈", "Text"],
            ["🫐", "Layout"],
            ["🍵", "Logo"],
            ["🍒", "Prompt"],
          ].map(([e, n]) => (
            <li key={n} className="rounded-full border-2 border-foreground/15 bg-cream/70 px-3 py-1.5 font-medium">
              <span className="mr-1.5">{e}</span>{n}
            </li>
          ))}
        </ul>
      </section>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-foreground/50">
        baked in small batches · © layercake
      </footer>
    </main>
  );
}
