import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayerCake } from "../components/LayerCake";

export const Route = createFileRoute("/bake")({
  head: () => ({
    meta: [
      { title: "Bake — Layercake" },
      { name: "description", content: "Build your visual layer by layer." },
    ],
  }),
  component: BakePage,
});

type Layer = {
  key: string;
  name: string;
  emoji: string;
  bg: string;
  text: string;
  prompt: string;
};

const LAYERS: Layer[] = [
  { key: "visual",  name: "Visual",  emoji: "🍓", bg: "var(--strawberry)", text: "var(--foreground)", prompt: "Describe the mood, style, palette." },
  { key: "text",    name: "Text",    emoji: "🍈", bg: "var(--melon)",      text: "var(--foreground)", prompt: "What words live on it?" },
  { key: "layout",  name: "Layout",  emoji: "🫐", bg: "var(--ramune)",     text: "var(--foreground)", prompt: "Composition, balance, focal point." },
  { key: "logo",    name: "Logo",    emoji: "🍵", bg: "var(--matcha)",     text: "var(--foreground)", prompt: "Mark, monogram, signature." },
  { key: "prompt",  name: "Prompt",  emoji: "🍒", bg: "var(--ube)",        text: "var(--cream)",      prompt: "The cherry on top — Layercake rewrites your wish into a prompt that actually works." },
];

function BakePage() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.idx);
            setActive(i);
          }
        });
      },
      { root, threshold: 0.6 },
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
    <div className="relative h-screen overflow-hidden bg-cream">
      {/* fixed cake on the left as you slice down */}
      <div className="pointer-events-none fixed left-6 top-1/2 z-10 hidden -translate-y-1/2 md:block">
        <LayerCake size={260} activeLayer={active} />
      </div>

      {/* layer indicator (right rail dots) */}
      <div className="fixed right-5 top-1/2 z-20 -translate-y-1/2 flex flex-col gap-3">
        {LAYERS.map((l, i) => (
          <button
            key={l.key}
            onClick={() => goTo(i)}
            aria-label={`Go to ${l.name} layer`}
            className="group flex items-center gap-2"
          >
            <span
              className="h-3 w-3 rounded-full border-2 transition-all"
              style={{
                background: active === i ? l.bg : "transparent",
                borderColor: l.bg,
                transform: active === i ? "scale(1.4)" : "scale(1)",
              }}
            />
          </button>
        ))}
      </div>

      {/* scroll snap container */}
      <div
        ref={containerRef}
        className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth"
      >
        {LAYERS.map((l, i) => (
          <section
            key={l.key}
            data-idx={i}
            ref={(el) => { sectionRefs.current[i] = el; }}
            className="flex h-screen w-full snap-start items-center justify-center px-6 md:pl-[340px]"
            style={{ background: `linear-gradient(180deg, ${l.bg} 0%, color-mix(in oklch, ${l.bg} 70%, var(--cream)) 100%)`, color: l.text }}
          >
            <div className="max-w-xl">
              <div className="mb-4 text-6xl animate-sprinkle" aria-hidden>{l.emoji}</div>
              <div className="mb-2 text-sm font-medium uppercase tracking-[0.3em] opacity-70">
                Layer {i + 1} of {LAYERS.length}
              </div>
              <h2 className="font-display text-5xl md:text-7xl font-bold leading-none">
                {l.name}
              </h2>
              <p className="mt-6 text-lg md:text-xl opacity-80">{l.prompt}</p>

              <textarea
                placeholder={`Add your ${l.name.toLowerCase()}…`}
                className="mt-8 w-full rounded-3xl border-2 border-foreground/15 bg-cream/70 p-5 text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-4"
                style={{ boxShadow: `0 8px 0 0 color-mix(in oklch, ${l.bg} 60%, var(--foreground) 20%)` }}
                rows={3}
              />

              <div className="mt-6 flex items-center gap-3">
                {i > 0 && (
                  <button
                    onClick={() => goTo(i - 1)}
                    className="rounded-full border-2 border-foreground/20 bg-cream/60 px-5 py-2 text-sm font-medium hover:bg-cream"
                  >
                    ↑ {LAYERS[i - 1].name}
                  </button>
                )}
                {i < LAYERS.length - 1 ? (
                  <button
                    onClick={() => goTo(i + 1)}
                    className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-cream transition-transform hover:scale-105"
                  >
                    Next layer: {LAYERS[i + 1].name} ↓
                  </button>
                ) : (
                  <button
                    className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-cream transition-transform hover:scale-105"
                  >
                    🍰 Bake my slice
                  </button>
                )}
              </div>

              {i === 0 && (
                <Link to="/" className="mt-10 inline-block text-sm opacity-60 hover:opacity-100 underline underline-offset-4">
                  ← back to the bakery
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
