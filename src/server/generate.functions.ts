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
    i.logo && `Brand reference (product, logo, packaging, vibe shot, or photo): ${i.logo}`,
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
- Never invent a brand name.

CONTENT SAFETY (non-negotiable):
- Refuse anything sexual, pornographic, nude, or suggestive — including implied nudity, lingerie, fetish, or minors in any context.
- Refuse hate speech, racism, slurs, or content demeaning a protected group.
- Refuse content that incites, glorifies, or instructs violence, self-harm, terrorism, or any crime.
- Refuse gore, cruelty toward people or animals, or real public figures in defamatory/sexual/violent contexts.
- If the brief violates ANY of the above, output exactly: BLOCKED (single word, uppercase, nothing else). Do not negotiate or soften.`;

const BANNED_PATTERNS: RegExp[] = [
  /\b(nude|naked|nsfw|porn|porno|pornographic|sexy|sexual|erotic|erotica|hentai|xxx|fetish|bdsm|lingerie|topless|upskirt|blowjob|orgasm|orgy|genital|genitalia|vagina|penis|anal|nipples?|tits|boobs|pussy|cock|dick)\b/i,
  /\b(child|children|kid|kids|minor|minors|teen|teens|underage|loli|shota)\b[\s\S]{0,40}\b(sex|sexual|nude|naked|porn|erotic)\b/i,
  /\b(sex|sexual|nude|naked|porn|erotic)\b[\s\S]{0,40}\b(child|children|kid|kids|minor|minors|teen|teens|underage|loli|shota)\b/i,
  /\b(nigger|nigga|kike|chink|spic|faggot|tranny|retard|raghead)\b/i,
  /\b(white|black|jewish|muslim|asian|arab|hispanic)\s+(supremac|genocide|are\s+(inferior|subhuman))/i,
  /\b(kill|gas|lynch|exterminate|deport)\s+(all\s+)?(jews|blacks|whites|muslims|gays|immigrants|asians)\b/i,
  /\b(behead|beheading|decapitat|massacre|school\s+shoot|mass\s+shoot|terror\s*attack|bomb\s+(making|recipe|tutorial)|how\s+to\s+(make|build)\s+a?\s*(bomb|explosive|gun))\b/i,
  /\b(suicide\s+(method|tutorial|how)|self[-\s]?harm\s+(method|tutorial|how)|kill\s+myself)\b/i,
];

const isBlockedInput = (i: GenerateInput): boolean => {
  const blob = [i.wish, i.visual, i.text, i.layout, i.logo].filter(Boolean).join(" ");
  return BANNED_PATTERNS.some((re) => re.test(blob));
};

// --- Server function ------------------------------------------------------

export const generate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    if (isBlockedInput(data)) {
      throw new Error(
        "This request can't be generated. Layercake doesn't allow sexual, hateful, violent, or illegal content.",
      );
    }

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

    if (/^BLOCKED\b/i.test(prompt)) {
      throw new Error(
        "This request can't be generated. Layercake doesn't allow sexual, hateful, violent, or illegal content.",
      );
    }

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
