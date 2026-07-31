// Japanese poster hero: sunburst rays, woodblock palette, KURO-NEKO style type,
// and a dramatic cake smash on "try a slice".
import { useEffect, useRef, useState } from "react";
import cakeImg from "../assets/cake-bright.webp";

const RAYS = 28;
const SHARDS = 26;

const SHARD_COLORS = ["#E8368F", "#F7B32B", "#7C6BD9", "#F2A0BC", "#6E7B3F", "#C9BCF2"];

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
  const [smashing, setSmashing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLit(true), 100);
    return () => {
      clearTimeout(t);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleSmash = () => {
    if (smashing) return;
    setSmashing(true);
    timer.current = window.setTimeout(onEnter, 1250);
  };

  return (
    <section className={`jp-stage relative z-10 overflow-hidden ${smashing ? "is-smashing" : ""}`}>
      {/* sunburst */}
      <div aria-hidden className="jp-sun" style={{ opacity: lit ? 1 : 0 }}>
        {Array.from({ length: RAYS }).map((_, i) => (
          <span
            key={i}
            className="jp-ray"
            style={{
              transform: `rotate(${(360 / RAYS) * i}deg)`,
              background:
                i % 4 === 0
                  ? "linear-gradient(to top, transparent, #E8368F)"
                  : i % 4 === 1
                    ? "linear-gradient(to top, transparent, #7C6BD9)"
                    : i % 4 === 2
                      ? "linear-gradient(to top, transparent, #F7B32B)"
                      : "linear-gradient(to top, transparent, #6E7B3F)",
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </div>
      <div aria-hidden className="jp-grain" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-14 pt-12 text-center md:pt-16">
        <span className="jp-chip">日本 · visual identity studio</span>

        <h1 className="jp-title mt-6">
          <span className="jp-word jp-word-a">LAYER</span>
          <span className="jp-word jp-word-b">CAKE</span>
        </h1>
        <p className="jp-jp" lang="ja">
          レイヤーケーキ — 騒音を、味方に。
        </p>

        <p className="jp-lede">
          One prompt in. A whole visual world out — logo, palette, type, imagery and the copy to
          match. Baked layer by layer, in your taste.
        </p>

        {/* cake on a lavender disc */}
        <div className="jp-cake-wrap" style={{ opacity: lit ? 1 : 0 }}>
          <div className="jp-disc" aria-hidden />
          <img
            src={cakeImg}
            alt="A layered Layercake slice on a lavender poster disc"
            width={300}
            height={300}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="jp-cake"
          />
          {/* shards, only visible during the smash */}
          <div className="jp-shards" aria-hidden>
            {Array.from({ length: SHARDS }).map((_, i) => {
              const a = (360 / SHARDS) * i + (i % 3) * 5;
              const dist = 220 + (i % 5) * 70;
              return (
                <span
                  key={i}
                  className="jp-shard"
                  style={
                    {
                      background: SHARD_COLORS[i % SHARD_COLORS.length],
                      width: 10 + (i % 4) * 8,
                      height: 8 + (i % 3) * 10,
                      borderRadius: i % 2 ? "50%" : "3px",
                      ["--dx" as string]: `${Math.round(Math.cos((a * Math.PI) / 180) * dist)}px`,
                      ["--dy" as string]: `${Math.round(Math.sin((a * Math.PI) / 180) * dist - 60)}px`,
                      ["--rot" as string]: `${(i % 2 ? 1 : -1) * (180 + i * 22)}deg`,
                      animationDelay: `${(i % 6) * 0.02}s`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <button type="button" onClick={handleSmash} className="btn-jp">
            Try a slice — free
            <i lang="ja">一切れ</i>
          </button>
          <a href="#showcase" className="jp-link">
            See what comes out ↓
          </a>
        </div>

        <p className="jp-fine">First slice on the house · no subscription to try</p>
      </div>

      {/* ticker */}
      <div className="jp-ticker" aria-hidden>
        <div className="jp-ticker-track">
          {[0, 1].map((dup) => (
            <span key={dup} className="jp-ticker-group">
              {TICKER.map((t) => (
                <span key={t} className="jp-ticker-item">
                  {t}
                  <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* flash + wipe */}
      <div aria-hidden className="jp-flash" />
    </section>
  );
}
