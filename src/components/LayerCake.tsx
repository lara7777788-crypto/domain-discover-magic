// Animated layered cake illustration (pure SVG, no deps).
// Layers from bottom up: visual, text, layout, logo, prompt (cherry on top).
type Props = {
  size?: number;
  interactive?: boolean;
  activeLayer?: number; // 0..4
};

const TIERS = [
  { label: "visual", fill: "var(--strawberry)", drip: "var(--ube)" },
  { label: "text", fill: "var(--melon)", drip: "var(--taiyaki)" },
  { label: "layout", fill: "var(--ramune)", drip: "var(--cream)" },
  { label: "logo", fill: "var(--matcha)", drip: "var(--cream)" },
];

export function LayerCake({ size = 320, interactive = false, activeLayer }: Props) {
  const w = size;
  const h = size * 1.2;
  // Each tier slightly narrower as we go up
  const tierH = 46;
  const baseY = h - 40;
  const baseW = w - 40;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={interactive ? "animate-wobble" : ""}
      aria-label="A four-tier layer cake with a cherry on top"
    >
      {/* plate */}
      <ellipse cx={w / 2} cy={baseY + 14} rx={baseW / 2 + 14} ry={10} fill="var(--cream)" stroke="var(--ube)" strokeWidth="2" opacity="0.9" />

      {TIERS.map((t, i) => {
        const tierW = baseW - i * 36;
        const x = (w - tierW) / 2;
        const y = baseY - (i + 1) * tierH;
        const isActive = activeLayer === i;
        return (
          <g key={t.label} style={{ transition: "transform 400ms", transform: isActive ? "translateY(-6px)" : "none", transformOrigin: "center" }}>
            {/* drip top */}
            <path
              d={`M ${x} ${y + 8}
                  Q ${x + 14} ${y + 22}, ${x + 28} ${y + 8}
                  T ${x + 56} ${y + 8}
                  T ${x + 84} ${y + 8}
                  T ${x + 112} ${y + 8}
                  T ${x + 140} ${y + 8}
                  T ${x + 168} ${y + 8}
                  T ${x + 196} ${y + 8}
                  T ${x + 224} ${y + 8}
                  L ${x + tierW} ${y + 8}
                  L ${x + tierW} ${y}
                  L ${x} ${y} Z`}
              fill={t.drip}
              opacity="0.95"
            />
            {/* main tier */}
            <rect x={x} y={y + 8} width={tierW} height={tierH - 8} rx="6" fill={t.fill} stroke="var(--foreground)" strokeWidth="1.5" opacity="0.95" />
            {/* sprinkles */}
            {[0.2, 0.4, 0.6, 0.8].map((p, j) => (
              <rect
                key={j}
                x={x + tierW * p}
                y={y + 22 + (j % 2) * 6}
                width="6"
                height="2.5"
                rx="1"
                fill="var(--foreground)"
                transform={`rotate(${j * 35} ${x + tierW * p + 3} ${y + 24})`}
                opacity="0.7"
              />
            ))}
          </g>
        );
      })}

      {/* cherry on top — the "prompt" layer */}
      <g style={{ transition: "transform 400ms", transform: activeLayer === 4 ? "translateY(-10px)" : "none", transformOrigin: "center" }}>
        <line x1={w / 2} y1={baseY - TIERS.length * tierH - 6} x2={w / 2 + 8} y2={baseY - TIERS.length * tierH - 26} stroke="var(--matcha)" strokeWidth="3" strokeLinecap="round" />
        <circle cx={w / 2} cy={baseY - TIERS.length * tierH - 4} r="12" fill="var(--strawberry)" stroke="var(--foreground)" strokeWidth="1.5" />
        <circle cx={w / 2 - 4} cy={baseY - TIERS.length * tierH - 7} r="3" fill="var(--cream)" opacity="0.7" />
      </g>
    </svg>
  );
}
