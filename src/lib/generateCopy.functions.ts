import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  wish: z.string().min(1).max(800),
  visual: z.string().max(300).optional().default(""),
  text: z.string().max(300).optional().default(""),
  layout: z.string().max(300).optional().default(""),
  logo: z.string().max(300).optional().default(""),
  format: z.enum(["caption", "post", "headline"]).default("caption"),
});

export type GenerateCopyInput = z.infer<typeof InputSchema>;

export type GenerateCopyResult = {
  prompt: string;
  copy: string;
};

const FORMAT_HINTS: Record<GenerateCopyInput["format"], string> = {
  caption: "Short social caption (Instagram / TikTok). Under 60 words. One idea, one feeling, one CTA at most.",
  post: "Medium-length post (LinkedIn / blog excerpt / newsletter intro). 90–160 words. A hook, a middle, a landing.",
  headline: "Short-form. Give 5 numbered options: a hero headline, a subhead, an email subject line, a button label, and a one-line teaser.",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const composeBrief = (i: GenerateCopyInput): string => {
  const parts = [
    `Brief (flour — what to write about): ${i.wish}`,
    i.visual && `Tone (sugar — how it should feel): ${i.visual}`,
    i.text && `Length notes (yeast — how much it should rise): ${i.text}`,
    i.layout && `Audience (milk — who's reading): ${i.layout}`,
    i.logo && `Voice (salt — signature, brand, sign-off): ${i.logo}`,
    `Format: ${i.format} — ${FORMAT_HINTS[i.format]}`,
  ].filter(Boolean);
  return parts.join("\n");
};

const COPY_SYSTEM = `You are the "Copy Layer" of Layercake — the copywriting twin of an image generator.
You take a baker's brief (broken into ingredients: flour, sugar, yeast, milk, salt) and you write the finished copy.

Rules:
- Output the final copy ONLY. No preface, no "here's your copy:", no markdown headers, no quotes around the whole thing.
- Honor the requested format and length precisely. If it's a caption, do not write a blog post. If it's the headline pack, return the 5 numbered options and nothing else.
- Match the requested tone, audience, and voice. If the brief specifies a sign-off, use it.
- Never invent statistics, customer names, or quotes.
- No emoji unless the tone clearly calls for them.

CONTENT SAFETY (non-negotiable):
- Refuse anything sexual, pornographic, or involving minors in any suggestive context.
- Refuse hate speech, slurs, or content demeaning a protected group.
- Refuse content that incites, glorifies, or instructs violence, self-harm, terrorism, or crime.
- If the brief violates ANY of the above, output exactly: BLOCKED (single word, uppercase, nothing else).`;

const BANNED_PATTERNS: RegExp[] = [
  /\b(nude|naked|nsfw|porn|porno|pornographic|erotic|hentai|xxx|fetish|bdsm|blowjob|orgasm|orgy|genital|vagina|penis)\b/i,
  /\b(child|children|kid|kids|minor|minors|teen|teens|underage|loli|shota)\b[\s\S]{0,40}\b(sex|sexual|nude|naked|porn|erotic)\b/i,
  /\b(nigger|nigga|kike|chink|spic|faggot|tranny|raghead)\b/i,
  /\b(kill|gas|lynch|exterminate|deport)\s+(all\s+)?(jews|blacks|whites|muslims|gays|immigrants|asians)\b/i,
  /\b(behead|beheading|massacre|school\s+shoot|mass\s+shoot|bomb\s+(making|recipe|tutorial)|how\s+to\s+(make|build)\s+a?\s*(bomb|explosive|gun))\b/i,
  /\b(suicide\s+(method|tutorial|how)|self[-\s]?harm\s+(method|tutorial|how))\b/i,
];

const isBlockedInput = (i: GenerateCopyInput): boolean => {
  const blob = [i.wish, i.visual, i.text, i.layout, i.logo].filter(Boolean).join(" ");
  return BANNED_PATTERNS.some((re) => re.test(blob));
};

export const generateCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }): Promise<GenerateCopyResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    if (isBlockedInput(data)) {
      throw new Error(
        "This request can't be generated. Layercake doesn't allow sexual, hateful, violent, or illegal content.",
      );
    }

    // One credit per copy generation — same wallet as image slices.
    const { error: spendErr } = await supabaseAdmin.rpc("spend_generation_credit", {
      p_user_id: context.userId,
    });
    if (spendErr) {
      if ((spendErr.message || "").includes("no_credits")) {
        throw new Error("You're out of slices. Subscribe or buy a pack to keep generating.");
      }
      throw spendErr;
    }

    const brief = composeBrief(data);

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: COPY_SYSTEM },
          { role: "user", content: brief },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("[generateCopy] failed", res.status, t);
      if (res.status === 429) throw new Error("Rate limited — give it a beat and try again.");
      if (res.status === 402) throw new Error("AI credits exhausted on the workspace.");
      throw new Error("Copy generation failed. Please try again.");
    }

    const json = await res.json();
    const copy: string = (json.choices?.[0]?.message?.content ?? "").trim();

    if (!copy) throw new Error("No copy returned from the gateway.");
    if (/^BLOCKED\b/i.test(copy)) {
      throw new Error(
        "This request can't be generated. Layercake doesn't allow sexual, hateful, violent, or illegal content.",
      );
    }

    return { prompt: brief, copy };
  });
