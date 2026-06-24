import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { generate, type GenerateInput } from "@/lib/generate.functions";
import { generateCopy, type GenerateCopyInput } from "@/lib/generateCopy.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ChipRow } from "@/components/ChipRow";
import { IcingPanel, defaultIcing, type IcingState } from "@/components/IcingPanel";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";

type Mode = "image" | "copy";

export const Route = createFileRoute("/bake")({
  validateSearch: (s: Record<string, unknown>) => ({
    slice: typeof s.slice === "string" ? s.slice : undefined,
    remix: typeof s.remix === "string" ? s.remix : undefined,
    mode: (s.mode === "copy" ? "copy" : "image") as Mode,
  }),
  head: () => ({
    meta: [
      { title: "Bake a Slice — Layercake" },
      { name: "description", content: "Design social, print, and marketing visuals — one delicious layer at a time. Wish, visual, text, layout, brand." },
      { property: "og:title", content: "Bake a Slice — Layercake" },
      { property: "og:description", content: "Layer your wish, mood, text, layout, and brand. Bake a slice for social, print, or marketing." },
      { property: "og:url", content: "https://layercake.site/bake" },
    ],
    links: [
      { rel: "canonical", href: "https://layercake.site/bake" },
    ],
  }),
  component: BakePage,
});

type LayerKey = "wish" | "visual" | "text" | "layout" | "logo";

type LayerDef = {
  key: LayerKey;
  name: string;
  tagline: string;
  hint: string;
  bg: string;
  ink: string;
};

const IMAGE_LAYERS: LayerDef[] = [
  { key: "wish",   name: "Wish",   tagline: "Say it plainly.",        hint: "A poster for a pastry shop in Kyoto, soft and dreamy.",  bg: "#FFE0EC", ink: "#7A2A4E" },
  { key: "visual", name: "Visual", tagline: "Choose a mood.",         hint: "Editorial · Playful · Hand-drawn · Cinematic",           bg: "#FFE6CF", ink: "#7A4A1F" },
  { key: "text",   name: "Text",   tagline: "What words live on it?", hint: "A title, a tagline, or nothing at all.",                 bg: "#FFF6BE", ink: "#6E5A0E" },
  { key: "layout", name: "Layout", tagline: "Where the eye lands.",   hint: "Centered · Off-axis · Grid · Generous space",            bg: "#D9F1D2", ink: "#1F5A2A" },
  { key: "logo",   name: "Brand",  tagline: "Anything that's yours.",  hint: "Product · logo · packaging · vibe shot · photo — describe or drop it in.", bg: "#D4E8FF", ink: "#1A3D6E" },
];

// Copy mode: same 5 layer KEYS (so saved chips reuse cleanly), reframed as
// pantry ingredients with a blue palette. Flour, sugar, yeast, milk, salt.
const COPY_LAYERS: LayerDef[] = [
  { key: "wish",   name: "Flour",    tagline: "What are you writing about?",       hint: "Launch announcement for our sourdough starter kit — friends-and-family preview.", bg: "#DCE7F8", ink: "#13265C" },
  { key: "visual", name: "Sugar",    tagline: "How sweet should it taste?",        hint: "Warm, slightly cheeky, never corporate. Confident but not loud.",                  bg: "#CFDDF3", ink: "#0F2050" },
  { key: "text",   name: "Yeast",    tagline: "How much should it rise?",          hint: "One Instagram caption, under 60 words. Or: 'long enough to breathe, short enough to read'.", bg: "#C2D2EE", ink: "#0B1A45" },
  { key: "layout", name: "Milk",     tagline: "Who's drinking it in?",             hint: "Home bakers, 25–45, curious not expert. They love process, not jargon.",            bg: "#B6CAE9", ink: "#08153A" },
  { key: "logo",   name: "Salt",     tagline: "Signature notes & sign-off.",       hint: "First person, occasional baker's pun. Sign off: 'with butter, Lev.' Avoid: 'circle back', 'unlock', 'leverage'.", bg: "#AAC1E4", ink: "#06112F" },
];

