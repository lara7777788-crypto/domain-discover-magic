import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import cakeImg from "../assets/cake-bright.webp";
import { ShowcaseGrid } from "@/components/ShowcaseGrid";
import { LayerStack } from "@/components/LayerStack";
import { CakeSlam3D } from "@/components/CakeSlam3D";

import { useReveal } from "@/hooks/useReveal";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Layercake — AI-native visual identity studio" },
      { name: "description", content: "Layercake is an AI-native visual identity studio. Layer a wish, mood, text, and brand into posters, packaging, and social art — one slice at a time." },
      { property: "og:title", content: "Layercake — AI-native visual identity studio" },
      { property: "og:description", content: "Bake brand identities, posters, packaging, and social campaigns layer by layer with an AI studio designed for taste, not templates." },
      { property: "og:url", content: "https://layercake.site/" },
    ],
    links: [
      { rel: "canonical", href: "https://layercake.site/" },
      { rel: "preload", as: "image", href: cakeImg, fetchpriority: "high" },
    ],
  }),
  component: Splash,
});


function Splash() {
  const navigate = useNavigate();
  const goBake = () => navigate({ to: "/bake" });

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Base cream */}
      <div aria-hidden className="absolute inset-0" style={{ background: "var(--cream)" }} />

      {/* Ambient pastel wash */}
      <div
        aria-hidden
        className="absolute inset-0 animate-ambient"
        style={{ background: "var(--gradient-ambient)" }}
      />

      {/* Grain */}
      <div aria-hidden className="grain-overlay" />

      <GlamHero onEnter={goBake} />

      {/* World, not logo */}
      <WorldSection />

      {/* Showcase */}
      <ShowcaseSection />

      {/* Layer stack */}
      <SystemSection />

      {/* Prompts -> systems */}
      <PromptsToSystems />

      {/* Closing CTA */}
      <ClosingCTA onEnter={goBake} />

      <footer className="relative z-10 px-6 pb-10 pt-6 text-center text-[11px] uppercase tracking-[0.3em] text-foreground/40">
        layercake · a visual operating system for creators
      </footer>
    </main>
  );
}


function SectionShell({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  const { ref, revealed } = useReveal<HTMLElement>();
  return (
    <section
      id={id}
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative z-10 mx-auto w-full max-w-6xl px-6 py-20 md:py-28 ${className}`}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 800ms ease-out, transform 800ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {children}
    </section>
  );
}

function WorldSection() {
  return (
    <SectionShell id="world">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">Chapter 01</p>
          <h2 className="font-display font-semibold leading-[0.95] tracking-tight text-foreground" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)" }}>
            Build a <span className="font-editorial font-normal text-foreground/85">world,</span>
            <br /> not just a logo.
          </h2>
        </div>
        <div className="md:col-span-5 md:pt-6">
          <p className="text-lg leading-relaxed text-foreground/65">
            Every Layercake slice is a complete creative direction — logo, palette, type, motion, voice and atmosphere — generated as one coherent system. No more isolated images that don't speak the same language.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["logo", "palette", "typography", "motion", "voice", "world"].map((t) => (
              <span key={t} className="rounded-full border border-foreground/15 bg-cream/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-foreground/60">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function ShowcaseSection() {
  return (
    <SectionShell id="showcase">
      <div className="mb-12 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">Chapter 02 · outputs</p>
          <h2 className="font-display font-semibold leading-[0.95] tracking-tight text-foreground" style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)" }}>
            One prompt. A whole <span className="font-editorial font-normal">universe.</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm text-foreground/55">
          From brand identities and posters to packaging, editorial, social and character casts — Layercake bakes them all in one tin.
        </p>
      </div>
      <ShowcaseGrid />
    </SectionShell>
  );
}

function SystemSection() {
  return (
    <SectionShell id="system">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-6">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">Chapter 03 · the recipe</p>
          <h2 className="font-display font-semibold leading-[0.95] tracking-tight text-foreground" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)" }}>
            Identity, <span className="font-editorial font-normal">layered.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-foreground/65">
            Each slice is assembled the way a real studio would — concept first, then palette, type, mark, motion, and finally the world it lives in. You watch it stack in real time.
          </p>
        </div>
        <div className="md:col-span-6">
          <LayerStack />
        </div>
      </div>
    </SectionShell>
  );
}

function PromptsToSystems() {
  return (
    <SectionShell id="systems">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">Chapter 04 · the difference</p>
        <h2 className="font-display font-semibold leading-[1.05] tracking-tight text-foreground" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
          Layercake turns prompts into <span className="font-editorial font-normal">cohesive visual systems</span> — not isolated images.
        </h2>

        <div className="mt-12 flex items-center justify-center gap-4 md:gap-8">
          <div className="rounded-2xl border border-foreground/10 bg-cream/70 px-5 py-3 text-left shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)]">
            <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">prompt</div>
            <div className="font-editorial text-lg text-foreground/85">"a quiet Parisian patisserie brand"</div>
          </div>
          <div className="relative flex-shrink-0">
            <svg width="80" height="24" viewBox="0 0 80 24" className="hidden md:block">
              <defs>
                <linearGradient id="arrow" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--strawberry)" stopOpacity="0.2" />
                  <stop offset="1" stopColor="var(--strawberry)" />
                </linearGradient>
              </defs>
              <line x1="0" y1="12" x2="70" y2="12" stroke="url(#arrow)" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M 66 6 L 78 12 L 66 18" stroke="var(--strawberry)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="md:hidden text-2xl">↓</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              {["var(--strawberry)", "var(--cream)", "var(--ube)", "var(--matcha)"].map((c, i) => (
                <span key={i} className="h-8 w-8 rounded-lg" style={{ background: c, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 10px -4px rgba(0,0,0,0.2)" }} />
              ))}
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-lg bg-cream/80 px-2 py-1 text-[10px] font-display">Aa</span>
              <span className="rounded-lg bg-cream/80 px-2 py-1 font-editorial text-[12px] leading-none">Aa</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--strawberry)" }}>
                <span className="text-[10px] text-cream font-display font-semibold">L</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function ClosingCTA({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-8">
      <div
        className="relative overflow-hidden rounded-[2.5rem] px-8 py-20 text-center md:px-16"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, color-mix(in oklab, var(--strawberry) 25%, transparent) 0%, transparent 70%), linear-gradient(180deg, color-mix(in oklab, var(--cream) 95%, transparent) 0%, color-mix(in oklab, var(--melon) 18%, transparent) 100%)",
          boxShadow: "var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/55">your turn</p>
        <h3 className="mx-auto max-w-2xl font-display font-semibold leading-[1] tracking-tight text-foreground" style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}>
          A whole world, <span className="font-editorial font-normal">in one slice.</span>
        </h3>
        <p className="mx-auto mt-5 max-w-md text-foreground/60">
          Bring a feeling. Leave with an identity system. Your first slice is on the house.
        </p>
        <div className="mt-9 flex justify-center">
          <button type="button" onClick={onEnter} className="btn-premium">
            Bake your first slice →
          </button>
        </div>
      </div>
    </section>
  );
}

