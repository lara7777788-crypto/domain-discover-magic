import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { generate } from "@/lib/generate.functions";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";
import { makeThumb } from "@/lib/thumb";

export const Route = createFileRoute("/mix")({
  head: () => ({
    meta: [
      { title: "Mix — blend your slices and icing | Layercake" },
      { name: "description", content: "Pick two or three saved slices or icing texts and mix them into one brand-new Layercake visual." },
      { property: "og:title", content: "Mix — blend your slices and icing | Layercake" },
      { property: "og:description", content: "Blend up to three saved elements — images or copy — into a single new slice." },
      { property: "og:url", content: "https://layercake.site/mix" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://layercake.site/mix" }],
  }),
  component: MixPage,
});

type Item = {
  id: string;
  name: string;
  mode: string | null;
  copy_text: string | null;
};


const MAX = 3;

function MixPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [direction, setDirection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ prompt: string; imageDataUrl: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("id, name, mode, copy_text")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(36);

      if (cancelled) return;
      if (error) {
        console.error("[mix] load failed", error);
        setError("Couldn't load your saved elements. Please refresh.");
        setItems([]);
        return;
      }
      setItems((data ?? []) as unknown as Item[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX ? p : [...p, id]));
  };

  const onMix = async () => {
    if (!user || picked.length < 2) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    try {
      const chosen = picked
        .map((id) => items?.find((i) => i.id === id))
        .filter(Boolean) as Item[];

      // Pull previews only for the picked image elements.
      const refs: string[] = [];
      for (const c of chosen.filter((c) => c.mode !== "copy")) {
        const { data } = await supabase
          .from("designs")
          .select("preview_url")
          .eq("id", c.id)
          .eq("user_id", user.id)
          .maybeSingle();
        const url = data?.preview_url as string | null;
        if (url?.startsWith("data:image/")) refs.push(url);
      }

      const copyBits = chosen
        .filter((c) => c.mode === "copy" && c.copy_text)
        .map((c) => `"${(c.copy_text as string).slice(0, 400)}"`);


      const wish = [
        `Mix ${chosen.length} saved Layercake elements into ONE new coherent visual.`,
        `Elements: ${chosen.map((c) => c.name).join(" + ")}.`,
        refs.length ? `${refs.length} of them are attached as reference images — carry over their subject, palette, and style.` : "",
        copyBits.length ? `Written elements to honor: ${copyBits.join(" / ")}` : "",
        direction.trim() ? `Direction for the mix: ${direction.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const res = await generate({
        data: {
          wish: wish.slice(0, 500),
          visual: "cohesive blend, single unified composition",
          text: "",
          layout: "",
          logo: "",
          extra: "Blend the elements — do not make a collage of separate panels.",
          format: "social",
          ...(refs.length ? { referenceImages: refs.slice(0, 3) } : {}),
        },
      });
      setResult({ prompt: res.prompt, imageDataUrl: res.imageDataUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mixing went sideways.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const name = `Mix · ${picked.length} elements`;
      const { data, error } = await supabase
        .from("designs")
        .insert({
          user_id: user.id,
          name,
          preview_url: result.imageDataUrl,
          mode: "image",
          thumb_url: await makeThumb(result.imageDataUrl),
          data: { mode: "image", source: "mix", direction, result },
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      setSavedId(data?.id ?? null);
    } catch (e) {
      console.error("[mix] save failed", e);
      setError("Couldn't save that mix. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="relative min-h-screen"
      style={{ background: "linear-gradient(180deg, #FFE5F1 0%, #E9DDFB 45%, #D4E8FF 100%)" }}
    >
      <TopNav />
      <section className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">The blender</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">Mix.</h1>
        <p className="mt-3 max-w-xl text-foreground/65">
          Pick 2–3 saved elements — slices, icing copy, or both — and bake them into one new visual. Costs one slice.
        </p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.3em] text-foreground/50">
              Selected {picked.length}/{MAX}
            </span>
            <Link to="/slices" search={{ tab: "slices" as const }} className="text-xs font-semibold text-foreground/60 underline">
              Go to gallery
            </Link>
          </div>

          {items === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex h-24 animate-pulse items-center justify-center rounded-2xl bg-white/60 text-xs uppercase tracking-[0.25em] text-foreground/40">
                  Loading…
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-white bg-white/70 p-10 text-center text-foreground/60">
              Nothing saved yet — bake a slice or two first.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((it) => {
                const on = picked.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={`rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
                      on ? "border-foreground bg-foreground text-white" : "border-white bg-white/75 text-foreground"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.25em] opacity-60">
                      {it.mode === "copy" ? "Icing" : "Slice"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm font-semibold">{it.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <textarea
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          rows={2}
          placeholder="Optional direction — e.g. 'keep the pink palette, make it a poster for a Tokyo pop-up'."
          className="mt-6 w-full resize-none rounded-2xl border border-white/70 bg-white/75 p-4 text-base text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-white"
        />

        <button
          onClick={onMix}
          disabled={busy || picked.length < 2}
          className="mt-5 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-white shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy ? "Mixing…" : "Mix it 🍥"}
        </button>

        {result && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white bg-white/80 backdrop-blur">
            <img src={result.imageDataUrl} alt="Mixed result" className="w-full" />
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
                      filename: "layercake-mix.png",
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
