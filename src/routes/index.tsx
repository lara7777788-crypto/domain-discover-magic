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
  const [exiting, setExiting] = useState<"idle" | "anticipate" | "frame1" | "tween" | "frame2" | "out">("idle");

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

  // Lots of colorful crumb/spray particles
  const particles = useMemo(() => {
    const COLORS = ["#FF6FA3", "#FFB76A", "#FFE070", "#7CC8FF", "#9BE3A4", "#C9A8FF", "#FFFFFF"];
    const arr: { x: number; y: number; dx: number; dy: number; r: number; rot: number; color: string; shape: "rect" | "circle" }[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const dist = 80 + Math.random() * 220;
      arr.push({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 20,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r: 4 + Math.random() * 9,
        rot: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        shape: Math.random() > 0.55 ? "rect" : "circle",
      });
    }
    return arr;
  }, []);

  const handleEnter = () => {
    if (exiting !== "idle" || !fullyBuilt) return;
    setExiting("anticipate");
    window.setTimeout(() => setExiting("frame1"), 140);
    window.setTimeout(() => setExiting("tween"), 360);
    window.setTimeout(() => setExiting("frame2"), 540);
    window.setTimeout(() => setExiting("out"), 880);
    window.setTimeout(() => navigate({ to: "/bake" }), 1080);
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
          }}
        >
          {/* Soft ground shadow */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{
              bottom: 8,
              width:
                exiting === "frame1"
                  ? CAKE_W * 1.05
                  : exiting === "frame2" || exiting === "out"
                  ? CAKE_W * 1.2
                  : CAKE_W * 0.85,
              height: 22,
              background:
                "radial-gradient(ellipse at center, rgba(120,60,110,0.32) 0%, rgba(120,60,110,0) 70%)",
              filter: "blur(2px)",
              opacity: exiting === "out" ? 0 : 1,
              transition: "all 220ms ease-out",
            }}
          />

          {/* FRAME 0 — built layered cake (visible idle + anticipate, fades on frame1) */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 0,
              width: CAKE_W,
              height: CAKE_H,
              opacity: exiting === "idle" || exiting === "anticipate" ? 1 : 0,
              transform:
                exiting === "anticipate"
                  ? "translateY(-22px) scaleY(1.06) scaleX(0.96)"
                  : hover && fullyBuilt && exiting === "idle"
                  ? "translateY(-2px) rotate(-0.6deg)"
                  : "none",
              transformOrigin: "bottom center",
              transition:
                exiting === "anticipate"
                  ? "transform 140ms cubic-bezier(.4,0,.6,1)"
                  : "transform 220ms cubic-bezier(.34,1.5,.55,1), opacity 160ms ease-out",
            }}
          >
            {BANDS.map((band, idx) => {
              const buildStep = BUILD_SEQUENCE.indexOf(idx);
              const isBuilt = built > buildStep;
              const isImpact = impact === idx;
              const top = band.t * CAKE_H;
              const height = (band.b - band.t) * CAKE_H;
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
                    opacity: isBuilt ? 1 : 0,
                    transform: isBuilt
                      ? `translate(0, 0) scaleY(${isImpact ? 0.85 : 1}) scaleX(${isImpact ? 1.04 : 1})`
                      : `translate(0, -${CAKE_H + 80}px)`,
                    transition: isBuilt
                      ? `transform ${isImpact ? 220 : 520}ms ${isImpact ? "cubic-bezier(.34,1.5,.55,1)" : "cubic-bezier(.2,.85,.25,1)"}, opacity 240ms`
                      : "none",
                    transformOrigin: "center bottom",
                    filter: isBuilt ? "drop-shadow(0 2px 3px rgba(120,60,110,0.18))" : "none",
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

          {/* FRAME 1 — drawn squashed cake (SVG) */}
          <svg
            width={CAKE_W * 1.3}
            height={CAKE_H * 0.6}
            viewBox="0 0 260 160"
            style={{
              position: "absolute",
              left: "50%",
              bottom: 4,
              transform: `translateX(-50%) translateY(${
                exiting === "frame1" ? 0 : exiting === "tween" ? 4 : exiting === "frame2" || exiting === "out" ? 10 : 30
              }px) scale(${
                exiting === "frame1" ? 1 : exiting === "tween" ? 1.08 : exiting === "frame2" || exiting === "out" ? 1.15 : 0.5
              })`,
              opacity:
                exiting === "frame1" ? 1 : exiting === "tween" ? 0.55 : exiting === "frame2" || exiting === "out" ? 0 : 0,
              transition: "transform 360ms cubic-bezier(.5,0,.3,1), opacity 320ms ease-out",
              transformOrigin: "bottom center",
              pointerEvents: "none",
              filter: "drop-shadow(0 10px 14px rgba(120,60,110,0.28))",
            }}
            aria-hidden
          >
            <defs>
              <linearGradient id="sq-pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFD6E2" /><stop offset="100%" stopColor="#FF8FB1" /></linearGradient>
              <linearGradient id="sq-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFD9B0" /><stop offset="100%" stopColor="#FFB76A" /></linearGradient>
              <linearGradient id="sq-yellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFF1A8" /><stop offset="100%" stopColor="#FFE070" /></linearGradient>
              <linearGradient id="sq-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8ECFF" /><stop offset="100%" stopColor="#7CC8FF" /></linearGradient>
              <linearGradient id="sq-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D6F4DA" /><stop offset="100%" stopColor="#9BE3A4" /></linearGradient>
            </defs>
            <path d="M 18 150 Q 130 158, 244 150 L 240 134 Q 130 142, 22 134 Z" fill="url(#sq-green)" />
            <path d="M 22 134 Q 130 142, 240 134 L 236 118 Q 130 126, 26 118 Z" fill="url(#sq-blue)" />
            <path d="M 26 118 Q 130 126, 236 118 L 232 102 Q 130 110, 30 102 Z" fill="url(#sq-yellow)" />
            <path d="M 30 102 Q 130 110, 232 102 L 226 86 Q 130 94, 36 86 Z" fill="url(#sq-orange)" />
            <path d="M 36 86 Q 130 94, 226 86 L 218 68 Q 130 78, 44 68 Z" fill="url(#sq-pink)" />
            <path d="M 44 68 Q 80 40, 130 50 Q 180 40, 218 68 Q 200 60, 180 66 Q 160 56, 140 64 Q 120 54, 100 64 Q 80 56, 60 66 Q 50 62, 44 68 Z" fill="#FFFFFF" stroke="#FFD6E2" strokeWidth="1.5" />
            {[[60,78,"#FF6FA3"],[90,60,"#FFD55C"],[120,70,"#7CC8FF"],[150,58,"#86DDA0"],[180,72,"#C9A8FF"],[200,80,"#FF6FA3"]].map(([x,y,c],i)=>(
              <rect key={i} x={x as number} y={y as number} width="4" height="2" rx="1" fill={c as string} transform={`rotate(${i*35} ${x} ${y})`} />
            ))}
          </svg>

          {/* FRAME 2 — flat smear (drawn) */}
          <svg
            width={CAKE_W * 1.6}
            height={CAKE_H * 0.4}
            viewBox="0 0 320 110"
            style={{
              position: "absolute",
              left: "50%",
              bottom: -8,
              transform: `translateX(-50%) scale(${exiting === "frame2" ? 1 : exiting === "tween" ? 0.92 : exiting === "out" ? 1.08 : 0.7})`,
              opacity: exiting === "frame2" ? 1 : exiting === "tween" ? 0.55 : exiting === "out" ? 0 : 0,
              transition: "transform 360ms cubic-bezier(.3,.7,.3,1), opacity 320ms ease-out",
              transformOrigin: "center bottom",
              pointerEvents: "none",
              filter: "drop-shadow(0 6px 10px rgba(120,60,110,0.22))",
            }}
            aria-hidden
          >
            <path d="M 30 90 Q 10 70, 40 60 Q 50 40, 90 50 Q 110 30, 150 48 Q 190 32, 220 52 Q 260 38, 280 60 Q 310 68, 290 92 Q 240 105, 180 96 Q 110 108, 60 100 Q 35 102, 30 90 Z" fill="#FFE0EC" stroke="#FFB3CE" strokeWidth="1.5" />
            <ellipse cx="80" cy="78" rx="22" ry="9" fill="#9BE3A4" opacity="0.85" />
            <ellipse cx="130" cy="68" rx="26" ry="8" fill="#7CC8FF" opacity="0.85" />
            <ellipse cx="180" cy="80" rx="24" ry="9" fill="#FFE070" opacity="0.85" />
            <ellipse cx="225" cy="70" rx="22" ry="8" fill="#FFB76A" opacity="0.85" />
            <ellipse cx="155" cy="86" rx="20" ry="7" fill="#FF8FB1" opacity="0.9" />
            {[[55,60,10,"#FF8FB1"],[105,50,9,"#FFE070"],[200,50,11,"#7CC8FF"],[245,88,10,"#9BE3A4"],[260,64,8,"#C9A8FF"]].map(([x,y,r,c],i)=>(
              <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} />
            ))}
          </svg>

          {/* COLORFUL PARTICLE BURST */}
          {(exiting === "frame1" || exiting === "tween" || exiting === "frame2" || exiting === "out") && (
            <div className="absolute left-1/2 pointer-events-none" style={{ bottom: 30, width: 0, height: 0 }}>
              {particles.map((p, i) => {
                const launched = exiting === "tween" || exiting === "frame2" || exiting === "out";
                const tx = launched ? p.dx : p.x;
                const ty = launched ? p.dy : p.y;
                const delay = (i % 8) * 8;
                return (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: p.r,
                      height: p.shape === "rect" ? p.r * 0.55 : p.r,
                      borderRadius: p.shape === "rect" ? 2 : "50%",
                      background: p.color,
                      transform: `translate(${tx}px, ${ty}px) rotate(${p.rot + (launched ? 180 : 0)}deg)`,
                      opacity: exiting === "out" ? 0 : 1,
                      transition: `transform 520ms cubic-bezier(.2,.7,.2,1) ${delay}ms, opacity 260ms ease-out ${exiting === "out" ? "120ms" : "0ms"}`,
                      boxShadow: "0 1px 2px rgba(80,30,70,0.2)",
                      willChange: "transform, opacity",
                    }}
                  />
                );
              })}
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
