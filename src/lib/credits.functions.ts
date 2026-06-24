import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const spendSliceCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sliceId: string }) => {
    if (!data?.sliceId) throw new Error("sliceId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: remaining, error } = await supabaseAdmin.rpc("spend_slice_credit", {
      p_user_id: userId,
      p_slice_id: data.sliceId,
    });
    if (error) {
      if (error.message?.includes("no_credits")) throw new Error("No slice credits available");
      if (error.message?.includes("design_not_found")) throw new Error("Design not found");
      console.error("[spendSliceCredit] unexpected error", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }

    return { remaining: remaining as number };
  });
