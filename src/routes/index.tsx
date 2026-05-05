import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Splash,
});

// Layer config — bottom to top.
// Each layer: sponge color (top/bottom for gradient), frosting (drip + accent)
const LAYERS = [
  { w: 250, h: 48, top: "#FFC8D8", bot: "#F49AB6", frostTop: "#FFE9F0", frostBot: "#FFB7CE", label: "visual" },
  { w: 218, h: 44, top: "#FFE89A", bot: "#F2C24A", frostTop: "#FFF6CF", frostBot: "#FFD969", label: "text" },
  { w: 186, h: 42, top: "#BFE3FF", bot: "#7CBEF5", frostTop: "#E4F2FF", frostBot: "#9FCFFB", label: "layout" },
  { w: 154, h: 40, top: "#C8F1CE", bot: "#86CE9A", frostTop: "#E6F8E9", frostBot: "#A6DFB4", label: "logo" },
];

function Splash() {
  const navigate = useNavigate();
  const [built, setBuilt] = useState(0);
  const [impact, setImpact] = useState<number>(-1); // index of layer currently impacting
  const [hover, setHover] = useState(false);
  const [exiting, setExiting] = useState<"idle" | "compress" | "activate" | "out">("idle");
  const cakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = LAYERS.length + 1;
    const start = 320;
    const stagger = 320;
    const timers: number[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(
        window.setTimeout(() => {
          setBuilt(i);
          setImpact(i - 1);
          window.setTimeout(() => setImpact((cur) => (cur === i - 1 ? -1 : cur)), 220);
        }, start + i * stagger),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    if (exiting !== "idle") return;
    setExiting("compress");
    window.setTimeout(() => setExiting("activate"), 150);
    window.setTimeout(() => setExiting("out"), 420);
    window.setTimeout(() => navigate({ to: "/bake" }), 740);
  };

  const W = 380;
  const H = 440;
  const baseY = H - 70;
  const fullyBuilt = built > LAYERS.length;

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

      {/* Confetti */}
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
          layercake<span style={{ color: "#FF6FA3" }}>.</span>
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

        {/* Cake stage — clickable */}
        <div
          ref={cakeRef}
          role="button"
          tabIndex={0}
          aria-label="Enter the bakery"
          onClick={handleEnter}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleEnter()}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="relative mt-8 mb-4 cursor-pointer select-none"
          style={{
            width: W,
            height: H,
            transition: "transform 500ms cubic-bezier(.2,.8,.2,1), opacity 320ms ease-out",
            transform:
              exiting === "compress"
                ? "scaleY(0.94) scaleX(1.03)"
                : exiting === "activate"
                ? "scale(1.02)"
                : exiting === "out"
                ? "scale(1.04)"
                : hover && fullyBuilt
                ? "translateY(-2px) rotate(-0.6deg)"
                : "none",
            opacity: exiting === "out" ? 0 : 1,
            transformOrigin: "bottom center",
          }}
        >
          {/* Soft ground shadow */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{
              bottom: 36,
              width: 240,
              height: 28,
              background:
                "radial-gradient(ellipse at center, rgba(120,60,110,0.28) 0%, rgba(120,60,110,0) 70%)",
              filter: "blur(2px)",
              transition: "all 400ms",
              transform: hover && fullyBuilt ? "scaleX(1.05)" : "scaleX(1)",
              opacity: fullyBuilt ? 1 : 0.5,
            }}
          />

          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ overflow: "visible", display: "block" }}
            aria-hidden
          >
            <defs>
              {LAYERS.map((l, i) => (
                <g key={`def-${i}`}>
                  <linearGradient id={`sponge-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={l.top} />
                    <stop offset="100%" stopColor={l.bot} />
                  </linearGradient>
                  <linearGradient id={`frost-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={l.frostTop} />
                    <stop offset="100%" stopColor={l.frostBot} />
                  </linearGradient>
                </g>
              ))}
              {/* Plate gradient */}
              <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1DDE8" />
              </linearGradient>
              {/* Cherry gradient */}
              <radialGradient id="cherry" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFB0C7" />
                <stop offset="55%" stopColor="#FF6FA3" />
                <stop offset="100%" stopColor="#C8407A" />
              </radialGradient>
              {/* Glow filter for activation */}
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Plate */}
            <ellipse cx={W / 2} cy={baseY + 22} rx={158} ry={8} fill="rgba(120,60,110,0.18)" />
            <ellipse cx={W / 2} cy={baseY + 16} rx={155} ry={11} fill="url(#plate)" stroke="#E5C4D8" strokeWidth="1.5" />
            <ellipse cx={W / 2} cy={baseY + 13} rx={150} ry={4} fill="#FFFFFF" opacity="0.6" />

            {/* Layers */}
            {LAYERS.map((layer, i) => {
              const isBuilt = built > i;
              const stackedH = LAYERS.slice(0, i).reduce((acc, l) => acc + l.h, 0);
              const y = baseY - stackedH - layer.h;
              const x = (W - layer.w) / 2;

              const isImpact = impact === i;
              // Activation: layers separate slightly upward & spread
              const sep = exiting === "activate" || exiting === "out";
              const sepY = sep ? -(LAYERS.length - i) * 8 : 0;
              const sepScale = sep ? 1 + i * 0.01 : 1;

              return (
                <g
                  key={layer.label}
                  style={{
                    transform: isBuilt
                      ? `translate(0px, ${sepY}px) scaleY(${isImpact ? 0.9 : 1}) scaleX(${isImpact ? 1.04 : sepScale})`
                      : `translate(0px, -${H * 0.6}px) scaleY(0.85)`,
                    opacity: isBuilt ? 1 : 0,
                    transition: isBuilt
                      ? `transform ${isImpact ? 220 : 520}ms ${isImpact ? "cubic-bezier(.34,1.4,.55,1)" : "cubic-bezier(.2,.8,.25,1)"}, opacity 320ms`
                      : "none",
                    transformOrigin: `${W / 2}px ${y + layer.h}px`,
                  }}
                >
                  {/* Bottom shadow under layer (subtle) */}
                  <ellipse
                    cx={W / 2}
                    cy={y + layer.h - 1}
                    rx={layer.w / 2 - 4}
                    ry={3}
                    fill="rgba(80,30,70,0.18)"
                    style={{ filter: "blur(1.5px)" }}
                  />

                  {/* Sponge body */}
                  <rect
                    x={x}
                    y={y + 12}
                    width={layer.w}
                    height={layer.h - 12}
                    rx={6}
                    fill={`url(#sponge-${i})`}
                  />
                  {/* Inner highlight on sponge top edge */}
                  <rect
                    x={x + 2}
                    y={y + 13}
                    width={layer.w - 4}
                    height={2}
                    rx={1}
                    fill="#FFFFFF"
                    opacity="0.35"
                  />
                  {/* Subtle texture dots */}
                  {[0.18, 0.42, 0.66, 0.84].map((p, j) => (
                    <circle
                      key={j}
                      cx={x + layer.w * p}
                      cy={y + 24 + (j % 2) * 6}
                      r={0.9}
                      fill="#3a2438"
                      opacity="0.18"
                    />
                  ))}
                  {/* Bottom shading inside sponge */}
                  <rect
                    x={x}
                    y={y + layer.h - 6}
                    width={layer.w}
                    height={6}
                    rx={3}
                    fill="rgba(60,20,50,0.12)"
                  />

                  {/* Frosting drip on top — soft */}
                  <path
                    d={`M ${x} ${y + 14}
                        C ${x + layer.w * 0.08} ${y + 26}, ${x + layer.w * 0.16} ${y + 26}, ${x + layer.w * 0.24} ${y + 14}
                        C ${x + layer.w * 0.32} ${y + 28}, ${x + layer.w * 0.40} ${y + 28}, ${x + layer.w * 0.48} ${y + 14}
                        C ${x + layer.w * 0.56} ${y + 26}, ${x + layer.w * 0.64} ${y + 26}, ${x + layer.w * 0.72} ${y + 14}
                        C ${x + layer.w * 0.80} ${y + 28}, ${x + layer.w * 0.88} ${y + 28}, ${x + layer.w} ${y + 14}
                        L ${x + layer.w} ${y + 2}
                        Q ${x + layer.w / 2} ${y - 4}, ${x} ${y + 2} Z`}
                    fill={`url(#frost-${i})`}
                  />
                  {/* Frosting top sheen */}
                  <path
                    d={`M ${x + 8} ${y + 4} Q ${x + layer.w / 2} ${y - 1}, ${x + layer.w - 8} ${y + 4}`}
                    stroke="#FFFFFF"
                    strokeOpacity="0.55"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Sprinkles */}
                  {[0.22, 0.5, 0.78].map((p, j) => (
                    <rect
                      key={j}
                      x={x + layer.w * p}
                      y={y + 26 + (j % 2) * 4}
                      width={5}
                      height={2}
                      rx={1}
                      fill={["#FF6FA3", "#FFD55C", "#7CBEF5", "#86DDA0"][(i + j) % 4]}
                      opacity="0.9"
                      transform={`rotate(${j * 45} ${x + layer.w * p + 2.5} ${y + 28})`}
                    />
                  ))}
                </g>
              );
            })}

            {/* Cherry */}
            {(() => {
              const stackedH = LAYERS.reduce((acc, l) => acc + l.h, 0);
              const cy = baseY - stackedH - 12;
              const cx = W / 2;
              const isBuilt = built > LAYERS.length;
              const sep = exiting === "activate" || exiting === "out";
              const sepY = sep ? -50 : 0;
              return (
                <g
                  style={{
                    transform: isBuilt
                      ? `translate(0px, ${sepY}px) scale(${impact === LAYERS.length ? 1.15 : 1})`
                      : `translate(0px, -60px) scale(0.2)`,
                    opacity: isBuilt ? 1 : 0,
                    transition:
                      "transform 700ms cubic-bezier(.34,1.6,.5,1), opacity 400ms",
                    transformOrigin: `${cx}px ${cy}px`,
                    filter: exiting === "activate" || exiting === "out" ? "url(#glow)" : undefined,
                  }}
                >
                  <path
                    d={`M ${cx} ${cy - 2} Q ${cx + 7} ${cy - 20}, ${cx + 16} ${cy - 26}`}
                    stroke="#5BA86F"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <ellipse cx={cx + 18} cy={cy - 24} rx={6} ry={3} fill="#86DDA0" transform={`rotate(20 ${cx + 18} ${cy - 24})`} />
                  <circle cx={cx} cy={cy} r="13" fill="url(#cherry)" />
                  <ellipse cx={cx - 4} cy={cy - 4} rx={3.5} ry={2.5} fill="#FFFFFF" opacity="0.75" />
                </g>
              );
            })()}
          </svg>

          {/* Idle breathing wrapper handled by class */}
          {fullyBuilt && exiting === "idle" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ animation: "breathe 4s ease-in-out infinite" }}
            />
          )}
        </div>

        {/* CTA — visually tethered to cake */}
        <button
          type="button"
          onClick={handleEnter}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          disabled={exiting !== "idle"}
          className="group relative inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-4 text-sm font-medium tracking-wide text-white transition-all hover:-translate-y-0.5 disabled:opacity-70"
          style={{
            boxShadow:
              hover && fullyBuilt
                ? "0 18px 44px -12px rgba(255,111,163,0.55), 0 0 0 4px rgba(255,255,255,0.6)"
                : "0 10px 30px -10px rgba(0,0,0,0.45)",
            opacity: fullyBuilt ? 1 : 0,
            transform: fullyBuilt ? "translateY(0)" : "translateY(8px)",
            transitionProperty: "transform, opacity, box-shadow",
            transitionDuration: "500ms",
            animation:
              fullyBuilt && exiting === "idle"
                ? "btnPulse 2.6s ease-in-out infinite"
                : undefined,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/70 transition-all group-hover:bg-white" />
          Enter the bakery
          <span className="text-white/60 transition-transform group-hover:translate-x-0.5">→</span>
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
