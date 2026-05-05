import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import cakeImg from "../assets/cake-real.jpg";

export const Route = createFileRoute("/")({
  component: Splash,
});

// We slice the realistic cake photo into N horizontal bands and animate each.
const CAKE_W = 300;
const CAKE_H = 380;
const BANDS = 5; // bottom-up order is reversed; index 0 = top band of image
const BAND_H = CAKE_H / BANDS;

function Splash() {
  const navigate = useNavigate();
  // built counts how many bands are placed (0..BANDS). Build bottom-up.
  const [built, setBuilt] = useState(0);
  const [impact, setImpact] = useState<number>(-1);
  const [hover, setHover] = useState(false);
  const [exiting, setExiting] = useState<"idle" | "compress" | "smash" | "out">("idle");

  useEffect(() => {
    const start = 320;
    const stagger = 280;
    const timers: number[] = [];
    for (let i = 1; i <= BANDS; i++) {
      timers.push(
        window.setTimeout(() => {
          setBuilt(i);
          setImpact(i - 1);
          window.setTimeout(() => setImpact((c) => (c === i - 1 ? -1 : c)), 220);
        }, start + i * stagger),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    if (exiting !== "idle") return;
    setExiting("compress");
    window.setTimeout(() => setExiting("smash"), 160);
    window.setTimeout(() => setExiting("out"), 480);
    window.setTimeout(() => navigate({ to: "/bake" }), 760);
  };

  const fullyBuilt = built >= BANDS;

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

        {/* Cake stage */}
        <div
          className="relative mt-8 mb-4"
          style={{
            width: CAKE_W,
            height: CAKE_H + 60,
            transition: "transform 500ms cubic-bezier(.2,.8,.2,1), opacity 320ms",
            transform:
              exiting === "compress"
                ? "scaleY(0.93) scaleX(1.04)"
                : exiting === "smash"
                ? "scale(1.03)"
                : exiting === "out"
                ? "scale(1.08)"
                : hover && fullyBuilt
                ? "translateY(-2px) rotate(-0.6deg)"
                : "none",
            opacity: exiting === "out" ? 0 : 1,
            transformOrigin: "bottom center",
          }}
        >
          {/* Plate / shadow */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{
              bottom: 22,
              width: CAKE_W * 0.92,
              height: 32,
              background:
                "radial-gradient(ellipse at center, rgba(120,60,110,0.32) 0%, rgba(120,60,110,0) 70%)",
              filter: "blur(2px)",
            }}
          />
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              bottom: 10,
              width: CAKE_W * 0.95,
              height: 22,
              background:
                "linear-gradient(180deg, #FFFFFF 0%, #F1DDE8 100%)",
              boxShadow: "0 6px 14px -6px rgba(120,60,110,0.35)",
              border: "1px solid rgba(229,196,216,0.9)",
            }}
          />

          {/* Bands — index 0 = topmost band of image; we build bottom-up so render reversed */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: 28, width: CAKE_W, height: CAKE_H }}
          >
            {Array.from({ length: BANDS }).map((_, idxFromTop) => {
              // build order: bottom band first. bottom band index = BANDS-1
              const buildOrder = BANDS - 1 - idxFromTop; // 0 = first to appear (bottom)
              const isBuilt = built > buildOrder;
              const isImpact = impact === buildOrder;
              const top = idxFromTop * BAND_H;

              const smash = exiting === "smash" || exiting === "out";
              // each band shifts: bottom bands stay, upper bands lift & slide
              const dy = smash ? -(BANDS - 1 - idxFromTop) * 14 : 0;
              const dx = smash ? (idxFromTop % 2 === 0 ? -1 : 1) * (idxFromTop * 6) : 0;
              const rot = smash ? (idxFromTop % 2 === 0 ? -1 : 1) * (idxFromTop * 1.5) : 0;

              return (
                <div
                  key={idxFromTop}
                  style={{
                    position: "absolute",
                    top,
                    left: 0,
                    width: CAKE_W,
                    height: BAND_H + 1, // +1 to avoid hairline gap
                    overflow: "hidden",
                    transform: isBuilt
                      ? `translate(${dx}px, ${dy}px) scaleY(${isImpact ? 0.88 : 1}) scaleX(${isImpact ? 1.03 : 1}) rotate(${rot}deg)`
                      : `translate(0, -${CAKE_H + 80}px)`,
                    opacity: isBuilt ? 1 : 0,
                    transition: isBuilt
                      ? `transform ${isImpact ? 240 : 560}ms ${isImpact ? "cubic-bezier(.34,1.5,.55,1)" : "cubic-bezier(.2,.85,.25,1)"}, opacity 320ms`
                      : "none",
                    transformOrigin: "center bottom",
                    filter: isBuilt
                      ? `drop-shadow(0 ${2 + idxFromTop}px ${4 + idxFromTop}px rgba(120,60,110,${0.10 + idxFromTop * 0.03}))`
                      : "none",
                  }}
                >
                  <img
                    src={cakeImg}
                    alt=""
                    draggable={false}
                    style={{
                      position: "absolute",
                      top: -top,
                      left: 0,
                      width: CAKE_W,
                      height: CAKE_H,
                      objectFit: "cover",
                      objectPosition: "center",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {fullyBuilt && exiting === "idle" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ animation: "breathe 4s ease-in-out infinite" }}
            />
          )}
        </div>

        {/* Slice-of-cake CTA */}
        <button
          type="button"
          onClick={handleEnter}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          disabled={exiting !== "idle"}
          aria-label="Enter the bakery"
          className="group relative mt-2"
          style={{
            opacity: fullyBuilt ? 1 : 0,
            transform:
              exiting === "compress"
                ? "scaleY(0.7) scaleX(1.15)"
                : exiting === "smash" || exiting === "out"
                ? "scaleY(0.4) scaleX(1.4) translateY(8px)"
                : fullyBuilt
                ? hover
                  ? "translateY(-3px) scale(1.03)"
                  : "translateY(0)"
                : "translateY(8px)",
            transition: "transform 260ms cubic-bezier(.34,1.5,.55,1), opacity 500ms",
            transformOrigin: "bottom center",
            filter: hover && fullyBuilt ? "drop-shadow(0 16px 24px rgba(255,111,163,0.45))" : "drop-shadow(0 10px 18px rgba(120,60,110,0.25))",
            animation:
              fullyBuilt && exiting === "idle" && !hover
                ? "btnPulse 2.6s ease-in-out infinite"
                : undefined,
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: exiting === "idle" ? "pointer" : "default",
          }}
        >
          {/* Slice SVG with text inside */}
          <svg width="260" height="120" viewBox="0 0 260 120" style={{ display: "block" }}>
            <defs>
              <linearGradient id="sliceFrost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE0EC" />
                <stop offset="100%" stopColor="#FFB3CE" />
              </linearGradient>
              <linearGradient id="sliceSponge1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD6E2" />
                <stop offset="100%" stopColor="#F49AB6" />
              </linearGradient>
              <linearGradient id="sliceSponge2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE89A" />
                <stop offset="100%" stopColor="#F2C24A" />
              </linearGradient>
              <linearGradient id="sliceSponge3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8F1CE" />
                <stop offset="100%" stopColor="#86CE9A" />
              </linearGradient>
            </defs>
            {/* Slice triangle (point left, base right). Layered as top frosting + 3 sponge stripes */}
            <g>
              {/* Plate shadow */}
              <ellipse cx="135" cy="110" rx="100" ry="6" fill="rgba(120,60,110,0.18)" />
              {/* Top frosting curve */}
              <path
                d="M 30 38 Q 130 8, 240 30 L 240 50 Q 130 28, 30 56 Z"
                fill="url(#sliceFrost)"
              />
              {/* Sponge bands */}
              <path d="M 30 56 Q 130 28, 240 50 L 240 70 Q 130 48, 30 76 Z" fill="url(#sliceSponge1)" />
              <path d="M 30 76 Q 130 48, 240 70 L 240 88 Q 130 66, 30 92 Z" fill="url(#sliceSponge2)" />
              <path d="M 30 92 Q 130 66, 240 88 L 240 102 Q 130 80, 30 102 Z" fill="url(#sliceSponge3)" />
              {/* Frosting swirl on top */}
              <ellipse cx="200" cy="22" rx="14" ry="10" fill="#FFFFFF" stroke="#FFB3CE" strokeWidth="1.5" />
              <ellipse cx="200" cy="20" rx="9" ry="6" fill="#FFD6E5" />
              <circle cx="200" cy="14" r="4" fill="#FF6FA3" />
              {/* Sprinkles */}
              {[
                [60, 36, "#FF6FA3"],
                [90, 30, "#FFD55C"],
                [120, 26, "#7CBEF5"],
                [150, 24, "#86DDA0"],
                [170, 27, "#C9A8FF"],
              ].map(([x, y, c], i) => (
                <rect key={i} x={x as number} y={y as number} width="5" height="2" rx="1" fill={c as string} transform={`rotate(${i * 30} ${x} ${y})`} />
              ))}
            </g>
            {/* Label */}
            <text
              x="135"
              y="78"
              textAnchor="middle"
              fontFamily="Fredoka, system-ui, sans-serif"
              fontWeight="600"
              fontSize="16"
              fill="#3a2438"
              style={{ letterSpacing: "-0.01em" }}
            >
              Enter the bakery →
            </text>
          </svg>
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
