import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/hooks/useSubscription";
import { nextUpgrade, getPlan } from "@/lib/plans";

const KEY = "lc_upgrade_nudge_seen";

/**
 * Gentle "ready to upgrade?" bar. Shows once per billing cycle for subscribers
 * who still have a bigger plan available. Dismissal is keyed to the current
 * period start, so it reappears at most once each cycle.
 */
export function UpgradeNudge() {
  const { user } = useAuth();
  const { sub, isActive } = useSubscription();
  const [hidden, setHidden] = useState(true);

  const current = getPlan(sub?.price_id);
  const next = nextUpgrade(sub?.price_id);
  const cycleKey = sub?.current_period_end ?? sub?.id ?? "";
  const eligible = Boolean(user && isActive && current && next);

  useEffect(() => {
    if (typeof window === "undefined" || !eligible) {
      setHidden(true);
      return;
    }
    setHidden(window.localStorage.getItem(KEY) === cycleKey);
  }, [eligible, cycleKey]);

  if (!eligible || hidden || !next || !current) return null;

  const dismiss = () => {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, cycleKey);
    setHidden(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm shadow-[0_20px_40px_-24px_rgba(0,0,0,0.4)] backdrop-blur">
        <span className="text-lg">🍰</span>
        <p className="flex-1 text-foreground/75">
          New billing cycle — if you're ready to upgrade, <strong>{next.name}</strong> gives you{" "}
          {next.slices} slices/month ({current.slices} now). You only pay the prorated difference.
        </p>
        <Link
          to="/pricing"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white"
        >
          See plans
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss upgrade suggestion"
          className="shrink-0 rounded-full px-2 py-1 text-xs text-foreground/40 hover:text-foreground/70"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
