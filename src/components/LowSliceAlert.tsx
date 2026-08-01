import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatSlices, useCredits } from "@/hooks/useCredits";

const DISMISS_KEY = "lc_low_slice_dismissed_at";
const TOAST_KEY = "lc_low_slice_toasted";

/** Reads the signed-in user's low-slice threshold (default 10). */
export function useLowSliceThreshold() {
  const { user } = useAuth();
  const [threshold, setThreshold] = useState(10);
  const [emailOptIn, setEmailOptIn] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await (supabase.from("profiles") as never as {
        select: (c: string) => {
          eq: (
            k: string,
            v: string,
          ) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> };
        };
      })
        .select("low_slice_threshold, low_slice_alert_email")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || error || !data) return;
      if (data["low_slice_threshold"] != null) setThreshold(Number(data["low_slice_threshold"]));
      if (data["low_slice_alert_email"] != null)
        setEmailOptIn(Boolean(data["low_slice_alert_email"]));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = async (next: { threshold?: number; emailOptIn?: boolean }) => {
    if (next.threshold !== undefined) setThreshold(next.threshold);
    if (next.emailOptIn !== undefined) setEmailOptIn(next.emailOptIn);
    if (!user) return;
    const patch: Record<string, unknown> = {};
    if (next.threshold !== undefined) patch["low_slice_threshold"] = next.threshold;
    if (next.emailOptIn !== undefined) patch["low_slice_alert_email"] = next.emailOptIn;
    const { error } = await (supabase.from("profiles") as never as {
      update: (p: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error: unknown }>;
      };
    })
      .update(patch)
      .eq("id", user.id);
    if (error) console.error("[lowSlice] save failed", error);
  };

  return { threshold, emailOptIn, save };
}

/**
 * App-wide "you're running low on slices" alert: a one-time toast per session
 * plus a dismissible banner while the balance sits under the threshold.
 */
export function LowSliceAlert() {
  const { user } = useAuth();
  const { total, isAdmin, loading } = useCredits();
  const { threshold } = useLowSliceThreshold();
  const [dismissed, setDismissed] = useState(true);

  const low = Boolean(user) && !isAdmin && !loading && total < threshold;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!low) {
      setDismissed(true);
      return;
    }
    const dismissedAt = Number(window.sessionStorage.getItem(DISMISS_KEY) ?? 0);
    setDismissed(Date.now() - dismissedAt < 1000 * 60 * 60);
    if (!window.sessionStorage.getItem(TOAST_KEY)) {
      window.sessionStorage.setItem(TOAST_KEY, "1");
      toast(
        total <= 0
          ? "You're out of slices 🍰"
          : `Only ${formatSlices(total)} slice${total === 1 ? "" : "s"} left 🍰`,
        {
          description: "Redeem a code or grab a pack to keep baking.",
          duration: 8000,
          action: {
            label: "Get slices",
            onClick: () => {
              window.location.href = "/pricing";
            },
          },
        },
      );
    }
  }, [low, total]);

  if (!low || dismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white bg-[#FFE9F1]/95 px-4 py-3 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)] backdrop-blur">
        <span aria-hidden className="text-lg">
          🍰
        </span>
        <div className="min-w-0 flex-1 text-sm text-foreground/80">
          <strong className="text-foreground">
            {total <= 0
              ? "You're out of slices."
              : `${formatSlices(total)} slice${total === 1 ? "" : "s"} left.`}
          </strong>{" "}
          Redeem a code or top up before your next bake.
        </div>
        <Link
          to="/pricing"
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"
        >
          Get slices
        </Link>
        <button
          aria-label="Dismiss low slice alert"
          onClick={() => {
            window.sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
            setDismissed(true);
          }}
          className="shrink-0 rounded-full px-2 py-1 text-foreground/45 transition hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
