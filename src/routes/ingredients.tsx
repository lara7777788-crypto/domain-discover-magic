import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/ingredients")({
  head: () => ({
    meta: [
      { title: "Ingredients — a sister palette to Layercake" },
      {
        name: "description",
        content:
          "A culinary remix of Layercake. Saffron, basil, sea salt, tomato, olive oil — same craft, different pantry.",
      },
      { property: "og:title", content: "Ingredients — a sister palette to Layercake" },
      {
        property: "og:description",
        content: "Stack flavors instead of frosting. Same studio, new pantry.",
      },
    ],
  }),
  component: IngredientsPage,
});

// Tokens are local to this route so the parent app theme is untouched.
const PALETTE = {
  parchment: "#F6EFE2",
  cream: "#FBF6EA",
  ink: "#1F1A14",
  oliveDeep: "#3F4A23",
  olive: "#7A8A3F",
  saffron: "#E2A52B",
  tomato: "#C0432A",
  basil: "#577C3C",
  terracotta: "#B5613A",
  salt: "#EFE9DA",
};

type Ingredient = {
  name: string;
  hint: string;
  swatch: string;
  textOn: string;
  note: string;
};

const INGREDIENTS: Ingredient[] = [
  { name: "Saffron", hint: "001 · stigma", swatch: PALETTE.saffron, textOn: PALETTE.ink, note: "Three threads. Warm water. Wait." },
  { name: "Sun tomato", hint: "002 · jammy", swatch: PALETTE.tomato, textOn: PALETTE.cream, note: "Split. Salt. Slow oven, all afternoon." },
  { name: "Garden basil", hint: "003 · fresh", swatch: PALETTE.basil, textOn: PALETTE.cream, note: "Torn, never cut. Always last." },
  { name: "First-press olive", hint: "004 · grassy", swatch: PALETTE.olive, textOn: PALETTE.cream, note: "Cold pour, generous. It finishes everything." },
  { name: "Sea salt", hint: "005 · flake", swatch: PALETTE.salt, textOn: PALETTE.ink, note: "Pinch from above. Hear the crackle." },
  { name: "Terracotta clay", hint: "006 · vessel", swatch: PALETTE.terracotta, textOn: PALETTE.cream, note: "Holds heat like a memory." },
];

