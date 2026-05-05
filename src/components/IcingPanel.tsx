import { useRef, useState } from "react";

type Sticker = { id: string; emoji: string; x: number; y: number; size: number };

const EFFECTS = [
  { key: "none",     label: "None",        css: "" },
  { key: "bw",       label: "B&W",         css: "grayscale(1)" },
  { key: "sepia",    label: "Sepia",       css: "sepia(0.85)" },
  { key: "neon",     label: "Neon",        css: "saturate(2) contrast(1.2) brightness(1.05)" },
  { key: "vhs",      label: "VHS",         css: "hue-rotate(-12deg) saturate(1.4) contrast(1.15)" },
  { key: "riso",     label: "Riso",        css: "contrast(1.3) saturate(1.5) hue-rotate(8deg)" },
  { key: "holo",     label: "Holographic", css: "hue-rotate(40deg) saturate(1.8) brightness(1.05)" },
  { key: "noir",     label: "Noir",        css: "grayscale(1) contrast(1.4) brightness(0.9)" },
] as const;

const STICKER_PACKS = [
  { name: "Confetti", emojis: ["🎉", "🎊", "✨", "🎈"] },
  { name: "Hearts",   emojis: ["💖", "💗", "💕", "❤️"] },
  { name: "Stars",    emojis: ["⭐", "🌟", "✨", "💫"] },
  { name: "Sweet",    emojis: ["🍰", "🧁", "🍩", "🍓"] },
  { name: "Vibe",     emojis: ["🔥", "💨", "💎", "👑"] },
];

export type IcingState = {
  hue: number; sat: number; bright: number; contrast: number;
  effect: typeof EFFECTS[number]["key"];
  stickers: Sticker[];
};

export const defaultIcing: IcingState = {
  hue: 0, sat: 100, bright: 100, contrast: 100, effect: "none", stickers: [],
};

function buildFilter(s: IcingState) {
  const base = `hue-rotate(${s.hue}deg) saturate(${s.sat}%) brightness(${s.bright}%) contrast(${s.contrast}%)`;
  const eff = EFFECTS.find((e) => e.key === s.effect)?.css ?? "";
  return [base, eff].filter(Boolean).join(" ");
}

