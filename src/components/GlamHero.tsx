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

import {
  playRibbet,
  playSmash,
  buzz,
  primeAudio,
  startKittenAmbience,
  stopKittenAmbience,
} from "../lib/smash-sfx";


const RAYS = 28;
const SHARDS = 72;

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
  const extraTimers = useRef<number[]>([]);



  useEffect(() => {
    primeAudio();
    const id = window.setTimeout(() => setLit(true), 100);

    // the kitten purrs (with the odd tiny meow) once audio is unlocked by a
    // gesture, and goes quiet the moment the toad leaps
    const wake = () => startKittenAmbience();
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("pointermove", wake, { passive: true, once: true });

    return () => {
      clearTimeout(id);
      if (timer.current) clearTimeout(timer.current);

      if (sfxTimer.current) clearTimeout(sfxTimer.current);
      if (hapticTimer.current) clearTimeout(hapticTimer.current);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("pointermove", wake);
      stopKittenAmbience();
    };
  }, []);

  const handleSmash = () => {
    if (smashing) return;
    setSmashing(true);
    stopKittenAmbience();

    // Timing contract (must stay in sync with .is-smashing rules in styles.css):
    //   0ms      click — croak #1, frog crouches
    //   350ms    push-off
    //   1100ms   IMPACT — croak #2 (loudest) + smash, cake pancakes, debris erupts
    //   1.1-3.9s debris arcs and falls, more croaks over the wreckage
    //   3.9-5.2s the wipe blooms and carries the page turn
    const IMPACT = 1100;
    const AUDIO_LEAD = 25; // buffer scheduling + attack ramp
    const HAPTIC_LEAD = 45; // vibration motor spin-up
    const END = 5200;

    // croak #1 on the crouch — the ribbit is the headline of the whole moment
    playRibbet(1.3);
    buzz(14);

    const at = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      extraTimers.current.push(id);
    };

    hapticTimer.current = window.setTimeout(() => buzz([30, 40, 80]), IMPACT - HAPTIC_LEAD);
    sfxTimer.current = window.setTimeout(() => {
      // impact: the big "RIBBIT!!!" with the smash tucked underneath it
      playRibbet(1.4);
      playSmash(AUDIO_LEAD / 1000);
    }, IMPACT - AUDIO_LEAD);

    // croaks keep rolling over the flying debris so nothing ever goes quiet
    at(1950, () => {
      playRibbet(1.15);
      buzz(18);
    });
    at(2950, () => playRibbet(0.95));
    at(3900, () => {
      playRibbet(1.25);
      buzz([20, 30, 60]);
    });

    timer.current = window.setTimeout(onEnter, END);
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
