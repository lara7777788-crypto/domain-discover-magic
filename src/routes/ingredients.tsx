import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/ingredients")({
  head: () => ({
    meta: [
      { title: "Ingredients — copy, written one layer at a time" },
      {
        name: "description",
        content:
          "The copywriting twin of Layercake. Flour, sugar, yeast, milk, salt — your brief, your tone, your length, your audience, your voice.",
      },
      { property: "og:title", content: "Ingredients — copy, written one layer at a time" },
      {
        property: "og:description",
        content: "Stack copy ingredients the way you stack frosting. Same studio, same wallet, new pantry.",
      },
      { property: "og:url", content: "https://layercake.site/ingredients" },
    ],
    links: [{ rel: "canonical", href: "https://layercake.site/ingredients" }],
  }),
  component: IngredientsPage,
});

// Blue pantry — local to this route, parent app theme untouched.
const PALETTE = {
  parchment: "#EEF3FB",
  cream: "#F7FAFE",
  ink: "#08153A",
  inkSoft: "#13265C",
  cornflower: "#5B7FD1",
  powder: "#B6CAE9",
  midnight: "#06112F",
  honey: "#E8B23B", // the single warm accent so it doesn't go cold
};

type Ingredient = {
  name: string;
  hint: string;
  swatch: string;
  textOn: string;
  note: string;
  maps: string;
};