export function IcingPanel({
  imageUrl,
  icing,
  setIcing,
  onDownload,
}: {
  imageUrl: string;
  icing: IcingState;
  setIcing: (s: IcingState) => void;
  onDownload: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ id: string; offX: number; offY: number } | null>(null);

  const filter = buildFilter(icing);

  const addSticker = (emoji: string) => {
    setIcing({
      ...icing,
      stickers: [
        ...icing.stickers,
        { id: crypto.randomUUID(), emoji, x: 50, y: 50, size: 64 },
      ],
    });
    setPickerOpen(false);
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const stage = stageRef.current!;
    const rect = stage.getBoundingClientRect();
    const sticker = icing.stickers.find((s) => s.id === id)!;
    const cx = rect.left + (sticker.x / 100) * rect.width;
    const cy = rect.top + (sticker.y / 100) * rect.height;
    dragging.current = { id, offX: e.clientX - cx, offY: e.clientY - cy };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const stage = stageRef.current!;
    const rect = stage.getBoundingClientRect();
    const x = ((e.clientX - dragging.current.offX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - dragging.current.offY - rect.top) / rect.height) * 100;
    setIcing({
      ...icing,
      stickers: icing.stickers.map((s) =>
        s.id === dragging.current!.id ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : s,
      ),
    });
  };
  const onPointerUp = () => { dragging.current = null; };

  const removeSticker = (id: string) =>
    setIcing({ ...icing, stickers: icing.stickers.filter((s) => s.id !== id) });

  return (
    <div className="rounded-3xl border border-white bg-white/80 p-4 shadow-[0_30px_60px_-30px_rgba(62,31,112,0.4)] backdrop-blur">
      {/* Stage */}
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden rounded-2xl bg-foreground/5"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img src={imageUrl} alt="Your slice" className="w-full select-none" style={{ filter }} draggable={false} />
        {icing.stickers.map((s) => (
          <div
            key={s.id}
            onPointerDown={(e) => onPointerDown(e, s.id)}
            onDoubleClick={() => removeSticker(s.id)}
            title="Drag to move · double-click to remove"
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, lineHeight: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))" }}
          >
            {s.emoji}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/60">Change the colors</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ["Hue",        "hue",      -180, 180, "°"],
              ["Saturation", "sat",      0,    200, "%"],
              ["Brightness", "bright",   50,   150, "%"],
              ["Contrast",   "contrast", 50,   150, "%"],
            ] as const).map(([label, key, min, max, unit]) => (
              <label key={key} className="block text-xs text-foreground/70">
                <div className="mb-1 flex justify-between">
                  <span>{label}</span><span className="opacity-60">{icing[key]}{unit}</span>
                </div>
                <input
                  type="range" min={min} max={max} value={icing[key]}
                  onChange={(e) => setIcing({ ...icing, [key]: Number(e.target.value) })}
                  className="w-full accent-foreground"
                />
              </label>
            ))}
          </div>
          <button
            onClick={() => setIcing({ ...defaultIcing, stickers: icing.stickers })}
            className="mt-2 text-xs text-foreground/50 underline-offset-4 hover:underline"
          >
            Reset colors
          </button>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/60">Effect filters · icing</p>
          <div className="flex flex-wrap gap-2">
            {EFFECTS.map((e) => (
              <button
                key={e.key}
                onClick={() => setIcing({ ...icing, effect: e.key })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  icing.effect === e.key
                    ? "bg-foreground text-white"
                    : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/60">Sticker pack overlays · icing</p>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-foreground/10"
          >
            {pickerOpen ? "Close" : "+ Add sticker"}
          </button>
          {pickerOpen && (
            <div className="mt-3 space-y-2 rounded-2xl border border-foreground/10 bg-white p-3">
              {STICKER_PACKS.map((p) => (
                <div key={p.name}>
                  <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-foreground/50">{p.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {p.emojis.map((e) => (
                      <button
                        key={e + p.name}
                        onClick={() => addSticker(e)}
                        className="rounded-lg p-1.5 text-2xl hover:bg-foreground/5"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {icing.stickers.length > 0 && (
            <p className="mt-2 text-[11px] text-foreground/50">Drag to move · double-click to remove</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4">
          <div className="text-xs text-foreground/50">
            Icing menu (soon): animated MP4 · sound stings · effect packs · sticker bundles · ~$0.50 each
          </div>
          <button
            onClick={onDownload}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
          >
            Download ↓
          </button>
        </div>
      </div>
    </div>
  );
}

function needsOpenFallback() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS || !("download" in HTMLAnchorElement.prototype);
}

function paintFallbackWindow(win: Window | null, url: string, filename: string) {
  if (!win || win.closed) return false;
  win.document.title = filename;
  win.document.body.style.margin = "0";
  win.document.body.style.background = "#111";
  win.document.body.innerHTML = `<a href="${url}" download="${filename}" style="position:fixed;left:12px;top:12px;z-index:2;border-radius:999px;background:white;color:#111;padding:10px 14px;font:600 14px system-ui;text-decoration:none">Save image</a><img src="${url}" alt="${filename}" style="display:block;max-width:100%;height:auto;margin:auto" />`;
  return true;
}

/** Save a blob to the user's device with the best method the browser supports. */
async function saveBlob(blob: Blob, filename: string, fallbackWindow: Window | null) {
  // 1) Mobile (iOS Safari) — `download` attribute is ignored on blob URLs.
  //    Use the Web Share API with a File so the system share sheet (Save Image / Files) appears.
  try {
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: filename });
      fallbackWindow?.close();
      return;
    }
  } catch {
    /* fall through */
  }

  // 2) Desktop — anchor download with object URL.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();

  if (fallbackWindow && paintFallbackWindow(fallbackWindow, url, filename)) return;

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 4000);
}

function openRawFallback(imageUrl: string, filename: string, fallbackWindow: Window | null) {
  // For iOS Safari with no share support: open the data URL so user can long-press to save.
  if (!paintFallbackWindow(fallbackWindow, imageUrl, filename)) window.open(imageUrl, "_blank", "noopener");
}

export async function downloadIced(imageUrl: string, icing: IcingState, filename: string) {
  const fallbackWindow = needsOpenFallback() ? window.open("about:blank", "_blank") : null;
  if (fallbackWindow) {
    fallbackWindow.document.body.style.margin = "0";
    fallbackWindow.document.body.style.padding = "24px";
    fallbackWindow.document.body.style.font = "600 16px system-ui";
    fallbackWindow.document.body.textContent = "Preparing your image…";
  }
  const img = new Image();
  // Only set crossOrigin for remote URLs; data: URLs choke on it in some browsers.
  if (/^https?:/i.test(imageUrl)) img.crossOrigin = "anonymous";
  try {
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Couldn't load image"));
      img.src = imageUrl;
    });

    const w = img.naturalWidth || 1024;
    const h = img.naturalHeight || 1024;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = buildFilter(icing);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.filter = "none";

  // Stickers — emoji as text. Position is % of stage; size in CSS px on a stage matching natural width.
  for (const s of icing.stickers) {
    const x = (s.x / 100) * w;
    const y = (s.y / 100) * h;
    const px = (s.size / 1024) * w; // scale relative to a 1024 stage assumption
    ctx.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = px * 0.15;
    ctx.shadowOffsetY = px * 0.06;
    ctx.fillText(s.emoji, x, y);
  }

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"),
    );
    await saveBlob(blob, filename, fallbackWindow);
  } catch (err) {
    console.warn("Iced export failed, opening raw image", err);
    openRawFallback(imageUrl, filename, fallbackWindow);
  }
}
