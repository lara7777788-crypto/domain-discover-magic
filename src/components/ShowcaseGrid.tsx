import { useReveal } from "@/hooks/useReveal";

type Tile = {
  label: string;
  caption: string;
  bg: string;
  accent: string;
  art: React.ReactNode;
  col?: string;
  row?: string;
};

const tile = (
  label: string,
  caption: string,
  bg: string,
  accent: string,
  art: React.ReactNode,
  col?: string,
  row?: string,
): Tile => ({ label, caption, bg, accent, art, col, row });

const TILES: Tile[] = [
  tile(
    "Brand identities",
    "Logo, wordmark, palette, voice — one cohesive system.",
    "var(--strawberry)",
    "var(--cream)",
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <circle cx="60" cy="70" r="34" fill="var(--cream)" opacity="0.95" />
      <text x="60" y="78" textAnchor="middle" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="32" fill="var(--foreground)">L</text>
      <rect x="110" y="48" width="68" height="6" rx="3" fill="var(--cream)" opacity="0.9" />
      <rect x="110" y="62" width="48" height="4" rx="2" fill="var(--cream)" opacity="0.7" />
      <rect x="110" y="74" width="58" height="4" rx="2" fill="var(--cream)" opacity="0.5" />
      <g transform="translate(110 92)">
        {["var(--ube)", "var(--matcha)", "var(--melon)", "var(--ramune)"].map((c, i) => (
          <circle key={i} cx={i * 16 + 8} cy="8" r="7" fill={c} />
        ))}
      </g>
    </svg>,
    "md:col-span-2",
    "md:row-span-2",
  ),
  tile(
    "Posters",
    "Editorial print pieces with type as the hero.",
    "var(--melon)",
    "var(--foreground)",
    <svg viewBox="0 0 140 180" className="h-full w-full">
      <rect x="10" y="10" width="120" height="160" rx="4" fill="var(--cream)" />
      <text x="70" y="78" textAnchor="middle" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="40" fill="var(--foreground)">soft</text>
      <text x="70" y="112" textAnchor="middle" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="40" fill="var(--strawberry)">noise</text>
      <line x1="20" y1="140" x2="120" y2="140" stroke="var(--foreground)" strokeWidth="0.6" />
      <text x="20" y="156" fontSize="6" letterSpacing="2" fill="var(--foreground)">SS26 · LAYERCAKE EDITIONS</text>
    </svg>,
  ),
  tile(
    "Packaging",
    "Tactile, dimensional, retail-ready.",
    "var(--matcha)",
    "var(--foreground)",
    <svg viewBox="0 0 160 140" className="h-full w-full">
      <path d="M 30 40 L 90 30 L 130 50 L 130 110 L 70 120 L 30 100 Z" fill="var(--cream)" stroke="var(--foreground)" strokeWidth="0.8" />
      <path d="M 30 40 L 70 60 L 130 50" fill="none" stroke="var(--foreground)" strokeWidth="0.8" opacity="0.4" />
      <path d="M 70 60 L 70 120" fill="none" stroke="var(--foreground)" strokeWidth="0.8" opacity="0.4" />
      <text x="78" y="92" fontFamily="Fredoka, sans-serif" fontWeight="600" fontSize="11" fill="var(--foreground)">layer.</text>
      <circle cx="100" cy="78" r="3" fill="var(--strawberry)" />
    </svg>,
  ),
  tile(
    "Editorial graphics",
    "Magazine spreads, covers, long-form art direction.",
    "var(--ramune)",
    "var(--foreground)",
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <rect x="10" y="14" width="86" height="92" rx="2" fill="var(--cream)" />
      <rect x="104" y="14" width="86" height="92" rx="2" fill="var(--cream)" opacity="0.9" />
      <text x="20" y="46" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="22" fill="var(--foreground)">Issue 04</text>
      <line x1="20" y1="54" x2="86" y2="54" stroke="var(--foreground)" strokeWidth="0.4" />
      {[62, 70, 78, 86, 94].map((y) => <line key={y} x1="20" y1={y} x2="86" y2={y} stroke="var(--foreground)" strokeWidth="0.3" opacity="0.4" />)}
      <circle cx="147" cy="60" r="28" fill="var(--strawberry)" opacity="0.85" />
    </svg>,
    "md:col-span-2",
  ),
  tile(
    "Social campaigns",
    "Story-native motion sets, ready to ship.",
    "var(--ube)",
    "var(--cream)",
    <svg viewBox="0 0 200 140" className="h-full w-full">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${20 + i * 56} ${20 + i * 6})`}>
          <rect width="48" height="84" rx="6" fill="var(--cream)" opacity={0.6 + i * 0.18} />
          <circle cx="24" cy="32" r="10" fill="var(--strawberry)" />
          <rect x="10" y="50" width="28" height="3" rx="1.5" fill="var(--foreground)" opacity="0.6" />
          <rect x="10" y="58" width="20" height="3" rx="1.5" fill="var(--foreground)" opacity="0.4" />
        </g>
      ))}
    </svg>,
  ),
  tile(
    "AI character worlds",
    "Casts, props, environments — your universe.",
    "var(--taiyaki)",
    "var(--foreground)",
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <circle cx="70" cy="80" r="34" fill="var(--cream)" />
      <circle cx="60" cy="74" r="4" fill="var(--foreground)" />
      <circle cx="82" cy="74" r="4" fill="var(--foreground)" />
      <path d="M 58 90 Q 71 100, 84 90" stroke="var(--foreground)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="140" cy="50" r="14" fill="var(--matcha)" />
      <rect x="128" y="78" width="26" height="34" rx="6" fill="var(--ramune)" />
      <circle cx="172" cy="98" r="10" fill="var(--ube)" />
    </svg>,
    "md:col-span-2",
  ),
];

export function ShowcaseGrid() {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[180px]">
      {TILES.map((t, i) => (
        <article
          key={t.label}
          className={`group relative overflow-hidden rounded-3xl p-5 transition-all duration-700 ease-out ${t.col ?? ""} ${t.row ?? ""}`}
          style={{
            background: t.bg,
            color: t.accent,
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(24px)",
            transitionDelay: `${i * 70}ms`,
            boxShadow: "0 30px 60px -30px color-mix(in oklab, var(--foreground) 28%, transparent), inset 0 1px 0 color-mix(in oklab, var(--cream) 40%, transparent)",
          }}
        >
          <div className="absolute inset-0 opacity-60 transition-transform duration-700 group-hover:scale-[1.03]" aria-hidden>
            <div className="absolute inset-x-6 top-8 bottom-16 flex items-center justify-center">
              {t.art}
            </div>
          </div>
          <div className="relative z-10 flex h-full flex-col justify-end">
            <h3 className="font-display text-lg font-semibold tracking-tight">{t.label}</h3>
            <p className="mt-1 max-w-[22ch] text-xs opacity-80">{t.caption}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
