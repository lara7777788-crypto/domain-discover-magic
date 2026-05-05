import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const spendSliceCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sliceId: string }) => {
    if (!data?.sliceId) throw new Error("sliceId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("slice_credits")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw pErr;

    const current = (profile?.slice_credits as number) ?? 0;
    if (current < 1) throw new Error("No slice credits available");

    const { error: dErr } = await supabaseAdmin
      .from("designs")
      .update({ is_unlocked: true })
      .eq("id", data.sliceId)
      .eq("user_id", userId);
    if (dErr) throw dErr;

    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({ slice_credits: current - 1 })
      .eq("id", userId);
    if (uErr) throw uErr;

    return { remaining: current - 1 };
  });
