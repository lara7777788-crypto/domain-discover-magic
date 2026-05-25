import { useReveal } from "@/hooks/useReveal";

const LAYERS = [
  { label: "Concept", color: "var(--ube)" },
  { label: "Palette", color: "var(--strawberry)" },
  { label: "Type", color: "var(--melon)" },
  { label: "Logo", color: "var(--matcha)" },
  { label: "Motion", color: "var(--ramune)" },
  { label: "World", color: "var(--taiyaki)" },
];

export function LayerStack() {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  return (
    <div ref={ref} className="relative mx-auto flex h-[340px] w-full max-w-md items-end justify-center">
      <div className="relative h-full w-full">
        {LAYERS.map((l, i) => {
          const baseY = 280 - i * 38;
          return (
            <div
              key={l.label}
              className="absolute left-1/2 flex items-center justify-between rounded-2xl px-5 py-3"
              style={{
                width: `${78 - i * 4}%`,
                top: revealed ? baseY : 340,
                transform: "translateX(-50%)",
                background: l.color,
                color: "var(--foreground)",
                opacity: revealed ? 1 : 0,
                transition: `top 700ms cubic-bezier(.2,.9,.25,1) ${i * 110}ms, opacity 500ms ease-out ${i * 110}ms`,
                boxShadow:
                  "0 18px 30px -18px color-mix(in oklab, var(--foreground) 35%, transparent), inset 0 1px 0 color-mix(in oklab, var(--cream) 50%, transparent)",
              }}
            >
              <span className="font-display text-sm font-semibold tracking-tight">{l.label}</span>
              <span className="text-[10px] uppercase tracking-[0.25em] opacity-60">layer {i + 1}</span>
            </div>
          );
        })}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
          style={{
            bottom: 6,
            width: "70%",
            height: 18,
            background: "radial-gradient(ellipse at center, color-mix(in oklab, var(--foreground) 28%, transparent) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />
      </div>
    </div>
  );
}
