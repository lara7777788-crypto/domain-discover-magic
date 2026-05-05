import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const redeemCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => {
    const code = data?.code?.trim().toUpperCase();
    if (!code || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
      throw new Error("Invalid code format");
    }
    return { code };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: result, error } = await supabaseAdmin.rpc("redeem_coupon_atomic", {
      p_user_id: userId,
      p_code: data.code,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("coupon_not_found")) throw new Error("Coupon not found");
      if (msg.includes("coupon_expired")) throw new Error("Coupon expired");
      if (msg.includes("coupon_exhausted")) throw new Error("Coupon fully redeemed");
      if (msg.includes("already_redeemed")) throw new Error("You've already used this code");
      throw error;
    }

    const row = Array.isArray(result) ? result[0] : result;
    return {
      granted: (row?.granted as number) ?? 0,
      balance: (row?.balance as number) ?? 0,
    };
  });
