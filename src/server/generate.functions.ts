import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  wish: z.string().min(1).max(500),
  visual: z.string().max(200).optional().default(""),
  text: z.string().max(200).optional().default(""),
  layout: z.string().max(200).optional().default(""),
  logo: z.string().max(200).optional().default(""),
  format: z.enum(["social", "print", "marketing"]).default("social"),
});

export type GenerateInput = z.infer<typeof InputSchema>;

export type GenerateResult = {
  prompt: string;
  imageDataUrl: string;
};

const FORMAT_HINTS: Record<GenerateInput["format"], string> = {
  social: "1:1 square Instagram post, optimized for mobile feeds, eye-catching focal point",
  print: "vertical poster, A3 print resolution feel, refined composition with safe margins",
  marketing: "16:9 landscape banner, hero-image energy, clear focal area for headline overlay",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// --- Pure helpers (functional core) ---------------------------------------

const composeBriefPrompt = (i: GenerateInput): string => {
  const parts = [
    `User wish: ${i.wish}`,
    i.visual && `Mood / visual: ${i.visual}`,
    i.text && `Text on the piece: ${i.text}`,
    i.layout && `Layout: ${i.layout}`,
    i.logo && `Logo / mark: ${i.logo}`,
    `Intended use: ${i.format} (${FORMAT_HINTS[i.format]})`,
  ].filter(Boolean);
  return parts.join("\n");
};

const PROMPT_LAYER_SYSTEM = `You are the "Prompt Layer" of Layercake — a tiny step that
sits between a human's casual wish and an AI image generator.
Your only job: rewrite the user's brief into ONE single, vivid, concrete image prompt.
Rules:
- Output the prompt ONLY. No preface, no quotes, no lists.
- Keep it under 90 words.
- Always describe: subject, style, lighting, color palette, composition, and intended format.
- If the user mentioned text, include it verbatim in quotes.
- Never invent a brand name.`;

// --- Server function ------------------------------------------------------

export const generate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    // 1. Prompt layer — rewrite the wish into a real image prompt
    const briefRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: PROMPT_LAYER_SYSTEM },
          { role: "user", content: composeBriefPrompt(data) },
        ],
      }),
    });

    if (!briefRes.ok) {
      const t = await briefRes.text();
      console.error("[generate] Prompt layer failed", briefRes.status, t);
      throw new Error("Image generation failed. Please try again.");
    }

    const briefJson = await briefRes.json();
    const prompt: string =
      briefJson.choices?.[0]?.message?.content?.trim() ?? composeBriefPrompt(data);

    // 2. Image layer — generate image from rewritten prompt
    const imgRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imgRes.ok) {
      const t = await imgRes.text();
      console.error("[generate] Image layer failed", imgRes.status, t);
      throw new Error("Image generation failed. Please try again.");
    }

    const imgJson = await imgRes.json();
    const imageDataUrl: string | undefined =
      imgJson.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) throw new Error("No image returned from gateway");

    return { prompt, imageDataUrl };
  });
