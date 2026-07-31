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

import { playRibbet, playSmash, buzz } from "../lib/smash-sfx";


const RAYS = 28;
const SHARDS = 26;

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
    cta: "Try a slice — free",
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
  const [smashing, setSmashing] = useState(false);
  const [lang, setLang] = useState<"en" | "ja">("en");
  const t = COPY[lang];
  const timer = useRef<number | null>(null);
  const sfxTimer = useRef<number | null>(null);
  const hapticTimer = useRef<number | null>(null);



  useEffect(() => {
    const id = window.setTimeout(() => setLit(true), 100);
    return () => {
      clearTimeout(id);
      if (timer.current) clearTimeout(timer.current);

      if (sfxTimer.current) clearTimeout(sfxTimer.current);
      if (hapticTimer.current) clearTimeout(hapticTimer.current);

    };
  }, []);

  const handleSmash = () => {
    if (smashing) return;
    setSmashing(true);

    // Timing contract (must stay in sync with .is-smashing rules in styles.css):
    //   0ms    click — frog crouches
    //   ~135ms push-off, which is where the second "bet" note of the croak lands
    //   600ms  IMPACT — frog hits the cake, cake explodes, smash sfx + haptic peak
    const IMPACT = 600;
    const AUDIO_LEAD = 25; // buffer scheduling + 10ms attack ramp
    const HAPTIC_LEAD = 45; // vibration motor spin-up

    // croak fires on the crouch so its accent note peaks on the push-off
    playRibbet();
    buzz(12);

    hapticTimer.current = window.setTimeout(
      () => buzz([28, 40, 70]),
      IMPACT - HAPTIC_LEAD,
    );
    sfxTimer.current = window.setTimeout(
      () => playSmash(AUDIO_LEAD / 1000),
      IMPACT - AUDIO_LEAD,
    );
    timer.current = window.setTimeout(onEnter, 2000);
  };


  return (
    <section className={`jp-stage relative z-10 overflow-hidden ${smashing ? "is-smashing" : ""}`}>
      {/* lotus pond backdrop */}
      <div aria-hidden className="jp-pond" style={{ backgroundImage: `url(${pondImg})` }} />
      {/* lily pads + lotus, sitting in front of the pond but behind the sunburst rays */}
      <div aria-hidden className="jp-lilies">
        <img src={lotusImg} alt="" className="jp-lily jp-lily-1" loading="lazy" />
        <img src={lotusImg} alt="" className="jp-lily jp-lily-2" loading="lazy" />
        <img src={lotusImg} alt="" className="jp-lily jp-lily-3" loading="lazy" />
      </div>

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
          <button type="button" onClick={handleSmash} className="btn-jp" lang={lang}>
            {t.cta}
            <i lang={lang}>{t.ctaTag}</i>
          </button>
          <a href="#showcase" className="jp-link" lang={lang}>
            {t.link}
          </a>
        </div>

        <p className="jp-fine" lang={lang}>
          {t.fine}
        </p>

        {/* frog-and-cat watermark */}
        <div className="jp-mark">
          <img src={markImg} alt="Layercake mark: an ink frog carrying a cat" width={384} height={384} loading="lazy" />
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
