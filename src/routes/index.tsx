import { createFileRoute, Link } from "@tanstack/react-router";
import heroCake from "../assets/hero-cake.png";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Soft pastel rainbow wash */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 22%, #FFF5C2 42%, #DFF5DD 62%, #DCEEFF 82%, #ECE0FF 100%)",
        }}
      />

      {/* Drifting confetti dots */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => {
          const colors = ["#FF8FB1", "#FFB58A", "#FFE070", "#9BE3A4", "#9FD2FF", "#C9A8FF"];
          const c = colors[i % colors.length];
          const left = (i * 37) % 100;
          const delay = (i * 0.4) % 6;
          const dur = 8 + (i % 5);
          const size = 6 + (i % 4) * 2;
          return (
            <span
              key={i}
              className="absolute rounded-full opacity-70 animate-float"
              style={{
                left: `${left}%`,
                top: `-20px`,
                width: size,
                height: size,
                background: c,
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
              }}
            />
          );
        })}
      </div>

      {/* Brandmark */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="font-display text-xl font-semibold tracking-tight text-foreground/80">
          layercake
          <span style={{ color: "#FF6FA3" }}>.</span>
        </div>
        <div className="hidden text-[11px] uppercase tracking-[0.3em] text-foreground/50 md:block">
          est. 2026 · small batches
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 text-center">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/55">
          A new kind of visual studio
        </p>

        <h1 className="font-display text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
          Make beautiful things,
          <br />
          <span className="italic text-foreground/70">layer by layer.</span>
        </h1>

        <div className="relative mt-8 mb-10 flex justify-center">
          <div
            aria-hidden
            className="absolute inset-x-10 bottom-4 h-10 rounded-full blur-2xl"
            style={{ background: "rgba(255,140,180,0.35)" }}
          />
          <img
            src={heroCake}
            alt="Pastel rainbow layer cake"
            width={420}
            height={420}
            className="relative w-[260px] animate-wobble drop-shadow-[0_30px_40px_rgba(180,120,200,0.25)] md:w-[420px]"
          />
        </div>

        <Link
          to="/bake"
          className="group relative inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-4 text-sm font-medium tracking-wide text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/70 transition-all group-hover:bg-white" />
          Enter the bakery
          <span className="text-white/50 transition-transform group-hover:translate-x-0.5">→</span>
        </Link>

        <p className="mt-6 max-w-md text-sm text-foreground/55">
          One free slice on the house. After that, just a few sweet cents per render.
        </p>
      </section>

      <footer className="relative z-10 px-6 pb-8 text-center text-[11px] uppercase tracking-[0.25em] text-foreground/40">
        layercake · visual generation, layered
      </footer>
    </main>
  );
}
