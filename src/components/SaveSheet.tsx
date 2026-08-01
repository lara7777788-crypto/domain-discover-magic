import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { supabase } from "@/integrations/supabase/client";
import { spendSliceCredit } from "@/lib/credits.functions";

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
  const [saveNote, setSaveNote] = useState<string | null>(null);

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

  const [saveNote, setSaveNote] = useState<string | null>(null);

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

  const getBlob = async (): Promise<Blob | null> => {
    if (payload.blob) return payload.blob;
    if (payload.url.startsWith("data:")) return dataUrlToBlob(payload.url);
    try {
      const res = await fetch(payload.url, { mode: "cors" });
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  };

  const onSaveImage = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setSaveNote(null);

    const blob = await getBlob();
    const objectUrl = blob ? URL.createObjectURL(blob) : payload.url;

    // Native share sheet is the reliable "Save to Photos" path on mobile.
    if (blob && isMobile) {
      const file = new File([blob], payload.filename, { type: blob.type || "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
        share?: (d: { files: File[]; title?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        try {
          await nav.share({ files: [file], title: payload.filename });
          URL.revokeObjectURL(objectUrl);
          return;
        } catch {
          /* fall through to download */
        }
      }
    }

    try {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = payload.filename || "layercake-slice.png";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSaveNote(
        isMobile
          ? "Saved to your downloads. If nothing happened, press and hold the image above and choose Save to Photos."
          : "Saved to your downloads.",
      );
    } catch {
      setSaveNote("Press and hold the image above, then choose Save to Photos.");
    }

    if (objectUrl !== payload.url) {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
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
                download={payload.filename}
                onClick={onSaveImage}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
              >
                Download ↓
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
