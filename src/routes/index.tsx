import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import cakeImg from "../assets/cake-bright.png";

export const Route = createFileRoute("/")({
  component: Splash,
});

// Image is 1024x1024 transparent PNG. Bands are tuned to the actual cake.
// Each band: [topFrac, bottomFrac] within the image, plus a label color for crumbs.
const BANDS = [
  { t: 0.000, b: 0.278, color: "#FFE0EC" }, // top frosting cap (built last)
  { t: 0.278, b: 0.420, color: "#FF8FB1" }, // pink
  { t: 0.420, b: 0.561, color: "#FFB76A" }, // orange
  { t: 0.561, b: 0.698, color: "#FFE070" }, // yellow
  { t: 0.698, b: 0.830, color: "#7CC8FF" }, // blue
  { t: 0.830, b: 0.977, color: "#9BE3A4" }, // green
];

const CAKE_W = 280;
const CAKE_H = 280; // image is square
// Build order bottom-up: index 5 (green) first … index 0 (cap) last
const BUILD_SEQUENCE = [5, 4, 3, 2, 1, 0];

function Splash() {
  const navigate = useNavigate();
  const [built, setBuilt] = useState(0); // count of pieces placed
  const [impact, setImpact] = useState<number>(-1); // band index of current impact
  const [hover, setHover] = useState(false);
  const [exiting, setExiting] = useState<"idle" | "anticipate" | "squash" | "burst" | "out">("idle");

  useEffect(() => {
    const start = 280;
    const stagger = 240;
    const timers: number[] = [];
    BUILD_SEQUENCE.forEach((bandIdx, step) => {
      timers.push(
        window.setTimeout(() => {
          setBuilt(step + 1);
          setImpact(bandIdx);
          window.setTimeout(() => setImpact((c) => (c === bandIdx ? -1 : c)), 200);
        }, start + (step + 1) * stagger),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Pre-compute crumb particles
  const crumbs = useMemo(() => {
    const out: { x: number; y: number; dx: number; dy: number; r: number; rot: number; color: string }[] = [];
    BANDS.forEach((b) => {
      const cy = ((b.t + b.b) / 2) * CAKE_H;
      for (let k = 0; k < 8; k++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 180;
        out.push({
          x: CAKE_W / 2 + (Math.random() - 0.5) * CAKE_W * 0.7,
          y: cy + (Math.random() - 0.5) * 16,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 60, // bias upward
          r: 6 + Math.random() * 10,
          rot: Math.random() * 360,
          color: b.color,
        });
      }
    });
    return out;
  }, []);

  const handleEnter = () => {
    if (exiting !== "idle") return;
    setExiting("anticipate");
    window.setTimeout(() => setExiting("squash"), 130);
    window.setTimeout(() => setExiting("burst"), 360);
    window.setTimeout(() => setExiting("out"), 620);
    window.setTimeout(() => navigate({ to: "/bake" }), 820);
  };

  const fullyBuilt = built >= BUILD_SEQUENCE.length;

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
          className="relative mt-8 mb-6"
          style={{
            width: CAKE_W,
            height: CAKE_H + 36,
            transition:
              exiting === "anticipate"
                ? "transform 130ms cubic-bezier(.4,0,.6,1)"
                : exiting === "squash"
                ? "transform 220ms cubic-bezier(.7,0,.3,1)"
                : exiting === "burst" || exiting === "out"
                ? "transform 260ms cubic-bezier(.2,.8,.2,1), opacity 260ms ease-out"
                : "transform 220ms cubic-bezier(.34,1.5,.55,1), opacity 200ms",
            transform:
              exiting === "anticipate"
                ? "translateY(-22px) scaleY(1.06) scaleX(0.96)"
                : exiting === "squash"
                ? "translateY(8px) scaleY(0.18) scaleX(1.55)"
                : exiting === "burst"
                ? "translateY(8px) scaleY(0.22) scaleX(1.5)"
                : exiting === "out"
                ? "translateY(8px) scaleY(0.22) scaleX(1.5)"
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
              bottom: 8,
              width: CAKE_W * 0.85,
              height: 22,
              background:
                "radial-gradient(ellipse at center, rgba(120,60,110,0.32) 0%, rgba(120,60,110,0) 70%)",
              filter: "blur(2px)",
              opacity: exiting === "smash" || exiting === "out" ? 0 : 1,
              transition: "opacity 200ms",
            }}
          />

          {/* Cake bands */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: 0, width: CAKE_W, height: CAKE_H }}
          >
            {BANDS.map((band, idx) => {
              const buildStep = BUILD_SEQUENCE.indexOf(idx);
              const isBuilt = built > buildStep;
              const isImpact = impact === idx;
              const top = band.t * CAKE_H;
              const height = (band.b - band.t) * CAKE_H;

              const burst = exiting === "burst" || exiting === "out";

              // Slight per-band rotation skew during squash for a smushed look
              const squashing = exiting === "squash" || exiting === "burst" || exiting === "out";
              const skew = squashing ? (idx % 2 === 0 ? -3 : 3) : 0;

              return (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    top,
                    left: 0,
                    width: CAKE_W,
                    height: height + 1,
                    overflow: "hidden",
                    opacity: isBuilt ? (burst ? 0 : 1) : 0,
                    transform: isBuilt
                      ? `translate(0, 0) scaleY(${isImpact ? 0.85 : 1}) scaleX(${isImpact ? 1.04 : 1}) skewX(${skew}deg)`
                      : `translate(0, -${CAKE_H + 80}px)`,
                    transition: isBuilt
                      ? burst
                        ? "opacity 220ms ease-out"
                        : `transform ${isImpact ? 220 : 520}ms ${isImpact ? "cubic-bezier(.34,1.5,.55,1)" : "cubic-bezier(.2,.85,.25,1)"}, opacity 240ms`
                      : "none",
                    transformOrigin: "center bottom",
                    filter: isBuilt && !burst ? "drop-shadow(0 2px 3px rgba(120,60,110,0.18))" : "none",
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
                      objectFit: "contain",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Crumb particles */}
          {(exiting === "burst" || exiting === "out") && (
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ top: 0, width: CAKE_W, height: CAKE_H }}
            >
              {crumbs.map((c, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: c.x,
                    top: c.y,
                    width: c.r,
                    height: c.r * 0.7,
                    borderRadius: 3,
                    background: c.color,
                    transform: `translate(${c.dx}px, ${c.dy}px) rotate(${c.rot}deg)`,
                    opacity: exiting === "out" ? 0 : 1,
                    transition: `transform 420ms cubic-bezier(.2,.7,.2,1), opacity 200ms ease-out ${exiting === "out" ? "100ms" : "0ms"}`,
                    boxShadow: "0 1px 2px rgba(80,30,70,0.25)",
                  }}
                />
              ))}
            </div>
          )}

          {fullyBuilt && exiting === "idle" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ animation: "breathe 4s ease-in-out infinite" }}
            />
          )}
        </div>

        {/* Simple CTA */}
        <button
          type="button"
          onClick={handleEnter}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          disabled={exiting !== "idle"}
          className="rounded-full px-8 py-3.5 text-sm font-medium text-white transition-all disabled:opacity-70"
          style={{
            background: "#FF6FA3",
            boxShadow: hover && fullyBuilt
              ? "0 14px 30px -10px rgba(255,111,163,0.6)"
              : "0 8px 20px -8px rgba(255,111,163,0.5)",
            opacity: fullyBuilt ? 1 : 0,
            transform: fullyBuilt ? (hover ? "translateY(-2px)" : "translateY(0)") : "translateY(8px)",
            transition: "transform 220ms ease-out, opacity 400ms, box-shadow 220ms",
            animation:
              fullyBuilt && exiting === "idle" && !hover
                ? "btnPulse 2.6s ease-in-out infinite"
                : undefined,
          }}
        >
          Enter the bakery →
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
