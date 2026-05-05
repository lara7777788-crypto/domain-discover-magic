import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { supabase } from "@/integrations/supabase/client";
import { spendSliceCredit } from "@/server/credits.functions";

export type SavePayload = {
  url: string;       // object URL or data URL of the final image
  blob?: Blob;       // optional, enables Web Share
  filename: string;
  sliceId?: string;  // when present, supports per-slice unlock
  locked?: boolean;  // when true, save is gated until Pro or slice unlock
};

export function SaveSheet({
  payload,
  onClose,
}: {
  payload: SavePayload | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { isActive: isPro } = useSubscription();
  const { openCheckout, checkoutElement, isOpen: checkoutOpen, closeCheckout } = useStripeCheckout();

  const [credits, setCredits] = useState<number>(0);
  const [spending, setSpending] = useState(false);

  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [payload, onClose]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("slice_credits")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setCredits((data?.slice_credits as number) ?? 0));
  }, [user, payload?.sliceId]);

  if (!payload) return null;

  const gated = !!payload.locked && !isPro;

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

  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const dataUrlToBlob = (dataUrl: string): Blob | null => {
    try {
      const [header, base64] = dataUrl.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : "image/png";
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    } catch {
      return null;
    }
  };

  const resolveBlobUrl = (): string => {
    if (payload.url.startsWith("data:")) {
      const blob = payload.blob ?? dataUrlToBlob(payload.url);
      if (blob) return URL.createObjectURL(blob);
    }
    return payload.url;
  };

  const openImageInNewTab = (imgUrl: string) => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      window.location.href = imgUrl;
      return;
    }
    w.document.write(`
      <html><head><title>Save Image</title></head>
      <body style="margin:0;background:#FFFDF8;font-family:system-ui,-apple-system,sans-serif;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;color:#3E1F70;">
          <p style="font-size:14px;margin:0;text-align:center;line-height:1.5;">
            Press and hold the image, then Save to Photos.<br/>
            <span style="opacity:.7">(Desktop: right-click and Save Image.)</span>
          </p>
          <img src="${imgUrl}" alt="patisserie-image" style="max-width:100%;height:auto;display:block;" />
        </div>
      </body></html>
    `);
    w.document.close();
  };

  const onSaveImage = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const blobUrl = resolveBlobUrl();

    if (isMobile) {
      openImageInNewTab(blobUrl);
      if (blobUrl !== payload.url) {
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
      return;
    }

    try {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "patisserie-image.png";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      openImageInNewTab(blobUrl);
    }

    if (blobUrl !== payload.url) {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
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
          {gated ? (
            <>
              <a
                href="/pricing"
                className="rounded-full bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/10"
              >
                Go Pro — $20/mo
              </a>
              {credits > 0 ? (
                <button
                  disabled={spending}
                  onClick={async () => {
                    if (!payload.sliceId) return;
                    setSpending(true);
                    try {
                      const res = await spendSliceCredit({ data: { sliceId: payload.sliceId } });
                      setCredits(res.remaining);
                      window.location.reload();
                    } finally {
                      setSpending(false);
                    }
                  }}
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {spending ? "Unlocking…" : `Use 1 credit (${credits} left)`}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!user) return;
                    openCheckout({
                      priceId: "slice_pack_10",
                      userId: user.id,
                      customerEmail: user.email ?? undefined,
                      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
                    });
                  }}
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
                >
                  Get 10 unlocks — $3
                </button>
              )}
            </>
          ) : (
            <>
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
                onClick={(e) => {
                  e.preventDefault();
                  const blobUrl = resolveBlobUrl();
                  openImageInNewTab(blobUrl);
                  if (blobUrl !== payload.url) {
                    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                  }
                }}
                className="rounded-full bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/10"
              >
                Open in new tab ↗
              </a>
              <a
                href={payload.url}
                download="patisserie-image.png"
                onClick={onSaveImage}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
              >
                Save Image ↓
              </a>
            </>
          )}
        </div>

        <p className="mt-3 text-[11px] text-foreground/45">
          Filename: {payload.filename}
        </p>
      </div>

      {checkoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] overflow-y-auto bg-[#FFFDF8] px-4 py-5"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            <button
              onClick={closeCheckout}
              className="ml-auto rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/10"
            >
              Close ✕
            </button>
            <div className="mt-4">{checkoutElement}</div>
          </div>
        </div>
      )}
    </div>
  );
}
