import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/bake")({
  head: () => ({
    meta: [
      { title: "Bake — Layercake" },
      { name: "description", content: "Build your visual one delicious layer at a time." },
    ],
  }),
  component: BakePage,
});

type Layer = {
  key: string;
  name: string;
  tagline: string;
  hint: string;
  bg: string;
  ink: string;
};

const LAYERS: Layer[] = [
  { key: "wish",   name: "Wish",   tagline: "Say it plainly.",          hint: "A poster for a pastry shop in Kyoto, soft and dreamy.",   bg: "#FFE0EC", ink: "#7A2A4E" },
  { key: "visual", name: "Visual", tagline: "Choose a mood.",           hint: "Editorial · Playful · Hand-drawn · Cinematic",            bg: "#FFE6CF", ink: "#7A4A1F" },
  { key: "text",   name: "Text",   tagline: "What words live on it?",   hint: "A title, a tagline, or nothing at all.",                  bg: "#FFF6BE", ink: "#6E5A0E" },
  { key: "layout", name: "Layout", tagline: "Where the eye lands.",     hint: "Centered · Off-axis · Grid · Generous space",             bg: "#D9F1D2", ink: "#1F5A2A" },
  { key: "logo",   name: "Logo",   tagline: "A signature, optional.",   hint: "Drop a mark, monogram, or wordmark.",                     bg: "#D4E8FF", ink: "#1A3D6E" },
  { key: "prompt", name: "Prompt", tagline: "The cherry on top.",       hint: "Layercake rewrites your wish into a prompt that works.",  bg: "#E5D8FF", ink: "#3E1F70" },
];

function BakePage() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(Number((e.target as HTMLElement).dataset.idx));
          }
        });
      },
      { root, threshold: 0.55 },
    );
    sectionRefs.current.forEach((s) => s && obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = sectionRefs.current[i];
    if (el && containerRef.current) {
      containerRef.current.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className="pointer-events-auto font-display text-base font-semibold text-foreground/70 transition hover:text-foreground"
        >
          ← layercake
        </Link>
        <div className="pointer-events-auto rounded-full bg-white/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/60 backdrop-blur">
          Layer {active + 1} / {LAYERS.length} · {LAYERS[active].name}
        </div>
      </header>

      {/* Right rail — mini cake stack */}
      <nav
        aria-label="Layers"
        className="fixed right-5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-1.5"
      >
        {LAYERS.map((l, i) => {
          const isActive = active === i;
          return (
            <button
              key={l.key}
              onClick={() => goTo(i)}
              aria-label={l.name}
              className="group flex items-center gap-3"
            >
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] transition-all ${
                  isActive ? "opacity-90" : "opacity-0 group-hover:opacity-60"
                }`}
                style={{ color: l.ink }}
              >
                {l.name}
              </span>
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 44 : 26,
                  height: 8,
                  background: l.bg,
                  boxShadow: isActive
                    ? `0 4px 14px -4px ${l.ink}55, inset 0 -2px 0 0 rgba(255,255,255,0.6)`
                    : `inset 0 -1px 0 0 rgba(255,255,255,0.5)`,
                  border: `1px solid ${l.ink}22`,
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* Layer panels */}
      <div
        ref={containerRef}
        className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth"
      >
        {LAYERS.map((l, i) => (
          <section
            key={l.key}
            data-idx={i}
            ref={(el) => { sectionRefs.current[i] = el; }}
            className="relative flex h-screen w-full snap-start items-center justify-center px-6 transition-colors"
            style={{
              background: `linear-gradient(180deg, ${l.bg} 0%, #FFFDF8 100%)`,
              color: l.ink,
            }}
          >
            <div className="mx-auto w-full max-w-xl">
              <p
                className="mb-3 text-[11px] font-medium uppercase tracking-[0.4em] opacity-60"
                style={{ color: l.ink }}
              >
                Layer {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display text-5xl font-semibold leading-[1.02] md:text-6xl" style={{ color: l.ink }}>
                {l.name}.
              </h2>
              <p className="mt-3 text-lg italic opacity-75" style={{ color: l.ink }}>
                {l.tagline}
              </p>

              <div className="mt-8">
                <textarea
                  placeholder={l.hint}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/60 bg-white/70 p-5 text-base text-foreground placeholder:text-foreground/35 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.2)] backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => i > 0 && goTo(i - 1)}
                  disabled={i === 0}
                  className="text-sm font-medium opacity-60 transition hover:opacity-100 disabled:invisible"
                  style={{ color: l.ink }}
                >
                  ↑ Previous
                </button>

                {i < LAYERS.length - 1 ? (
                  <button
                    onClick={() => goTo(i + 1)}
                    className="rounded-full px-6 py-3 text-sm font-medium text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
                    style={{ background: l.ink }}
                  >
                    Next: {LAYERS[i + 1].name} ↓
                  </button>
                ) : (
                  <button
                    className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
                  >
                    Bake my slice 🍰
                  </button>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