const INGREDIENTS: Ingredient[] = [
  { name: "Flour",  hint: "001 · the base",  swatch: PALETTE.powder,     textOn: PALETTE.midnight, note: "The brief. What this piece is actually about.",     maps: "→ topic & substance" },
  { name: "Sugar",  hint: "002 · sweetness", swatch: "#CFDDF3",           textOn: PALETTE.midnight, note: "Tone. Warm, dry, cheeky, reverent — pick a register.", maps: "→ tone & register" },
  { name: "Yeast",  hint: "003 · rise",      swatch: PALETTE.cornflower,  textOn: PALETTE.cream,    note: "Length. How much it should breathe on the page.",   maps: "→ length & energy" },
  { name: "Milk",   hint: "004 · audience",  swatch: "#9DB6DF",           textOn: PALETTE.cream,    note: "Who's drinking it in. Speak their language, not yours.", maps: "→ audience" },
  { name: "Salt",   hint: "005 · signature", swatch: PALETTE.inkSoft,     textOn: PALETTE.cream,    note: "Voice. The sign-off, the pet phrase, the no-go words.", maps: "→ voice & brand" },
  { name: "Butter", hint: "006 · richness",  swatch: PALETTE.honey,       textOn: PALETTE.midnight, note: "Detail density. Sparse and clean, or layered and rich.", maps: "→ detail & richness" },
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
        background: `radial-gradient(120% 80% at 20% 0%, ${PALETTE.cream} 0%, ${PALETTE.parchment} 55%, #DDE7F5 100%)`,
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
            "radial-gradient(circle at 10% 20%, rgba(20,40,100,0.25) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(30,60,140,0.18) 0, transparent 45%)",
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
              background: i % 3 === 0 ? PALETTE.honey : i % 3 === 1 ? PALETTE.cornflower : PALETTE.inkSoft,
              opacity: 0.35,
              animation: `floatY 6s ease-in-out ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className="text-xs uppercase tracking-[0.4em] transition hover:opacity-60"
          style={{ color: PALETTE.inkSoft }}
        >
          ← layercake
        </Link>
        <div
          className="text-[10px] uppercase tracking-[0.5em]"
          style={{ color: PALETTE.inkSoft, opacity: 0.6 }}
        >
          Ingredients · the copy pantry
        </div>
        <Link
          to="/bake"
          search={{ mode: "copy" as const }}
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
          style={{ color: PALETTE.honey }}
        >
          Volume 02 · the copy pantry
        </p>
        <h1
          className="mt-5 max-w-3xl text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl"
          style={{
            fontFamily: "'Instrument Serif', 'Fredoka', serif",
            color: PALETTE.ink,
          }}
        >
          Stack copy
          <br />
          <span style={{ color: PALETTE.cornflower, fontStyle: "italic" }}>
            the way you stack frosting.
          </span>
        </h1>
        <p
          className="mt-6 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: PALETTE.inkSoft }}
        >
          The copywriting twin of Layercake. Same studio, same wallet, new pantry —
          flour for the brief, sugar for tone, yeast for length, milk for audience,
          salt for voice. One slice per bake.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/bake"
            search={{ mode: "copy" as const }}
            className="rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition hover:-translate-y-0.5"
            style={{
              background: PALETTE.cornflower,
              color: PALETTE.cream,
              boxShadow: `0 16px 30px -16px ${PALETTE.cornflower}`,
            }}
          >
            Whip a piece of copy →
          </Link>
          <button
            className="rounded-full border px-6 py-3 text-sm font-medium tracking-wide transition hover:bg-white/40"
            style={{ borderColor: `${PALETTE.inkSoft}40`, color: PALETTE.inkSoft }}
            onClick={() => {
              const el = document.getElementById("pantry");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Open the pantry
          </button>
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.3em]" style={{ color: PALETTE.inkSoft, opacity: 0.6 }}>
          Costs one slice — same wallet, same checkout as image slices.
        </p>
      </section>

      {/* Featured ingredient */}
      <section className="relative z-10 mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-6 pb-16 md:grid-cols-[1.1fr_1fr] md:px-10">
        <div
          className="relative overflow-hidden rounded-[28px] p-8 md:p-10"
          style={{
            background: current.swatch,
            color: current.textOn,
            minHeight: 380,
            transition: "background 600ms ease, color 600ms ease",
            boxShadow: "0 30px 60px -40px rgba(6,17,47,0.5)",
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
          <p className="mt-6 max-w-sm text-base opacity-85 md:text-lg">{current.note}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] opacity-70">{current.maps}</p>

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

        <div id="pantry" className="rounded-[28px] p-6 md:p-8" style={{ background: PALETTE.cream, border: `1px solid ${PALETTE.inkSoft}1f` }}>
          <div
            className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.4em]"
            style={{ color: PALETTE.inkSoft }}
          >
            <span>Pantry index</span>
            <span>tap to read</span>
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
                      borderTop: i === 0 ? "none" : `1px solid ${PALETTE.inkSoft}1a`,
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
                      <div className="text-[11px] uppercase tracking-[0.3em]" style={{ color: PALETTE.inkSoft, opacity: 0.7 }}>
                        {ing.hint} · {ing.maps.replace("→ ", "")}
                      </div>
                    </div>
                    <span
                      className="text-xs transition"
                      style={{ color: PALETTE.inkSoft, opacity: isActive ? 1 : 0.4 }}
                    >
                      {isActive ? "→ reading" : "read"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Three sample pieces */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div
          className="mb-6 flex items-end justify-between"
          style={{ borderBottom: `1px solid ${PALETTE.inkSoft}33`, paddingBottom: 12 }}
        >
          <h3
            className="text-3xl md:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif", color: PALETTE.ink }}
          >
            Three from the oven.
          </h3>
          <span className="text-[11px] uppercase tracking-[0.4em]" style={{ color: PALETTE.inkSoft }}>
            today's bakes
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: "Sourdough launch caption", layers: [PALETTE.powder, PALETTE.cornflower, PALETTE.honey], tag: "caption", snippet: "We've been feeding her for ten days. Meet Margot — your new starter, shipped warm." },
            { title: "Newsletter intro", layers: [PALETTE.cornflower, PALETTE.inkSoft, PALETTE.cream], tag: "post", snippet: "Three things in the pantry this week: a butter we keep going back to, a tomato variety worth the wait…" },
            { title: "Hero headline pack", layers: [PALETTE.honey, PALETTE.powder, PALETTE.midnight], tag: "headline", snippet: "1. Bread, but on your terms.  2. Slow flour, fast joy.  3. The starter that travels." },
          ].map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[24px] transition hover:-translate-y-1"
              style={{
                background: PALETTE.cream,
                border: `1px solid ${PALETTE.inkSoft}22`,
                boxShadow: "0 20px 40px -30px rgba(6,17,47,0.4)",
              }}
            >
              <div className="flex h-32 w-full">
                {card.layers.map((c, i) => (
                  <div key={i} style={{ background: c, flex: 1 }} />
                ))}
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-[0.4em]" style={{ color: PALETTE.honey }}>
                  {card.tag}
                </div>
                <div
                  className="mt-2 text-xl"
                  style={{ fontFamily: "'Instrument Serif', serif", color: PALETTE.ink }}
                >
                  {card.title}
                </div>
                <p className="mt-2 text-sm italic" style={{ color: PALETTE.inkSoft }}>
                  "{card.snippet}"
                </p>
              </div>
            </article>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-4 border-t pt-6 text-sm md:flex-row md:items-center"
          style={{ borderColor: `${PALETTE.inkSoft}33`, color: PALETTE.inkSoft }}
        >
          <span className="text-[11px] uppercase tracking-[0.4em]">
            One slice per bake — image or copy.
          </span>
          <Link
            to="/bake"
            search={{ mode: "copy" as const }}
            className="underline-offset-4 hover:underline"
          >
            Whip something now →
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
