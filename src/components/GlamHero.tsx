// Japanese poster hero: lotus pond, woodblock palette, KURO-NEKO style type,
// a pink layer cake labelled with its design layers, and a frog who leaps
// off his lily pad to smash the cake on "try a slice".
import { useEffect, useRef, useState } from "react";
import cakeImg from "../assets/jp-cake-pink.webp";
import pondImg from "../assets/jp-lotus-pond.webp";
import frogImg from "../assets/jp-frog.webp";
import markImg from "../assets/jp-mark.webp";
import frogCatImg from "../assets/jp-frogcat-big.webp";
import lotusImg from "../assets/jp-lotus.webp";





const RAYS = 28;
const SHARDS = 14;

const SHARD_COLORS = ["#E8368F", "#F7B32B", "#7C6BD9", "#F2A0BC", "#6E7B3F", "#C9BCF2"];

// design layers, top tier -> bottom tier
const LAYERS = [
  { label: "logo", jp: "ロゴ", top: "16%", side: "right" as const },
  { label: "palette", jp: "配色", top: "38%", side: "left" as const },
  { label: "type", jp: "文字", top: "60%", side: "right" as const },
  { label: "imagery", jp: "画像", top: "84%", side: "right" as const },
];

const TICKER = [
  "brand identities",
  "posters",
  "packaging",
  "editorial",
  "social campaigns",
  "character worlds",
  "copy that matches",
];

// splash copy in both languages — same KURO-style typography either way
const COPY = {
  en: {
    chip: "visual identity studio",
    sub: "Layercake — make the noise work for you.",
    lede:
      "One prompt in. A whole visual world out — logo, palette, type, imagery and the copy to match. Baked layer by layer, in your taste.",
    hopIn: "HOP IN",
    hopInTag: "enter the studio",
    promo: "Try a free slice",
    promoTag: "on the house",
    cta: "Try a free slice",
    ctaTag: "one slice",

    link: "See what comes out ↓",
    fine: "First slice on the house · no subscription to try",
    mark: "Layercake: control your noise",
    bubble: "Control your noise.",
  },
  ja: {
    chip: "日本 · ビジュアル・アイデンティティ",
    sub: "レイヤーケーキ — 騒音を、味方に。",
    lede:
      "プロンプトはひとつ。出てくるのは世界まるごと — ロゴ、配色、文字、画像、そしてコピーまで。一層ずつ、あなたの好みに焼き上げます。",
    hopIn: "HOP IN",
    hopInTag: "スタジオへ",
    promo: "一切れ無料",
    promoTag: "サービス",
    cta: "一切れどうぞ — 無料",
    ctaTag: "一切れ",

    link: "できあがりを見る ↓",
    fine: "最初の一切れは無料 · 登録不要",
    mark: "レイヤーケーキ：騒音を、制御する",
    bubble: "騒音を、制御する。",
  },
} as const;