type ImageFormat = GenerateInput["format"];
type CopyFormat = GenerateCopyInput["format"];
type AnyFormat = ImageFormat | CopyFormat;

const IMAGE_FORMATS: { key: ImageFormat; label: string; desc: string }[] = [
  { key: "social",    label: "Social",    desc: "1:1 — Instagram, TikTok" },
  { key: "print",     label: "Print",     desc: "Vertical poster, A3" },
  { key: "marketing", label: "Marketing", desc: "16:9 banner, hero" },
];

const COPY_FORMATS: { key: CopyFormat; label: string; desc: string }[] = [
  { key: "caption",  label: "Caption",  desc: "Short — Instagram, TikTok" },
  { key: "post",     label: "Post",     desc: "Medium — LinkedIn, newsletter" },
  { key: "headline", label: "Headline", desc: "Pack of 5 — hero, sub, subject, button, teaser" },
];

const emptyValues = (layers: LayerDef[]): Record<LayerKey, string> =>
  layers.reduce((a, l) => ({ ...a, [l.key]: "" }), {} as Record<LayerKey, string>);

function BakePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { slice: sliceId, remix: remixId, mode } = Route.useSearch();
  const isCopy = mode === "copy";

  const LAYERS = useMemo(() => (isCopy ? COPY_LAYERS : IMAGE_LAYERS), [isCopy]);
  const FORMATS = useMemo(() => (isCopy ? COPY_FORMATS : IMAGE_FORMATS), [isCopy]);

  const [active, setActive] = useState(0);
  const [values, setValues] = useState<Record<LayerKey, string>>(() => emptyValues(LAYERS));
  const [format, setFormat] = useState<AnyFormat>(isCopy ? "caption" : "social");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ prompt: string; imageDataUrl?: string; copy?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [icing, setIcing] = useState<IcingState>(defaultIcing);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const [copied, setCopied] = useState(false);

  // Per-mode terminology
  const TERMS = isCopy
    ? {
        noun: "ingredient",
        nounPlural: "ingredients",
        finalLabel: "Your copy",
        finalKicker: "The sign-off",
        finalHeadline: "Whip the copy.",
        finalSub: "What format should it come out as?",
        ctaIdle: "Whip the copy 🥣",
        ctaBusy: "Whipping…",
        firstFreeNote: "Costs one slice — same wallet as image slices.",
        validationMissing: "Add a brief first — flour is the base.",
        finalBg: "linear-gradient(180deg, #B6CAE9 0%, #FFFDF8 100%)",
        finalInk: "#06112F",
      }
    : {
        noun: "slice",
        nounPlural: "slices",
        finalLabel: "Your slice",
        finalKicker: "The cherry on top",
        finalHeadline: "Bake the slice.",
        finalSub: "Where will it live?",
        ctaIdle: "Bake my slice 🍰",
        ctaBusy: "Baking…",
        firstFreeNote: "First slice is on the house.",
        validationMissing: "Add a wish first — it's the base of the cake.",
        finalBg: "linear-gradient(180deg, #ECE0FF 0%, #FFFDF8 100%)",
        finalInk: "#3E1F70",
      };

  // Redirect to login if not authed
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // Load existing slice (?slice=ID) or seed an unsaved remix draft (?remix=ID)
  useEffect(() => {
    if (!user) return;
    const sourceId = sliceId ?? remixId;
    if (!sourceId) return;
    (async () => {
      const { data } = await supabase
        .from("designs")
        .select("id, data")
        .eq("id", sourceId)
        .maybeSingle();
      if (data?.data) {
        const d = data.data as {
          values?: Record<LayerKey, string>;
          format?: AnyFormat;
          result?: typeof result;
          icing?: IcingState;
        };
        if (d.values) setValues({ ...emptyValues(LAYERS), ...d.values });
        if (d.format) setFormat(d.format);
        // For remix: drop the source's rendered result so nothing saves until they Bake
        if (d.result && !remixId) setResult(d.result);
        if (d.icing) setIcing({ ...defaultIcing, ...d.icing });
        // Only attach savedId when opening an existing slice — remix stays an unsaved draft
        if (!remixId) setSavedId(data.id);
      }
    })();
  }, [user, sliceId, remixId, LAYERS]);


  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Record<LayerKey, HTMLTextAreaElement | null>>({
    wish: null,
    visual: null,
    text: null,
    layout: null,
    logo: null,
  });
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        });
      },
      { root, threshold: 0.55 },
    );
    sectionRefs.current.forEach((s) => s && obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = sectionRefs.current[i];
    if (el && containerRef.current) {
      containerRef.current.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
  };

  const persistSlice = async (
    payload: {
      values: typeof values;
      format: typeof format;
      result: typeof result | null;
      icing: IcingState;
      mode: Mode;
    },
    name: string,
  ) => {
    if (!user) return;
    setSaving(true);
    try {
      if (savedId) {
        await supabase
          .from("designs")
          .update({ data: payload, name, preview_url: payload.result?.imageDataUrl ?? null })
          .eq("id", savedId);
      } else {
        const { data, error } = await supabase
          .from("designs")
          .insert({
            user_id: user.id,
            name,
            data: payload,
            preview_url: payload.result?.imageDataUrl ?? null,
          })
          .select("id")
          .single();
        if (error) throw error;
        if (data) setSavedId(data.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `Couldn't save your ${TERMS.noun}.`);
    } finally {
      setSaving(false);
    }
  };

  const onBake = async () => {
    const currentValues = LAYERS.reduce(
      (next, layer) => ({
        ...next,
        [layer.key]: textRefs.current[layer.key]?.value ?? values[layer.key],
      }),
      {} as Record<LayerKey, string>,
    );

    if (!currentValues.wish.trim()) {
      setError(TERMS.validationMissing);
      goTo(0);
      return;
    }
    setValues(currentValues);
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = isCopy
        ? await generateCopy({ data: { ...currentValues, format: format as CopyFormat } })
        : await generate({ data: { ...currentValues, format: format as ImageFormat } });
      setResult(res);
      goTo(LAYERS.length);
      const fallback = isCopy ? "Untitled copy" : "Untitled slice";
      const name = currentValues.wish.trim().slice(0, 60) || fallback;
      await persistSlice(
        { values: currentValues, format, result: res, icing, mode: isCopy ? "copy" : "image" },
        name,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went sideways.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced autosave for icing edits on already-saved image slices with a result
  useEffect(() => {
    if (isCopy || !savedId || !result) return;
    const t = setTimeout(() => {
      const name = values.wish.trim().slice(0, 60) || "Untitled slice";
      persistSlice({ values, format, result, icing, mode: "image" }, name);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icing]);

  const onDownload = (payload: SavePayload) => setSavePayload(payload);

  const closeSave = () => {
    if (savePayload?.url.startsWith("blob:")) URL.revokeObjectURL(savePayload.url);
    setSavePayload(null);
  };

  const onCopyText = async () => {
    if (!result?.copy) return;
    try {
      await navigator.clipboard.writeText(result.copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy — select the text and copy manually.");
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <h1 className="sr-only">{isCopy ? "Whip a copy ingredient" : "Bake a new slice"}</h1>
      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="pointer-events-auto font-display text-base font-semibold text-foreground/70 transition hover:text-foreground">
          ← layercake
        </Link>
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-full bg-white/70 p-1 text-[11px] font-medium uppercase tracking-[0.2em] backdrop-blur">
            <Link
              to="/bake"
              search={{ slice: sliceId, mode: "image" as Mode }}
              className={`rounded-full px-3 py-1 transition ${!isCopy ? "bg-foreground text-white" : "text-foreground/60 hover:text-foreground"}`}
            >
              Slice
            </Link>
            <Link
              to="/bake"
              search={{ slice: sliceId, mode: "copy" as Mode }}
              className={`rounded-full px-3 py-1 transition ${isCopy ? "bg-foreground text-white" : "text-foreground/60 hover:text-foreground"}`}
            >
              Copy
            </Link>
          </div>
          <div className="rounded-full bg-white/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/60 backdrop-blur">
            {saving
              ? "Saving…"
              : active < LAYERS.length
                ? `Layer ${active + 1} / ${LAYERS.length} · ${LAYERS[active].name}`
                : TERMS.finalLabel}
          </div>
          <Link
            to="/slices"
            className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/70 backdrop-blur transition hover:text-foreground"
          >
            My {TERMS.nounPlural}
          </Link>
        </div>
      </header>

      {/* Right rail */}
      <nav aria-label="Layers" className="fixed right-5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-1.5">
        {LAYERS.map((l, i) => {
          const isActive = active === i;
          return (
            <button key={l.key} onClick={() => goTo(i)} aria-label={l.name} className="group flex items-center gap-3">
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] transition-all ${isActive ? "opacity-90" : "opacity-0 group-hover:opacity-60"}`}
                style={{ color: l.ink }}
              >
                {l.name}
              </span>
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 44 : 26, height: 8, background: l.bg,
                  boxShadow: isActive ? `0 4px 14px -4px ${l.ink}55, inset 0 -2px 0 0 rgba(255,255,255,0.6)` : `inset 0 -1px 0 0 rgba(255,255,255,0.5)`,
                  border: `1px solid ${l.ink}22`,
                }}
              />
            </button>
          );
        })}
        <button onClick={() => goTo(LAYERS.length)} aria-label="Result" className="group mt-2 flex items-center gap-3">
          <span className={`text-[10px] font-medium uppercase tracking-[0.2em] ${active === LAYERS.length ? "opacity-90" : "opacity-0 group-hover:opacity-60"}`}>
            {isCopy ? "Copy" : "Slice"}
          </span>
          <span className="block h-3 w-3 rounded-full border" style={{ background: active === LAYERS.length ? "#222" : "transparent", borderColor: "#222" }} />
        </button>
      </nav>

      {/* Panels */}
      <div ref={containerRef} className="h-screen snap-y snap-proximity overflow-y-scroll scroll-smooth">
        {LAYERS.map((l, i) => (
          <section
            key={l.key}
            data-idx={i}
            ref={(el) => { sectionRefs.current[i] = el; }}
            className="relative flex h-screen w-full snap-start items-center justify-center px-6"
            style={{ background: `linear-gradient(180deg, ${l.bg} 0%, #FFFDF8 100%)`, color: l.ink }}
          >
            <div className="mx-auto w-full max-w-xl">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.4em] opacity-60" style={{ color: l.ink }}>
                {isCopy ? "Ingredient" : "Layer"} {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display text-5xl font-semibold leading-[1.02] md:text-6xl" style={{ color: l.ink }}>
                {l.name}.
              </h2>
              <p className="mt-3 text-lg italic opacity-75" style={{ color: l.ink }}>{l.tagline}</p>

              <textarea
                ref={(el) => { textRefs.current[l.key] = el; }}
                value={values[l.key]}
                onChange={(e) => setValues((v) => ({ ...v, [l.key]: e.target.value }))}
                placeholder={l.hint}
                rows={3}
                className="mt-8 w-full resize-none rounded-2xl border border-white/60 bg-white/70 p-5 text-base text-foreground placeholder:text-foreground/35 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.2)] backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white"
              />

              {user && (
                <ChipRow
                  layer={l.key}
                  ink={l.ink}
                  currentValue={values[l.key]}
                  userId={user.id}
                  onPick={(content) => setValues((v) => ({ ...v, [l.key]: content }))}
                />
              )}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => i > 0 && goTo(i - 1)}
                  disabled={i === 0}
                  className="text-sm font-medium opacity-60 transition hover:opacity-100 disabled:invisible"
                  style={{ color: l.ink }}
                >
                  ↑ Previous
                </button>
                <button
                  onClick={() => goTo(i + 1)}
                  className="rounded-full px-6 py-3 text-sm font-medium text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
                  style={{ background: l.ink }}
                >
                  {i === LAYERS.length - 1 ? "Choose format ↓" : `Next: ${LAYERS[i + 1].name} ↓`}
                </button>
              </div>
            </div>
          </section>
        ))}

        {/* Final panel — format + bake + result */}
        <section
          data-idx={LAYERS.length}
          ref={(el) => { sectionRefs.current[LAYERS.length] = el; }}
          className="relative flex min-h-screen w-full snap-start items-center justify-center px-6 py-24"
          style={{ background: TERMS.finalBg, color: TERMS.finalInk }}
        >
          <div className="mx-auto w-full max-w-2xl">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.4em] opacity-60">{TERMS.finalKicker}</p>
            <h2 className="font-display text-5xl font-semibold leading-[1.02] md:text-6xl">{TERMS.finalHeadline}</h2>
            <p className="mt-3 text-lg italic opacity-75">{TERMS.finalSub}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => {
                const on = format === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className="rounded-2xl border-2 p-4 text-left transition"
                    style={{
                      borderColor: on ? TERMS.finalInk : `${TERMS.finalInk}26`,
                      background: on ? TERMS.finalInk : "rgba(255,255,255,0.7)",
                      color: on ? "#fff" : TERMS.finalInk,
                    }}
                  >
                    <div className="font-display text-lg font-semibold">{f.label}</div>
                    <div className="text-xs opacity-70">{f.desc}</div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={onBake}
                disabled={loading}
                className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? TERMS.ctaBusy : TERMS.ctaIdle}
              </button>
              <span className="text-xs opacity-60">{TERMS.firstFreeNote}</span>
            </div>

            {result && (
              <div className="mt-10 space-y-4">
                {isCopy && result.copy ? (
                  <div
                    className="rounded-3xl border bg-white/85 p-6 shadow-[0_30px_60px_-30px_rgba(6,17,47,0.35)] backdrop-blur"
                    style={{ borderColor: `${TERMS.finalInk}1f` }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: TERMS.finalInk, opacity: 0.6 }}>
                        Fresh from the oven
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onCopyText}
                          className="rounded-full px-3 py-1 text-xs font-medium text-white transition"
                          style={{ background: TERMS.finalInk }}
                        >
                          {copied ? "Copied ✓" : "Copy text"}
                        </button>
                        <button
                          onClick={onBake}
                          disabled={loading}
                          className="rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50"
                          style={{ borderColor: `${TERMS.finalInk}40`, color: TERMS.finalInk }}
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                    <p
                      className="whitespace-pre-wrap font-display text-lg leading-relaxed"
                      style={{ color: TERMS.finalInk }}
                    >
                      {result.copy}
                    </p>
                  </div>
                ) : result.imageDataUrl ? (
                  <IcingPanel
                    imageUrl={result.imageDataUrl}
                    icing={icing}
                    setIcing={setIcing}
                    onDownload={onDownload}
                    onDownloadError={setError}
                  />
                ) : null}
                <details className="text-sm">
                  <summary className="cursor-pointer text-foreground/70">See the prompt layer</summary>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-foreground/5 p-3 font-mono text-xs text-foreground/80">
                    {result.prompt}
                  </p>
                </details>
              </div>
            )}
          </div>
        </section>
      </div>
      <SaveSheet payload={savePayload} onClose={closeSave} />
    </div>
  );
}