function IngredientsPage() {
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    INGREDIENTS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 220 + i * 180));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = INGREDIENTS[active];

  const dots = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        left: `${(i * 173) % 100}%`,
        top: `${(i * 67) % 100}%`,
        size: 2 + ((i * 11) % 4),
        delay: (i % 7) * 0.4,
      })),
    [],
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background: `radial-gradient(120% 80% at 20% 0%, ${PALETTE.cream} 0%, ${PALETTE.parchment} 55%, #ECE2CC 100%)`,
        color: PALETTE.ink,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(120,90,40,0.25) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(60,80,30,0.18) 0, transparent 45%)",
        }}
      />
      {/* Speckles */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {dots.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              background: i % 3 === 0 ? PALETTE.tomato : i % 3 === 1 ? PALETTE.oliveDeep : PALETTE.saffron,
              opacity: 0.35,
              animation: `floatY 6s ease-in-out ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Top bar — local, not shared with main app nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className="text-xs uppercase tracking-[0.4em] transition hover:opacity-60"
          style={{ color: PALETTE.oliveDeep }}
        >
          ← layercake
        </Link>
        <div
          className="text-[10px] uppercase tracking-[0.5em]"
          style={{ color: PALETTE.oliveDeep, opacity: 0.6 }}
        >
          Ingredients · sister edition
        </div>
        <Link
          to="/bake"
          className="rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition hover:-translate-y-0.5"
          style={{ background: PALETTE.ink, color: PALETTE.cream }}
        >
          Open the studio
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-14 pb-10 md:px-10 md:pt-24">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.5em]"
          style={{ color: PALETTE.tomato }}
        >
          Volume 02 · the pantry
        </p>
        <h1
          className="mt-5 max-w-3xl text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl"
          style={{
            fontFamily: "'Instrument Serif', 'Fredoka', serif",
            color: PALETTE.ink,
          }}
        >
          Stack flavors,
          <br />
          <span style={{ color: PALETTE.oliveDeep, fontStyle: "italic" }}>
            the way you stack frosting.
          </span>
        </h1>
        <p
          className="mt-6 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: "#4A4234" }}
        >
          A sister palette to Layercake. Same studio, same craft, a different pantry —
          olive, saffron, salt, tomato, basil. Pour, pinch, layer, taste.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            className="rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition hover:-translate-y-0.5"
            style={{
              background: PALETTE.tomato,
              color: PALETTE.cream,
              boxShadow: `0 16px 30px -16px ${PALETTE.tomato}`,
            }}
            onClick={() => {
              const el = document.getElementById("pantry");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Open the pantry
          </button>
          <Link
            to="/about"
            className="rounded-full border px-6 py-3 text-sm font-medium tracking-wide transition hover:bg-white/40"
            style={{ borderColor: `${PALETTE.oliveDeep}40`, color: PALETTE.oliveDeep }}
          >
            About the studio
          </Link>
        </div>
      </section>

      {/* Featured ingredient — mirrors LayerStack/IcingPanel composition */}
      <section className="relative z-10 mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-6 pb-16 md:grid-cols-[1.1fr_1fr] md:px-10">
        {/* Left: big chip */}
        <div
          className="relative overflow-hidden rounded-[28px] p-8 md:p-10"
          style={{
            background: current.swatch,
            color: current.textOn,
            minHeight: 380,
            transition: "background 600ms ease, color 600ms ease",
            boxShadow: "0 30px 60px -40px rgba(40,30,10,0.5)",
          }}
        >
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.4em] opacity-70">
            <span>{current.hint}</span>
            <span>{String(active + 1).padStart(2, "0")} / {INGREDIENTS.length.toString().padStart(2, "0")}</span>
          </div>
          <h2
            className="mt-10 text-5xl leading-[1] md:text-7xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {current.name}.
          </h2>
          <p className="mt-6 max-w-sm text-base opacity-80 md:text-lg">{current.note}</p>

          {/* Decorative drip */}
          <svg
            aria-hidden
            viewBox="0 0 200 60"
            className="absolute bottom-0 left-0 right-0 w-full"
            style={{ color: current.textOn, opacity: 0.18 }}
          >
            <path
              d="M0 30 Q 50 60 100 30 T 200 30 L 200 60 L 0 60 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Right: list */}
        <div id="pantry" className="rounded-[28px] p-6 md:p-8" style={{ background: PALETTE.cream, border: `1px solid ${PALETTE.oliveDeep}1f` }}>
          <div
            className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.4em]"
            style={{ color: PALETTE.oliveDeep }}
          >
            <span>Pantry index</span>
            <span>tap to taste</span>
          </div>
          <ul className="flex flex-col">
            {INGREDIENTS.map((ing, i) => {
              const isActive = i === active;
              const isReady = i < revealed;
              return (
                <li key={ing.name}>
                  <button
                    onClick={() => setActive(i)}
                    className="group flex w-full items-center gap-4 py-4 text-left transition"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${PALETTE.oliveDeep}1a`,
                      opacity: isReady ? 1 : 0,
                      transform: isReady ? "translateY(0)" : "translateY(8px)",
                      transitionProperty: "opacity, transform",
                      transitionDuration: "500ms",
                    }}
                  >
                    <span
                      className="inline-block h-8 w-8 shrink-0 rounded-full transition group-hover:scale-110"
                      style={{
                        background: ing.swatch,
                        boxShadow: isActive
                          ? `0 0 0 3px ${PALETTE.parchment}, 0 0 0 4px ${PALETTE.ink}`
                          : "inset 0 0 0 1px rgba(0,0,0,0.06)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-lg"
                        style={{
                          fontFamily: "'Instrument Serif', serif",
                          color: PALETTE.ink,
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {ing.name}
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.3em]" style={{ color: PALETTE.oliveDeep, opacity: 0.7 }}>
                        {ing.hint}
                      </div>
                    </div>
                    <span
                      className="text-xs transition"
                      style={{ color: PALETTE.oliveDeep, opacity: isActive ? 1 : 0.4 }}
                    >
                      {isActive ? "→ tasting" : "taste"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Recipe card row — mirrors ShowcaseGrid energy */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div
          className="mb-6 flex items-end justify-between"
          style={{ borderBottom: `1px solid ${PALETTE.oliveDeep}33`, paddingBottom: 12 }}
        >
          <h3
            className="text-3xl md:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif", color: PALETTE.ink }}
          >
            Three small plates.
          </h3>
          <span className="text-[11px] uppercase tracking-[0.4em]" style={{ color: PALETTE.oliveDeep }}>
            menu / today
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: "Saffron rice, sun tomato", layers: [PALETTE.saffron, PALETTE.tomato, PALETTE.cream], tag: "primo" },
            { title: "Basil oil, sea salt", layers: [PALETTE.basil, PALETTE.olive, PALETTE.salt], tag: "secondo" },
            { title: "Terracotta-baked stone fruit", layers: [PALETTE.terracotta, PALETTE.saffron, PALETTE.parchment], tag: "dolce" },
          ].map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[24px] transition hover:-translate-y-1"
              style={{
                background: PALETTE.cream,
                border: `1px solid ${PALETTE.oliveDeep}22`,
                boxShadow: "0 20px 40px -30px rgba(40,30,10,0.4)",
              }}
            >
              <div className="flex h-44 w-full">
                {card.layers.map((c, i) => (
                  <div key={i} style={{ background: c, flex: 1 }} />
                ))}
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-[0.4em]" style={{ color: PALETTE.tomato }}>
                  {card.tag}
                </div>
                <div
                  className="mt-2 text-xl"
                  style={{ fontFamily: "'Instrument Serif', serif", color: PALETTE.ink }}
                >
                  {card.title}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-4 border-t pt-6 text-sm md:flex-row md:items-center"
          style={{ borderColor: `${PALETTE.oliveDeep}33`, color: PALETTE.oliveDeep }}
        >
          <span className="text-[11px] uppercase tracking-[0.4em]">
            A sister palette to Layercake.
          </span>
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to the bakery →
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
      />
    </main>
  );
}
