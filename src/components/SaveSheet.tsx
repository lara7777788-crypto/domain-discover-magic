import { useEffect } from "react";

export type SavePayload = {
  url: string;       // object URL or data URL of the final image
  blob?: Blob;       // optional, enables Web Share
  filename: string;
};

export function SaveSheet({
  payload,
  onClose,
}: {
  payload: SavePayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [payload, onClose]);

  if (!payload) return null;

  const canShare =
    typeof navigator !== "undefined" &&
    !!payload.blob &&
    !!(navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }).canShare?.({
      files: [new File([payload.blob], payload.filename, { type: payload.blob.type || "image/png" })],
    });

  const onShare = async () => {
    if (!payload.blob) return;
    try {
      const file = new File([payload.blob], payload.filename, { type: payload.blob.type || "image/png" });
      await (navigator as Navigator & { share: (d: { files: File[]; title?: string }) => Promise<void> }).share({
        files: [file],
        title: payload.filename,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white bg-white/95 p-5 shadow-[0_30px_60px_-20px_rgba(62,31,112,0.5)] backdrop-blur"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full bg-foreground/5 px-2.5 py-1 text-xs text-foreground/60 hover:bg-foreground/10"
        >
          ✕
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/60">
          Save your slice
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
          Take it home 🎂
        </h2>

        <div className="mt-4 overflow-hidden rounded-2xl bg-foreground/5">
          <img
            src={payload.url}
            alt={payload.filename}
            className="block w-full select-none"
          />
        </div>

        <p className="mt-3 text-xs text-foreground/60">
          On phone? <span className="font-medium text-foreground/80">Press &amp; hold</span> the image, then tap <em>Save to Photos</em>. On desktop, hit the button below.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {canShare && (
            <button
              onClick={onShare}
              className="rounded-full bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/10"
            >
              Share / Save…
            </button>
          )}
          <a
            href={payload.url}
            download={payload.filename}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
          >
            Download ↓
          </a>
        </div>

        <p className="mt-3 text-[11px] text-foreground/45">
          Filename: {payload.filename}
        </p>
      </div>
    </div>
  );
}
