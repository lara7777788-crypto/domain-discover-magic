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

    const { data: coupon, error: cErr } = await supabaseAdmin
      .from("coupons")
      .select("id, code, slices, max_uses, uses_count, expires_at, active")
      .eq("code", data.code)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!coupon || !coupon.active) throw new Error("Coupon not found");
    if (coupon.expires_at && new Date(coupon.expires_at as string) < new Date()) {
      throw new Error("Coupon expired");
    }
    if (
      coupon.max_uses != null &&
      (coupon.uses_count as number) >= (coupon.max_uses as number)
    ) {
      throw new Error("Coupon fully redeemed");
    }

    const { data: existing } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) throw new Error("You've already used this code");

    const { error: rErr } = await supabaseAdmin
      .from("coupon_redemptions")
      .insert({
        coupon_id: coupon.id,
        user_id: userId,
        slices_granted: coupon.slices,
      });
    if (rErr) {
      if ((rErr as { code?: string }).code === "23505") {
        throw new Error("You've already used this code");
      }
      throw rErr;
    }

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("slice_credits")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw pErr;

    const current = (profile?.slice_credits as number) ?? 0;
    const next = current + (coupon.slices as number);

    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({ slice_credits: next })
      .eq("id", userId);
    if (uErr) throw uErr;

    await supabaseAdmin
      .from("coupons")
      .update({ uses_count: (coupon.uses_count as number) + 1 })
      .eq("id", coupon.id);

    return { granted: coupon.slices as number, balance: next };
  });
