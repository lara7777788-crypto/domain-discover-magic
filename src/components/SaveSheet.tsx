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

  const onDownload = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      const blob: Blob = payload.blob ?? await fetch(payload.url).then((res) => res.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = payload.filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      window.open(payload.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#FFFDF8] px-4 py-5 text-foreground"
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
        <button
          onClick={onClose}
          aria-label="Close"
          className="ml-auto rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/10"
        >
          Close ✕
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/60">
          Save Image
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
          Take it home 🎂
        </h2>

        <p className="mt-3 text-sm text-foreground/65">
          Press and hold the image, then tap Save to Photos.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl bg-foreground/5">
          <img
            src={payload.url}
            alt={payload.filename}
            className="block w-full select-none"
          />
        </div>

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
            onClick={onDownload}
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
