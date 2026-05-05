import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { generate, type GenerateInput } from "../server/generate.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/bake")({
  validateSearch: (s: Record<string, unknown>) => ({
    slice: typeof s.slice === "string" ? s.slice : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Bake — Layercake" },
      { name: "description", content: "Design social, print, and marketing visuals — one delicious layer at a time." },
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

const LAYERS: LayerDef[] = [
  { key: "wish",   name: "Wish",   tagline: "Say it plainly.",        hint: "A poster for a pastry shop in Kyoto, soft and dreamy.",  bg: "#FFE0EC", ink: "#7A2A4E" },
  { key: "visual", name: "Visual", tagline: "Choose a mood.",         hint: "Editorial · Playful · Hand-drawn · Cinematic",           bg: "#FFE6CF", ink: "#7A4A1F" },
  { key: "text",   name: "Text",   tagline: "What words live on it?", hint: "A title, a tagline, or nothing at all.",                 bg: "#FFF6BE", ink: "#6E5A0E" },
  { key: "layout", name: "Layout", tagline: "Where the eye lands.",   hint: "Centered · Off-axis · Grid · Generous space",            bg: "#D9F1D2", ink: "#1F5A2A" },
  { key: "logo",   name: "Logo",   tagline: "A signature, optional.", hint: "Drop a mark, monogram, or wordmark.",                    bg: "#D4E8FF", ink: "#1A3D6E" },
];

const FORMATS: { key: GenerateInput["format"]; label: string; desc: string }[] = [
  { key: "social",    label: "Social",    desc: "1:1 — Instagram, TikTok" },
  { key: "print",     label: "Print",     desc: "Vertical poster, A3" },
  { key: "marketing", label: "Marketing", desc: "16:9 banner, hero" },
];

const emptyValues = (): Record<LayerKey, string> =>
  LAYERS.reduce((a, l) => ({ ...a, [l.key]: "" }), {} as Record<LayerKey, string>);

function BakePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { slice: sliceId } = Route.useSearch();
  const [active, setActive] = useState(0);
  const [values, setValues] = useState<Record<LayerKey, string>>(emptyValues);
  const [format, setFormat] = useState<GenerateInput["format"]>("social");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ prompt: string; imageDataUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect to login if not authed
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // Load existing slice if ?slice=ID
  useEffect(() => {
    if (!user || !sliceId) return;
    (async () => {
      const { data } = await supabase
        .from("designs")
        .select("id, data")
        .eq("id", sliceId)
        .maybeSingle();
      if (data?.data) {
        const d = data.data as { values?: Record<LayerKey, string>; format?: GenerateInput["format"]; result?: typeof result };
        if (d.values) setValues({ ...emptyValues(), ...d.values });
        if (d.format) setFormat(d.format);
        if (d.result) setResult(d.result);
        setSavedId(data.id);
      }
    })();
  }, [user, sliceId]);

  const containerRef = useRef<HTMLDivElement>(null);
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
    payload: { values: typeof values; format: typeof format; result: typeof result | null },
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
      setError(e instanceof Error ? e.message : "Couldn't save your slice.");
    } finally {
      setSaving(false);
    }
  };

  const onBake = async () => {
    if (!values.wish.trim()) {
      setError("Add a wish first — it's the base of the cake.");
      goTo(0);
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await generate({ data: { ...values, format } });
      setResult(res);
      goTo(LAYERS.length);
      // Auto-save
      const name = values.wish.trim().slice(0, 60) || "Untitled slice";
      await persistSlice({ values, format, result: res }, name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went sideways.");
    } finally {
      setLoading(false);
    }
  };

  const totalPanels = LAYERS.length + 1; // + result

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="pointer-events-auto font-display text-base font-semibold text-foreground/70 transition hover:text-foreground">
          ← layercake
        </Link>
        <div className="pointer-events-auto rounded-full bg-white/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/60 backdrop-blur">
          {active < LAYERS.length ? `Layer ${active + 1} / ${LAYERS.length} · ${LAYERS[active].name}` : "Your slice"}
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
            Slice
          </span>
          <span className="block h-3 w-3 rounded-full border" style={{ background: active === LAYERS.length ? "#222" : "transparent", borderColor: "#222" }} />
        </button>
      </nav>

      {/* Panels */}
      <div ref={containerRef} className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
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
                Layer {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display text-5xl font-semibold leading-[1.02] md:text-6xl" style={{ color: l.ink }}>
                {l.name}.
              </h2>
              <p className="mt-3 text-lg italic opacity-75" style={{ color: l.ink }}>{l.tagline}</p>

              <textarea
                value={values[l.key]}
                onChange={(e) => setValues((v) => ({ ...v, [l.key]: e.target.value }))}
                placeholder={l.hint}
                rows={3}
                className="mt-8 w-full resize-none rounded-2xl border border-white/60 bg-white/70 p-5 text-base text-foreground placeholder:text-foreground/35 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.2)] backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white"
              />

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
          style={{ background: "linear-gradient(180deg, #ECE0FF 0%, #FFFDF8 100%)", color: "#3E1F70" }}
        >
          <div className="mx-auto w-full max-w-2xl">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.4em] opacity-60">The cherry on top</p>
            <h2 className="font-display text-5xl font-semibold leading-[1.02] md:text-6xl">Bake the slice.</h2>
            <p className="mt-3 text-lg italic opacity-75">Where will it live?</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => {
                const on = format === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className="rounded-2xl border-2 p-4 text-left transition"
                    style={{
                      borderColor: on ? "#3E1F70" : "rgba(62,31,112,0.15)",
                      background: on ? "#3E1F70" : "rgba(255,255,255,0.7)",
                      color: on ? "#fff" : "#3E1F70",
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
                {loading ? "Baking…" : "Bake my slice 🍰"}
              </button>
              <span className="text-xs opacity-60">First slice is on the house.</span>
            </div>

            {result && (
              <div className="mt-10 rounded-3xl border border-white bg-white/80 p-4 shadow-[0_30px_60px_-30px_rgba(62,31,112,0.4)] backdrop-blur">
                <img
                  src={result.imageDataUrl}
                  alt="Your generated visual"
                  className="w-full rounded-2xl"
                />
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-foreground/70">See the prompt layer</summary>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-foreground/5 p-3 font-mono text-xs text-foreground/80">
                    {result.prompt}
                  </p>
                </details>
                <div className="mt-3 flex justify-end">
                  <a
                    href={result.imageDataUrl}
                    download="layercake.png"
                    className="text-sm font-medium text-foreground/70 underline-offset-4 hover:underline"
                  >
                    Download ↓
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
