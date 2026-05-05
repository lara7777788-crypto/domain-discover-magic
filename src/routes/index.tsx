import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Splash,
});

// Layer config — bottom to top. Matches product layers (Visual / Text / Layout / Logo / Prompt-cherry)
const LAYERS = [
  { w: 240, h: 44, fill: "#FFB6C9", drip: "#FF8FB1", label: "visual" },   // strawberry
  { w: 210, h: 40, fill: "#FFE07A", drip: "#FFC83D", label: "text" },     // melon
  { w: 180, h: 38, fill: "#A8DCFF", drip: "#7BC4FF", label: "layout" },   // ramune
  { w: 150, h: 36, fill: "#B7EFC0", drip: "#86DDA0", label: "logo" },     // matcha
];

function Splash() {
  const navigate = useNavigate();
  const [built, setBuilt] = useState<number>(0); // 0..LAYERS.length, then +1 for cherry
  const [exiting, setExiting] = useState<"idle" | "compress" | "smash">("idle");

  // Build layer-by-layer
  useEffect(() => {
    const total = LAYERS.length + 1; // include cherry
    const start = 300;
    const stagger = 280;
    const timers: number[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(window.setTimeout(() => setBuilt(i), start + i * stagger));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    if (exiting !== "idle") return;
    setExiting("compress");
    window.setTimeout(() => setExiting("smash"), 160);
    window.setTimeout(() => navigate({ to: "/bake" }), 720);
  };

  // Cake geometry
  const W = 360;
  const H = 420;
  const baseY = H - 60;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 22%, #FFF5C2 42%, #DFF5DD 62%, #DCEEFF 82%, #ECE0FF 100%)",
        }}
      />

      {/* Drifting confetti */}
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

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="font-display text-xl font-semibold tracking-tight text-foreground/80">
          layercake
          <span style={{ color: "#FF6FA3" }}>.</span>
        </div>
        <div className="hidden text-[11px] uppercase tracking-[0.3em] text-foreground/50 md:block">
          est. 2026 · small batches
        </div>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 text-center">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/55">
          A new kind of visual studio
        </p>

        <h1 className="font-display text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
          Make beautiful things,
          <br />
          <span className="italic text-foreground/70">layer by layer.</span>
        </h1>

        {/* Cake */}
        <div
          className="relative mt-8 mb-10"
          style={{
            width: W,
            height: H,
            transition: "transform 500ms cubic-bezier(.2,.8,.2,1), opacity 400ms",
            transform:
              exiting === "compress"
                ? "scaleY(0.92) scaleX(1.04)"
                : exiting === "smash"
                ? "scale(1.05)"
                : "none",
            opacity: exiting === "smash" ? 0 : 1,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-10 bottom-6 h-10 rounded-full blur-2xl"
            style={{ background: "rgba(255,140,180,0.35)" }}
          />
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className={built > LAYERS.length && exiting === "idle" ? "animate-wobble" : ""}
            style={{ transformOrigin: "bottom center" }}
            aria-label="A layered cake building itself"
          >
            {/* Plate */}
            <ellipse
              cx={W / 2}
              cy={baseY + 16}
              rx={150}
              ry={12}
              fill="#FFFFFF"
              stroke="#E9C9DC"
              strokeWidth="2"
              style={{
                transition: "opacity 300ms",
                opacity: 0.95,
              }}
            />

            {/* Layers (bottom up) */}
            {LAYERS.map((layer, i) => {
              const isBuilt = built > i;
              // Stack: each layer sits on top of previous
              const stackedH = LAYERS.slice(0, i).reduce((acc, l) => acc + l.h, 0);
              const y = baseY - stackedH - layer.h;
              const x = (W - layer.w) / 2;

              // Smash: separate horizontally
              const smashOffset =
                exiting === "smash" ? (i % 2 === 0 ? -1 : 1) * (40 + i * 18) : 0;
              const smashY = exiting === "smash" ? -i * 10 : 0;

              return (
                <g
                  key={layer.label}
                  style={{
                    transform: isBuilt
                      ? `translate(${smashOffset}px, ${smashY}px)`
                      : `translate(0px, 60px)`,
                    opacity: isBuilt ? 1 : 0,
                    transition: `transform 600ms cubic-bezier(.34,1.4,.55,1) ${i * 60}ms, opacity 400ms ${i * 60}ms`,
                    transformOrigin: "center",
                  }}
                >
                  {/* Drip frosting on top */}
                  <path
                    d={`M ${x} ${y + 10}
                        Q ${x + layer.w * 0.15} ${y + 22}, ${x + layer.w * 0.3} ${y + 12}
                        T ${x + layer.w * 0.6} ${y + 12}
                        T ${x + layer.w * 0.9} ${y + 12}
                        L ${x + layer.w} ${y + 10}
                        L ${x + layer.w} ${y}
                        L ${x} ${y} Z`}
                    fill={layer.drip}
                  />
                  {/* Sponge */}
                  <rect
                    x={x}
                    y={y + 10}
                    width={layer.w}
                    height={layer.h - 10}
                    rx="4"
                    fill={layer.fill}
                    stroke="#3a2438"
                    strokeOpacity="0.15"
                    strokeWidth="1"
                  />
                  {/* Sprinkles */}
                  {[0.2, 0.45, 0.7].map((p, j) => (
                    <rect
                      key={j}
                      x={x + layer.w * p}
                      y={y + 22 + (j % 2) * 4}
                      width="5"
                      height="2"
                      rx="1"
                      fill="#3a2438"
                      opacity="0.55"
                      transform={`rotate(${j * 40} ${x + layer.w * p + 2.5} ${y + 24})`}
                    />
                  ))}
                </g>
              );
            })}

            {/* Cherry on top */}
            {(() => {
              const stackedH = LAYERS.reduce((acc, l) => acc + l.h, 0);
              const cy = baseY - stackedH - 14;
              const cx = W / 2;
              const isBuilt = built > LAYERS.length;
              const smashY = exiting === "smash" ? -120 : 0;
              const smashRot = exiting === "smash" ? 35 : 0;
              return (
                <g
                  style={{
                    transform: isBuilt
                      ? `translate(0px, ${smashY}px) rotate(${smashRot}deg)`
                      : `translate(0px, -40px) scale(0.3)`,
                    opacity: isBuilt ? 1 : 0,
                    transition:
                      "transform 700ms cubic-bezier(.34,1.6,.5,1), opacity 400ms",
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                >
                  <path
                    d={`M ${cx} ${cy} Q ${cx + 6} ${cy - 18}, ${cx + 14} ${cy - 24}`}
                    stroke="#86DDA0"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx={cx} cy={cy} r="11" fill="#FF6FA3" stroke="#3a2438" strokeOpacity="0.3" strokeWidth="1" />
                  <circle cx={cx - 3} cy={cy - 3} r="3" fill="#FFFFFF" opacity="0.7" />
                </g>
              );
            })()}
          </svg>
        </div>

        <button
          type="button"
          onClick={handleEnter}
          disabled={exiting !== "idle"}
          className="group relative inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-4 text-sm font-medium tracking-wide text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] disabled:opacity-60"
          style={{
            animation:
              built > LAYERS.length && exiting === "idle"
                ? "btnPulse 2.4s ease-in-out infinite"
                : undefined,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/70 transition-all group-hover:bg-white" />
          Enter the bakery
          <span className="text-white/50 transition-transform group-hover:translate-x-0.5">→</span>
        </button>

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
