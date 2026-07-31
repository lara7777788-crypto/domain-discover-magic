// Glam splash hero: velvet stage, spotlight, mirrored cake, chrome type.
import { useEffect, useState } from "react";
import cakeImg from "../assets/cake-bright.webp";

const CAKE = 320;

const TICKER = [
  "brand identities",
  "posters",
  "packaging",
  "editorial",
  "social campaigns",
  "character worlds",
  "copy that matches",
];

export function GlamHero({ onEnter }: { onEnter: () => void }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLit(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="glam-stage relative z-10 overflow-hidden">
      {/* velvet backdrop + spotlight */}
      <div aria-hidden className="glam-velvet" />
      <div aria-hidden className="glam-spot" style={{ opacity: lit ? 1 : 0 }} />
      <div aria-hidden className="glam-beam" style={{ opacity: lit ? 1 : 0 }} />
      <div aria-hidden className="glam-sparkles">
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 41) % 100}%`,
              top: `${(i * 67) % 100}%`,
              animationDelay: `${(i % 9) * 0.55}s`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-14 text-center md:pt-20">
        <span className="glam-chip">Layercake · visual identity studio</span>

        <h1 className="glam-title mt-7" style={{ fontSize: "clamp(3rem, 11vw, 8.5rem)" }}>
          <span className="glam-shine block">Control</span>
          <span className="glam-serif block">your</span>
          <span className="glam-shine block">noise.</span>
        </h1>

        <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-white/70 md:text-lg">
          One prompt in. A whole visual world out — logo, palette, type, imagery and the copy
          to match. Baked layer by layer, in your taste.
        </p>

        {/* cake on a mirrored pedestal */}
        <div
          className="relative mt-10 flex flex-col items-center"
          style={{
            opacity: lit ? 1 : 0,
            transform: lit ? "translateY(0) scale(1)" : "translateY(28px) scale(0.94)",
            transition: "opacity 900ms ease-out, transform 1100ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <div className="glam-halo" aria-hidden />
          <img
            src={cakeImg}
            alt="A layered Layercake slice glowing under a studio spotlight"
            width={CAKE}
            height={CAKE}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="glam-cake animate-floaty"
            style={{ width: CAKE, height: CAKE }}
          />
          <div className="glam-reflection-clip" aria-hidden>
            <img
              src={cakeImg}
              alt=""
              width={CAKE}
              height={CAKE}
              draggable={false}
              className="glam-cake-reflection"
              style={{ width: CAKE, height: CAKE }}
            />
          </div>
          <div className="glam-floor" aria-hidden />

          <div className="glam-tags">
            <span className="glam-tag">06 layers</span>
            <span className="glam-tag">one slice</span>
            <span className="glam-tag">your world</span>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <button type="button" onClick={onEnter} className="btn-glam">
            Bake your first slice — free
          </button>
          <a href="#showcase" className="glam-link">
            See what comes out ↓
          </a>
        </div>

        <p className="mt-5 text-xs uppercase tracking-[0.28em] text-white/45">
          First slice on the house · no subscription to try
        </p>
      </div>

      {/* gold ticker */}
      <div className="glam-ticker" aria-hidden>
        <div className="glam-ticker-track">
          {[0, 1].map((dup) => (
            <span key={dup} className="glam-ticker-group">
              {TICKER.map((t) => (
                <span key={t} className="glam-ticker-item">
                  {t}
                  <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
