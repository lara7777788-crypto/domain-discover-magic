import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { generate } from "@/lib/generate.functions";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";

export const Route = createFileRoute("/effects")({
  head: () => ({
    meta: [
      { title: "Effects — turn any word or logo 3D | Layercake" },
      { name: "description", content: "Type a word or drop a logo and render it in 3D, sparkle, balloon, candy, chocolate, chrome, rocket, space and more Layercake effects." },
      { property: "og:title", content: "Effects — turn any word or logo 3D | Layercake" },
      { property: "og:description", content: "Balloons, candy, chocolate, chrome, neon, lava, space — one word, thirty finishes." },
      { property: "og:url", content: "https://layercake.site/effects" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://layercake.site/effects" }],
  }),
  component: EffectsPage,
});

type Effect = { key: string; label: string; emoji: string; prompt: string };

const EFFECTS: Effect[] = [
  { key: "3d", label: "3D", emoji: "🧊", prompt: "rendered as bold extruded 3D typography, soft studio lighting, subtle shadows, octane-style render" },
  { key: "sparkle", label: "Sparkle", emoji: "✨", prompt: "covered in glittering sparkles and lens-flare stars, shimmering highlights, magical dust" },
  { key: "giant", label: "Giant", emoji: "🗻", prompt: "as a colossal monumental structure towering over tiny people, dramatic scale and perspective" },
  { key: "balloons", label: "Balloons", emoji: "🎈", prompt: "made of shiny inflated foil balloons floating with strings, party lighting" },
  { key: "bubble", label: "Bubble", emoji: "🫧", prompt: "made of iridescent soap bubbles, translucent rainbow film, backlit" },
  { key: "candy", label: "Candy", emoji: "🍬", prompt: "sculpted from glossy hard candy and sugar glass, vivid translucent colors" },
  { key: "chocolate", label: "Chocolate", emoji: "🍫", prompt: "molded from rich melting chocolate with cocoa dust and glossy drips" },
  { key: "cookies", label: "Cookies", emoji: "🍪", prompt: "baked as cookies with icing outlines and crumbs on parchment, overhead light" },
  { key: "cupcakes", label: "Cupcakes", emoji: "🧁", prompt: "arranged out of frosted cupcakes with sprinkles, pastel bakery styling" },
  { key: "cake", label: "Cake", emoji: "🍰", prompt: "sculpted as layered cake with piped buttercream lettering and cherries" },
  { key: "rockets", label: "Rockets", emoji: "🚀", prompt: "formed by rockets launching with fire trails and smoke plumes, dynamic diagonal energy" },
  { key: "space", label: "Space", emoji: "🌌", prompt: "floating in deep space among nebulae, stars and planets, cosmic glow" },
  { key: "mars", label: "Mars mission", emoji: "🪐", prompt: "on the red dusty surface of Mars beside a landed starship, rust-orange atmosphere, retro-futurist mission poster" },
  { key: "apache", label: "Aerial", emoji: "🚁", prompt: "in heavy military-aviation styling, stenciled metal, rotor downwash dust, cinematic dusk" },
  { key: "neon", label: "Neon", emoji: "💡", prompt: "as glowing neon tube signage on a wet night street, reflections and bloom" },
  { key: "chrome", label: "Chrome", emoji: "🪞", prompt: "as liquid chrome metal with mirror reflections, Y2K aesthetic" },
  { key: "gold", label: "Gold leaf", emoji: "🥇", prompt: "in embossed gold leaf on deep matte paper, luxury foil print" },
  { key: "holo", label: "Holographic", emoji: "🌈", prompt: "as holographic iridescent foil shifting through spectral colors" },
  { key: "ice", label: "Ice", emoji: "🧊", prompt: "carved from crystal-clear ice with frost, cold blue light and mist" },
  { key: "lava", label: "Lava", emoji: "🌋", prompt: "cast in molten lava and cracked basalt, glowing embers" },
  { key: "flowers", label: "Flowers", emoji: "🌸", prompt: "grown from fresh flowers and foliage, botanical flatlay, natural light" },
  { key: "plush", label: "Plush", emoji: "🧸", prompt: "as soft stitched plush fabric with visible seams and fuzz, cozy studio light" },
  { key: "blocks", label: "Toy bricks", emoji: "🧱", prompt: "built out of colorful plastic toy building bricks, macro photo" },
  { key: "origami", label: "Origami", emoji: "🕊️", prompt: "folded from crisp origami paper, clean shadows, Japanese minimalism" },
  { key: "graffiti", label: "Graffiti", emoji: "🎨", prompt: "spray-painted as a wildstyle graffiti piece on concrete, drips and highlights" },
  { key: "water", label: "Water splash", emoji: "💦", prompt: "formed by a frozen high-speed water splash, droplets suspended, backlit" },
  { key: "fireworks", label: "Fireworks", emoji: "🎆", prompt: "drawn in exploding fireworks against a night sky, long-exposure sparks" },
  { key: "embroidery", label: "Embroidery", emoji: "🧵", prompt: "embroidered in thick thread on canvas, visible stitching texture" },
  { key: "latte", label: "Latte art", emoji: "☕", prompt: "poured as latte art in a ceramic cup, overhead café shot" },
  { key: "sushi", label: "Sushi", emoji: "🍣", prompt: "arranged from fresh sushi and nori on a slate board, overhead food photography" },
];

const PALETTES = ["Layercake pastels", "Black & white", "Neon night", "Warm earth", "Candy pop"];

function EffectsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [word, setWord] = useState("");
  const [effect, setEffect] = useState<string>("3d");
  const [palette, setPalette] = useState<string>(PALETTES[0]);
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imageDataUrl: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const onPickLogo = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError("Use a PNG, JPG, or WebP logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Keep the logo under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  const chosen = EFFECTS.find((e) => e.key === effect) ?? EFFECTS[0];

  const onRender = async () => {
    if (!word.trim() && !logo) {
      setError("Type a word or drop a logo first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    try {
      const res = await generate({
        data: {
          wish: `The word "${word.trim() || "logo"}" ${chosen.prompt}. Hero lettering fills the frame.`.slice(0, 500),
          visual: `${chosen.label} finish · ${palette}`,
          text: word.trim(),
          layout: "centered hero lettering, generous margins",
          logo: logo ? "Match the attached logo's shapes and letterforms exactly." : "",
          extra: "Spell the text exactly as given. No extra words, no watermarks.",
          format: "social",
          ...(logo ? { referenceImages: [logo] } : {}),
        },
      });
      setResult({ imageDataUrl: res.imageDataUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't render. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("designs")
        .insert({
          user_id: user.id,
          name: `${word.trim() || "Logo"} · ${chosen.label}`,
          preview_url: result.imageDataUrl,
          data: { mode: "image", source: "effects", effect: chosen.key, word, palette, result },
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      setSavedId(data?.id ?? null);
    } catch (e) {
      console.error("[effects] save failed", e);
      setError("Couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="relative min-h-screen"
      style={{ background: "linear-gradient(180deg, #FFF6BE 0%, #FFE0EC 50%, #D9F1D2 100%)" }}
    >
      <TopNav />
      <section className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">The finishing shop</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">Effects.</h1>
        <p className="mt-3 max-w-xl text-foreground/65">
          Any word or logo — rendered in 3D, sparkles, balloons, candy, chrome, rockets and more. Costs one slice.
        </p>

        {error && <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            maxLength={40}
            placeholder="Your word — e.g. LAYERCAKE"
            className="w-full rounded-2xl border border-white/70 bg-white/80 p-4 text-lg font-semibold text-foreground placeholder:font-normal placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <label className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-dashed border-white bg-white/60 px-5 py-4 text-sm font-semibold text-foreground/70 transition hover:bg-white">
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { onPickLogo(e.target.files); e.target.value = ""; }} />
            {logo ? "Logo attached ✓" : "🖼️ Add logo"}
          </label>
        </div>

        {logo && (
          <div className="mt-3 flex items-center gap-3">
            <img src={logo} alt="Logo reference" className="h-14 w-14 rounded-xl object-cover" />
            <button onClick={() => setLogo(null)} className="text-xs font-semibold text-foreground/60 underline">
              Remove
            </button>
          </div>
        )}

        <div className="mt-8">
          <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-foreground/50">Finish</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {EFFECTS.map((e) => {
              const on = e.key === effect;
              return (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setEffect(e.key)}
                  className={`rounded-2xl px-3 py-3 text-sm font-semibold transition active:scale-95 ${
                    on ? "bg-foreground text-white" : "bg-white/75 text-foreground/80 hover:bg-white"
                  }`}
                >
                  <span className="mr-1">{e.emoji}</span>
                  {e.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-foreground/50">Palette</p>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPalette(p)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  p === palette ? "bg-foreground text-white" : "bg-white/75 text-foreground/70"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onRender}
          disabled={busy}
          className="mt-8 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-white shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {busy ? "Rendering…" : `Render in ${chosen.label} ${chosen.emoji}`}
        </button>

        {result && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white bg-white/80 backdrop-blur">
            <img src={result.imageDataUrl} alt={`${word} in ${chosen.label} style`} className="w-full" />
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
                      filename: `${(word.trim() || "logo").toLowerCase()}-${chosen.key}.png`,
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
