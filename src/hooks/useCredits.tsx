import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type Wallet = {
  balance: number;
  monthlyLeft: number;
  monthlyAllowance: number;
  isAdmin: boolean;
};

const EMPTY: Wallet = { balance: 0, monthlyLeft: 0, monthlyAllowance: 0, isAdmin: false };

/** Reads the signed-in user's remaining slices (monthly allowance + purchased packs). */
export function useCredits() {
  const { user } = useAuth();
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
      | { balance: number | string; monthly_remaining: number | string; monthly_allowance: number | string; is_admin: boolean }
      | undefined;
    setWallet({
      balance: Number(row?.balance ?? 0),
      monthlyLeft: Number(row?.monthly_remaining ?? 0),
      monthlyAllowance: Number(row?.monthly_allowance ?? 0),
      isAdmin: Boolean(row?.is_admin),
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Optimistically apply the wallet returned by a generation call. */
  const applyWallet = useCallback((next: { creditsLeft?: number; monthlyLeft?: number }) => {
    setWallet((w) => ({
      ...w,
      balance: next.creditsLeft ?? w.balance,
      monthlyLeft: next.monthlyLeft ?? w.monthlyLeft,
    }));
  }, []);

  const total = wallet.balance + wallet.monthlyLeft;

  return { ...wallet, total, loading, refresh, applyWallet };
}

export const formatSlices = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
