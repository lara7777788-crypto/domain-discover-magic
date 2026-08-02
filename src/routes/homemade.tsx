import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { generate } from "@/lib/generate.functions";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";
import { makeThumb } from "@/lib/thumb";
import { useCredits } from "@/hooks/useCredits";
import { CreditMeter } from "@/components/CreditMeter";

export const Route = createFileRoute("/homemade")({
  validateSearch: (s: Record<string, unknown>) => ({
    from: typeof s.from === "string" ? s.from : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Home made cake — write the whole prompt | Layercake" },
      {
        name: "description",
        content:
          "Skip the layers. Paste or write a full image prompt and Layercake renders it exactly as written — one slice per bake.",
      },
      { property: "og:title", content: "Home made cake — write the whole prompt | Layercake" },
      {
        property: "og:description",
        content: "Full-prompt mode for people who already know exactly what they want.",
      },
      { property: "og:url", content: "https://layercake.site/homemade" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://layercake.site/homemade" }],
  }),
  component: HomemadePage,
});

const FORMATS = [
  { key: "social" as const, label: "Square · social" },
  { key: "print" as const, label: "Poster · print" },
  { key: "marketing" as const, label: "Wide · banner" },
];

function HomemadePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const credits = useCredits();
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<(typeof FORMATS)[number]["key"]>("social");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imageDataUrl: string; prompt: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/", replace: true });
  }, [authLoading, user, navigate]);

  // Reusing a prompt from the archive.
  useEffect(() => {
    if (!user || !from) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("designs")
        .select("prompt_text")
        .eq("id", from)
        .eq("user_id", user.id)
        .maybeSingle();
      const text = (data as { prompt_text?: string | null } | null)?.prompt_text;
      if (!cancelled && text) setPrompt(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, from]);

  const onBake = async () => {
    if (prompt.trim().length < 8) {
      setError("Write a little more — at least a sentence.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    try {
      const res = await generate({
        data: {
          wish: prompt.trim().slice(0, 500),
          format,
          intent: "image" as const,
          raw: true,
        },
      });
      credits.applyWallet(res);
      setResult({ imageDataUrl: res.imageDataUrl, prompt: res.prompt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't bake. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { data, error: err } = await supabase
        .from("designs")
        .insert({
          user_id: user.id,
          name: prompt.trim().slice(0, 60) || "Home made cake",
          preview_url: result.imageDataUrl,
          mode: "image",
          prompt_text: result.prompt,
          thumb_url: await makeThumb(result.imageDataUrl),
          data: { mode: "image", source: "homemade", prompt: result.prompt, format },
        })
        .select("id")
        .maybeSingle();
      if (err) throw err;
      setSavedId(data?.id ?? null);
    } catch (e) {
      console.error("[homemade] save failed", e);
      setError("Couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="relative min-h-screen"
      style={{ background: "linear-gradient(180deg, #FFF1F6 0%, #F3ECFF 45%, #E4F3DC 100%)" }}
    >
      <TopNav />
      <section className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
          Straight from scratch
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Home made cake.
        </h1>
        <p className="mt-3 max-w-xl text-foreground/65">
          No layers, no rewriting. Your prompt goes to the image model exactly as you wrote it —
          perfect for reusing a prompt from your archive. Costs one slice.
        </p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <label className="mt-8 block text-[11px] uppercase tracking-[0.3em] text-foreground/50">
          Your full prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          maxLength={500}
          placeholder="A cinematic still of a pale pink lotus opening over still water at dawn, soft mist, olive-green reeds, mustard sunlight, shallow depth of field, 35mm film grain…"
          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/85 p-4 text-sm leading-relaxed text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <div className="mt-1 text-right text-[11px] text-foreground/40">{prompt.length}/500</div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFormat(f.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                f.key === format ? "bg-foreground text-white" : "bg-white/75 text-foreground/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <CreditMeter
          className="mt-8"
          total={credits.total}
          cost={1}
          isAdmin={credits.isAdmin}
          loading={credits.loading}
        />

        <button
          onClick={onBake}
          disabled={busy || !credits.canSpend(1)}
          className="mt-6 block rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-white shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy ? "Baking…" : "Bake it 🍰"}
        </button>

        {result && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white bg-white/80 backdrop-blur">
            <img src={result.imageDataUrl} alt={prompt.slice(0, 80)} className="w-full" />
            <div className="flex flex-wrap gap-2 border-t border-foreground/5 p-4">
              <button
                onClick={onSave}
                disabled={saving || !!savedId}
                className="rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {savedId ? "Saved ✓" : saving ? "Saving…" : "Save to My slices"}
              </button>
              {savedId && (
                <button
                  onClick={() =>
                    setSavePayload({
                      url: result.imageDataUrl,
                      filename: "homemade-cake.png",
                      sliceId: savedId,
                      locked: false,
                    })
                  }
                  className="rounded-full bg-foreground/5 px-5 py-2.5 text-xs font-semibold text-foreground/80"
                >
                  Download
                </button>
              )}
            </div>
          </div>
        )}
      </section>
      <SaveSheet payload={savePayload} onClose={() => setSavePayload(null)} />
    </main>
  );
}
