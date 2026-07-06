import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_design",
  title: "Create design",
  description: "Save a new Layercake design (slice draft) for the signed-in user.",
  inputSchema: {
    name: z.string().trim().min(1).max(120).describe("Human-readable design name."),
    data: z
      .record(z.string(), z.unknown())
      .default({})
      .describe("Arbitrary layer/config JSON for the design."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, data }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data: row, error } = await supabaseForUser(ctx)
      .from("designs")
      .insert({ user_id: ctx.getUserId(), name, data })
      .select("id, name, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created design ${row.id}` }],
      structuredContent: { design: row },
    };
  },
});