export function GlamHero({ onEnter }: { onEnter: () => void }) {
  const [lit, setLit] = useState(false);
  // the hop plays once, on entry — it never gates the CTA
  const [hopping, setHopping] = useState(false);
  const [lang, setLang] = useState<"en" | "ja">("en");
  const t = COPY[lang];
  const timer = useRef<number | null>(null);

  // One cause, one effect: the frog hops, the frog lands, the cake squashes.
  // Timing contract (keep in sync with .is-hopping rules in styles.css):
  //   0ms     calm beat — nothing moves, the composition can be read
  //   500ms   anticipation: a quick crouch, then push-off
  //   500-1180ms  one readable arc: light on the way up, faster coming down
  //   1180ms  LANDING — cake compresses, a few crumbs lift, "RIBBIT!!" pops
  //   1.18-1.6s  one small rebound, then everything settles
  useEffect(() => {
    const id = window.setTimeout(() => setLit(true), 100);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // reduced motion: the frog is simply already sitting on the squashed cake
    timer.current = window.setTimeout(() => setHopping(true), reduced ? 0 : 500);
    return () => {
      clearTimeout(id);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);





  return (
    <section className={`jp-stage relative z-10 overflow-hidden ${hopping ? "is-hopping" : ""}`}>
      {/* lotus pond backdrop */}
      <div aria-hidden className="jp-pond" style={{ backgroundImage: `url(${pondImg})` }} />
      {/* lily pads + lotus, sitting in front of the pond but behind the sunburst rays */}
      <div aria-hidden className="jp-lilies">
        <img src={lotusImg} alt="" className="jp-lily jp-lily-1" loading="lazy" />
        <img src={lotusImg} alt="" className="jp-lily jp-lily-2" loading="lazy" />
        <img src={lotusImg} alt="" className="jp-lily jp-lily-3" loading="lazy" />
      </div>

      {/* small promotional badge, upper-left — subordinate to HOP IN */}
      <button type="button" onClick={onEnter} className="jp-promo" lang={lang}>
        <span className="jp-promo-star" aria-hidden>✦</span>
        <span className="jp-promo-main">{t.promo}</span>
        <span className="jp-promo-tag">{t.promoTag}</span>
      </button>



      {/* the big ink toad-with-cat, standing guard up the right side */}
      <div className="jp-mascot" aria-hidden={false}>
        <div className="jp-bubble" lang={lang}>
          {t.bubble}
        </div>
        <img
          src={frogCatImg}
          alt="An ink-brush toad cradling a white cat, the Layercake mascot"
          width={906}
          height={1400}
          loading="lazy"
          draggable={false}
        />
      </div>

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
        <div className="jp-lang" role="group" aria-label="Splash language">
          <button
            type="button"
            className={`jp-lang-btn ${lang === "en" ? "is-on" : ""}`}
            aria-pressed={lang === "en"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={`jp-lang-btn ${lang === "ja" ? "is-on" : ""}`}
            aria-pressed={lang === "ja"}
            onClick={() => setLang("ja")}
          >
            JP
          </button>
        </div>

        <span className="jp-chip" lang={lang}>
          {t.chip}
        </span>

        <h1 className="jp-title mt-6">
          <span className="jp-word jp-word-a">LAYER</span>
          <span className="jp-word jp-word-b">CAKE</span>
        </h1>
        <p className="jp-jp" lang={lang}>
          {t.sub}
        </p>

        <p className="jp-lede" lang={lang}>
          {t.lede}
        </p>


        {/* cake on a lavender disc, with its design layers called out */}
        <div className="jp-cake-wrap" style={{ opacity: lit ? 1 : 0 }}>
          <div className="jp-disc" aria-hidden />
          <img
            src={cakeImg}
            alt="A pink four-tier Layercake with each design layer labelled"
            width={300}
            height={300}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="jp-cake"
          />

          {LAYERS.map((l, i) => (
            <span
              key={l.label}
              className={`jp-layer-tag jp-layer-${l.side}`}
              style={{ top: l.top, animationDelay: `${0.5 + i * 0.14}s` }}
              lang={lang}
            >
              <i className="jp-layer-dot" aria-hidden />
              <b>{lang === "ja" ? l.jp : l.label}</b>
            </span>
          ))}


          {/* the frog, waiting on his lily pad */}
          <div className="jp-frog-wrap" aria-hidden>
            <span className="jp-pad" />
            <img src={frogImg} alt="" width={150} height={150} className="jp-frog" draggable={false} />
          </div>

          {/* the frog's line, landing on the exact impact frame */}
          <span className="jp-ribbit" aria-hidden>RIBBIT!!</span>

          {/* cake debris — irregular chunks of sponge with frosting on top,
              plus small crumbs; only visible during the smash */}

          <div className="jp-shards" aria-hidden>
            {Array.from({ length: SHARDS }).map((_, i) => {
              // deterministic pseudo-random so SSR and client agree
              const r = (n: number) => {
                const s = Math.sin((i + 1) * n) * 10000;
                return s - Math.floor(s);
              };
              const a = (360 / SHARDS) * i + r(12.9898) * 26 - 13;
              const dist = 190 + r(78.233) * 320;
              const crumb = i % 4 === 3;
              const size = crumb ? 5 + r(4.31) * 7 : 16 + r(9.71) * 34;
              const sponge = SHARD_COLORS[i % SHARD_COLORS.length];
              const icing = SHARD_COLORS[(i + 3) % SHARD_COLORS.length];
              // lumpy, hand-torn silhouette rather than a circle or a square
              const rad = [r(3.1), r(5.7), r(8.3), r(11.9), r(14.2), r(17.4), r(20.8), r(23.6)]
                .map((v) => `${Math.round(28 + v * 52)}%`);
              return (
                <span
                  key={i}
                  className="jp-shard"
                  style={
                    {
                      background: crumb
                        ? sponge
                        : `linear-gradient(${Math.round(r(31.7) * 360)}deg, ${icing} 0 ${Math.round(
                            22 + r(6.6) * 20,
                          )}%, ${sponge} ${Math.round(30 + r(6.6) * 20)}% 100%)`,
                      width: size * (crumb ? 1 : 0.7 + r(27.1) * 0.9),
                      height: size,
                      borderRadius: `${rad[0]} ${rad[1]} ${rad[2]} ${rad[3]} / ${rad[4]} ${rad[5]} ${rad[6]} ${rad[7]}`,
                      opacity: 0,
                      ["--dx" as string]: `${Math.round(Math.cos((a * Math.PI) / 180) * dist)}px`,
                      ["--dy" as string]: `${Math.round(
                        Math.sin((a * Math.PI) / 180) * dist - 90 - r(41.3) * 120,
                      )}px`,
                      ["--rot" as string]: `${(i % 2 ? 1 : -1) * (240 + r(55.5) * 620)}deg`,
                      animationDelay: `${(r(63.7) * 0.22).toFixed(3)}s`,
                      animationDuration: `${(2.5 + r(71.9) * 1.1).toFixed(2)}s`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>

        </div>

        <div className="relative z-10 mt-8 flex flex-col items-center gap-4">
          <button type="button" onClick={onEnter} className="btn-jp btn-hopin" lang={lang}>
            {t.hopIn}
            <i lang={lang}>{t.hopInTag}</i>
          </button>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
            <button type="button" onClick={onEnter} className="jp-secondary" lang={lang}>
              {t.cta}
            </button>
            <a href="#showcase" className="jp-link" lang={lang}>
              {t.link}
            </a>
          </div>
        </div>


        <p className="jp-fine" lang={lang}>
          {t.fine}
        </p>

        {/* frog-and-cat watermark */}
        <div className="jp-mark">
          <span className="jp-mark-art">
            <img src={markImg} alt="Layercake mark: an ink frog carrying a cat" width={384} height={384} loading="lazy" />
            <span className="jp-seal" aria-label="architecture" title="建築 — architecture">建築</span>
          </span>
          <span lang={lang}>{t.mark}</span>
        </div>


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
