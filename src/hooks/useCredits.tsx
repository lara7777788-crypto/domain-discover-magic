import { useCallback, useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Wallet = {
  balance: number;
  monthlyLeft: number;
  monthlyAllowance: number;
  rollover: number;
  isAdmin: boolean;
};

const EMPTY: Wallet = { balance: 0, monthlyLeft: 0, monthlyAllowance: 0, rollover: 0, isAdmin: false };

/** Code typed on the sign-in page before a session existed — redeemed on first authed load. */
export const PENDING_CODE_KEY = "lc_pending_code";


/** Reads the signed-in user's remaining slices (monthly allowance + purchased packs). */
export function useCredits() {
  const { user } = useAuth();
  const instanceId = useId().replace(/:/g, "");
  const [wallet, setWallet] = useState<Wallet>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setWallet(EMPTY);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("credit_status" as never, {
      p_user_id: user.id,
    } as never);
    if (error) {
      console.error("[useCredits] failed", error);
      setLoading(false);
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) as
      | { balance: number | string; monthly_remaining: number | string; monthly_allowance: number | string; rollover?: number | string; is_admin: boolean }
      | undefined;
    setWallet({
      balance: Number(row?.balance ?? 0),
      monthlyLeft: Number(row?.monthly_remaining ?? 0),
      monthlyAllowance: Number(row?.monthly_allowance ?? 0),
      rollover: Number(row?.rollover ?? 0),
      isAdmin: Boolean(row?.is_admin),
    });
    setLoading(false);
  }, [user]);

  // Live balance: any credit spend/grant writes to profiles + credit_events.
  useEffect(() => {
    if (!user) return;
    try {
      const channel = supabase
        // Several app-wide and page-level components read the wallet at once.
        // Reusing one channel name makes the realtime client return an already
        // subscribed channel, which then throws when another callback is added.
        .channel(`credits-${user.id}-${instanceId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          () => {
            void refresh();
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "credit_events", filter: `user_id=eq.${user.id}` },
          () => {
            void refresh();
          },
        )
        .subscribe();
      return () => {
        void supabase.removeChannel(channel);
      };
    } catch (e) {
      // Live updates are a nicety — never let a realtime hiccup crash the page.
      console.error("[useCredits] realtime subscribe failed", e);
      return;
    }
  }, [user, refresh, instanceId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // A code entered on the sign-in page before the session existed.
      const pending = typeof window !== "undefined" ? window.localStorage.getItem(PENDING_CODE_KEY) : null;
      if (user && pending) {
        window.localStorage.removeItem(PENDING_CODE_KEY);
        try {
          const { redeemCoupon } = await import("@/lib/coupons.functions");
          await redeemCoupon({ data: { code: pending } });
        } catch (e) {
          console.error("[useCredits] pending code redeem failed", e);
        }
      }
      if (!cancelled) await refresh();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refresh, user]);


  /** Optimistically apply the wallet returned by a generation call. */
  const applyWallet = useCallback((next: { creditsLeft?: number; monthlyLeft?: number }) => {
    setWallet((w) => ({
      ...w,
      balance: next.creditsLeft ?? w.balance,
      monthlyLeft: next.monthlyLeft ?? w.monthlyLeft,
    }));
  }, []);

  const total = wallet.balance + wallet.monthlyLeft;

  /** Client-side quota guard — server still enforces via spend_credits. */
  const canSpend = useCallback(
    (cost: number) => wallet.isAdmin || loading || total >= cost,
    [wallet.isAdmin, loading, total],
  );

  return { ...wallet, total, loading, refresh, applyWallet, canSpend, resetsAt: nextQuotaReset() };
}

/**
 * Monthly allowances reset at the first instant of the next calendar month,
 * server-side (UTC) — same boundary `sync_credit_period` uses.
 */
export function nextQuotaReset(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0));
}

/** "Sep 1, 2:00 AM" in the viewer's own timezone. */
export const formatResetAt = (d: Date) =>
  d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const formatSlices = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
