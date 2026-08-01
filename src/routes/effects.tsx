import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { generate } from "@/lib/generate.functions";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";
import { makeThumb } from "@/lib/thumb";

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

type Effect = { key: string; label: string; emoji: string; swatch: string; hint: string; prompt: string };

const EFFECTS: Effect[] = [
  { key: "3d", label: "3D", emoji: "🧊", swatch: "linear-gradient(135deg,#EAE6FF,#B9A7FF 55%,#6E5AC8)", hint: "Extruded studio render", prompt: "rendered as bold extruded 3D typography, soft studio lighting, subtle contact shadows, octane-style render, glossy bevelled edges" },
  { key: "3d-inflate", label: "3D puffy", emoji: "🎾", swatch: "linear-gradient(135deg,#FFE9F3,#FFB8D8 60%,#FF7FB5)", hint: "Soft inflated blob type", prompt: "as soft inflated puffy 3D lettering, rounded rubbery volume, matte vinyl surface, gentle top light" },
  { key: "3d-glass", label: "3D glass", emoji: "🔮", swatch: "linear-gradient(135deg,#E4FBFF,#A7E6FF 55%,#5AB8E8)", hint: "Refractive glass render", prompt: "as thick refractive glass 3D typography with caustics, chromatic dispersion and soft rim light" },
  { key: "sparkle", label: "Sparkle", emoji: "✨", swatch: "linear-gradient(135deg,#FFF6C9,#FFE38A 55%,#F5C542)", hint: "Glitter + lens flares", prompt: "covered in glittering sparkles and lens-flare stars, shimmering highlights, magical dust" },
  { key: "diamond", label: "Diamond", emoji: "💎", swatch: "linear-gradient(135deg,#F3FCFF,#CDE9FF 50%,#8FBFE8)", hint: "Faceted gem facets", prompt: "encrusted in faceted diamonds and crystal facets, brilliant sparkle, jewelry macro photography" },
  { key: "giant", label: "Giant", emoji: "🗻", swatch: "linear-gradient(135deg,#EFEDE6,#C9C4B4 60%,#8C866F)", hint: "Monumental scale", prompt: "as a colossal monumental structure towering over tiny people, dramatic scale and perspective" },
  { key: "balloons", label: "Balloons", emoji: "🎈", swatch: "linear-gradient(135deg,#FFE3E9,#FF9DBB 55%,#E8557E)", hint: "Shiny foil party balloons", prompt: "made of shiny inflated foil balloons floating with ribbons and strings, party lighting, reflective mylar" },
  { key: "balloon-arch", label: "Balloon arch", emoji: "🎉", swatch: "linear-gradient(135deg,#FFF0D6,#FFC9A3 55%,#F2865E)", hint: "Event balloon garland", prompt: "built from a dense balloon-garland arch of mixed sizes, event styling, soft daylight" },
  { key: "bubble", label: "Bubble", emoji: "🫧", swatch: "linear-gradient(135deg,#EAFBFF,#BFEBFF 50%,#8FD0F0)", hint: "Iridescent soap film", prompt: "made of iridescent soap bubbles, translucent rainbow film, backlit, floating droplets" },
  { key: "bubblegum", label: "Bubblegum", emoji: "🩷", swatch: "linear-gradient(135deg,#FFE6F2,#FFA8D2 55%,#FF6FB2)", hint: "Stretchy pink gum", prompt: "sculpted from stretchy pink bubblegum with glossy strands and a blown bubble, playful studio shot" },
  { key: "candy", label: "Candy", emoji: "🍬", swatch: "linear-gradient(135deg,#FFF0F6,#FFC1DA 45%,#7ED9E8)", hint: "Glossy sugar glass", prompt: "sculpted from glossy hard candy and sugar glass, vivid translucent colors, backlit shine" },
  { key: "gummy", label: "Gummy", emoji: "🐻", swatch: "linear-gradient(135deg,#FFF6C9,#FFB44D 55%,#E8453C)", hint: "Jelly gummy sweets", prompt: "made of translucent jelly gummy candy with sugar crystals, chewy glossy surface, macro light" },
  { key: "lollipop", label: "Lollipop", emoji: "🍭", swatch: "linear-gradient(135deg,#FFEAF6,#FFA6C9 45%,#8FD6B4)", hint: "Swirl candy stripes", prompt: "as swirled lollipop candy with spiral stripes and cellophane wrap highlights" },
  { key: "sprinkles", label: "Sprinkles", emoji: "🌈", swatch: "linear-gradient(135deg,#FFFFFF,#FFD9E8 45%,#BCE7FF)", hint: "Confetti nonpareils", prompt: "coated in rainbow sprinkles and nonpareils over smooth frosting, overhead bakery photography" },
  { key: "chocolate", label: "Chocolate", emoji: "🍫", swatch: "linear-gradient(135deg,#E3CBAE,#A9754A 55%,#4B2A17)", hint: "Melting cocoa drips", prompt: "molded from rich melting chocolate with cocoa dust and glossy drips" },
  { key: "caramel", label: "Caramel", emoji: "🍯", swatch: "linear-gradient(135deg,#FFEBC2,#E8A845 55%,#8C5A1E)", hint: "Golden pour", prompt: "made of glossy pouring caramel and toffee with slow golden drips, warm light" },
  { key: "cookies", label: "Cookies", emoji: "🍪", swatch: "linear-gradient(135deg,#F6E3C4,#D2A26A 55%,#8C5A2B)", hint: "Iced biscuit letters", prompt: "baked as cookies with icing outlines and crumbs on parchment, overhead light" },
  { key: "cupcakes", label: "Cupcakes", emoji: "🧁", swatch: "linear-gradient(135deg,#FFF1F7,#FFCCE2 55%,#D9A7C7)", hint: "Frosted pastel swirls", prompt: "arranged out of frosted cupcakes with sprinkles, pastel bakery styling" },
  { key: "cake", label: "Cake", emoji: "🍰", swatch: "linear-gradient(135deg,#FFF6F0,#FFD9C7 50%,#F2A7A0)", hint: "Piped buttercream", prompt: "sculpted as layered cake with piped buttercream lettering and cherries" },
  { key: "rockets", label: "Rockets", emoji: "🚀", swatch: "linear-gradient(135deg,#FFE7C2,#FF8A4C 50%,#2B2140)", hint: "Fire trails + smoke", prompt: "formed by rockets launching with fire trails and smoke plumes, dynamic diagonal energy" },
  { key: "space", label: "Space", emoji: "🌌", swatch: "linear-gradient(135deg,#2B2140,#5B3F8C 55%,#1B1230)", hint: "Nebula cosmic glow", prompt: "floating in deep space among nebulae, stars and planets, cosmic glow" },
  { key: "mars", label: "Mars mission", emoji: "🪐", swatch: "linear-gradient(135deg,#FFD9B0,#E0703C 55%,#8A3417)", hint: "Red planet mission poster", prompt: "on the red dusty surface of Mars beside a landed starship, rust-orange atmosphere, retro-futurist mission poster" },
  { key: "moon", label: "Moon base", emoji: "🌕", swatch: "linear-gradient(135deg,#F2F2EF,#C6C6C2 55%,#5F5F63)", hint: "Lunar regolith + earthrise", prompt: "on a grey lunar surface with regolith dust, earthrise in the black sky, hard sunlight" },
  { key: "satellite", label: "Orbital", emoji: "🛰️", swatch: "linear-gradient(135deg,#DDEBFF,#7FA6E8 55%,#1E2A55)", hint: "Satellite panels in orbit", prompt: "constructed from satellite panels and orbital hardware above the curved earth, solar glare" },
  { key: "apache", label: "Aerial", emoji: "🚁", swatch: "linear-gradient(135deg,#DDE3D6,#8C9479 55%,#3B402F)", hint: "Stenciled metal, dusk", prompt: "in heavy military-aviation styling, stenciled metal, rotor downwash dust, cinematic dusk" },
  { key: "neon", label: "Neon", emoji: "💡", swatch: "linear-gradient(135deg,#1A1030,#FF3FA4 55%,#26E0FF)", hint: "Wet-street tube signage", prompt: "as glowing neon tube signage on a wet night street, reflections and bloom" },
  { key: "chrome", label: "Chrome", emoji: "🪞", swatch: "linear-gradient(135deg,#FFFFFF,#C9D2DA 45%,#6C7783)", hint: "Y2K liquid metal", prompt: "as liquid chrome metal with mirror reflections, Y2K aesthetic" },
  { key: "gold", label: "Gold leaf", emoji: "🥇", swatch: "linear-gradient(135deg,#FFF3C4,#E8C25A 55%,#8C6A1E)", hint: "Embossed luxury foil", prompt: "in embossed gold leaf on deep matte paper, luxury foil print" },
  { key: "holo", label: "Holographic", emoji: "🌈", swatch: "linear-gradient(135deg,#C9F7FF,#F0C4FF 45%,#FFE9A8)", hint: "Spectral shifting foil", prompt: "as holographic iridescent foil shifting through spectral colors" },
  { key: "ice", label: "Ice", emoji: "❄️", swatch: "linear-gradient(135deg,#F0FBFF,#BFE9FA 50%,#7FB8D6)", hint: "Frosted crystal carve", prompt: "carved from crystal-clear ice with frost, cold blue light and mist" },
  { key: "lava", label: "Lava", emoji: "🌋", swatch: "linear-gradient(135deg,#FFD08A,#F2571E 50%,#2A1410)", hint: "Molten glowing cracks", prompt: "cast in molten lava and cracked basalt, glowing embers" },
  { key: "smoke", label: "Smoke", emoji: "💨", swatch: "linear-gradient(135deg,#F0F0F2,#B8B6C2 55%,#5A5866)", hint: "Ink-in-water plumes", prompt: "formed from soft swirling smoke plumes on a dark background, long-exposure wisps" },
  { key: "flowers", label: "Flowers", emoji: "🌸", swatch: "linear-gradient(135deg,#FFEFF5,#FFC3DA 45%,#A8D5A2)", hint: "Botanical flatlay", prompt: "grown from fresh flowers and foliage, botanical flatlay, natural light" },
  { key: "plush", label: "Plush", emoji: "🧸", swatch: "linear-gradient(135deg,#FFF0DE,#E8C39E 55%,#B4855C)", hint: "Stitched fuzzy fabric", prompt: "as soft stitched plush fabric with visible seams and fuzz, cozy studio light" },
  { key: "blocks", label: "Toy bricks", emoji: "🧱", swatch: "linear-gradient(135deg,#FFE066,#FF6B6B 50%,#4D96FF)", hint: "Plastic brick macro", prompt: "built out of colorful plastic toy building bricks, macro photo" },
  { key: "claymation", label: "Clay", emoji: "🪀", swatch: "linear-gradient(135deg,#FFE3D1,#E9A88C 55%,#A96A52)", hint: "Stop-motion plasticine", prompt: "modelled in plasticine clay with fingerprint texture, stop-motion set lighting" },
  { key: "origami", label: "Origami", emoji: "🕊️", swatch: "linear-gradient(135deg,#FFFFFF,#FFE0E8 50%,#CDDCE8)", hint: "Folded paper minimalism", prompt: "folded from crisp origami paper, clean shadows, Japanese minimalism" },
  { key: "papercut", label: "Paper cut", emoji: "📄", swatch: "linear-gradient(135deg,#FFF7E8,#FFD9B8 50%,#EBAF9A)", hint: "Layered paper depth", prompt: "as layered laser-cut paper craft with stacked depth and soft drop shadows" },
  { key: "graffiti", label: "Graffiti", emoji: "🎨", swatch: "linear-gradient(135deg,#FFD93D,#FF5E7E 50%,#3A3A55)", hint: "Wildstyle spray drips", prompt: "spray-painted as a wildstyle graffiti piece on concrete, drips and highlights" },
  { key: "water", label: "Water splash", emoji: "💦", swatch: "linear-gradient(135deg,#EAF8FF,#9FD8F5 50%,#3E8FC4)", hint: "Frozen high-speed splash", prompt: "formed by a frozen high-speed water splash, droplets suspended, backlit" },
  { key: "fireworks", label: "Fireworks", emoji: "🎆", swatch: "linear-gradient(135deg,#1A1230,#F5C542 50%,#FF4F9A)", hint: "Long-exposure sparks", prompt: "drawn in exploding fireworks against a night sky, long-exposure sparks" },
  { key: "embroidery", label: "Embroidery", emoji: "🧵", swatch: "linear-gradient(135deg,#FFF4E3,#E0B98F 55%,#8C6E4A)", hint: "Thick thread stitching", prompt: "embroidered in thick thread on canvas, visible stitching texture" },
  { key: "latte", label: "Latte art", emoji: "☕", swatch: "linear-gradient(135deg,#F6E7D3,#C9A177 55%,#6B4429)", hint: "Overhead café pour", prompt: "poured as latte art in a ceramic cup, overhead café shot" },
  { key: "sushi", label: "Sushi", emoji: "🍣", swatch: "linear-gradient(135deg,#FFF3F1,#FFB3A0 50%,#2E4A3C)", hint: "Slate board flatlay", prompt: "arranged from fresh sushi and nori on a slate board, overhead food photography" },
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
    if (!authLoading && !user) navigate({ to: "/", replace: true });
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
          mode: "image",
          thumb_url: await makeThumb(result.imageDataUrl),
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
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50">Finish</p>
            <p className="text-[11px] text-foreground/45">{EFFECTS.length} styles</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {EFFECTS.map((e) => {
              const on = e.key === effect;
              return (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setEffect(e.key)}
                  title={e.hint}
                  className={`overflow-hidden rounded-2xl text-left transition active:scale-95 ${
                    on
                      ? "bg-foreground text-white shadow-[0_16px_30px_-18px_rgba(0,0,0,0.6)] ring-2 ring-foreground"
                      : "bg-white/80 text-foreground/80 hover:bg-white"
                  }`}
                >
                  <span
                    className="relative flex h-16 w-full items-center justify-center text-2xl"
                    style={{ background: e.swatch }}
                    aria-hidden="true"
                  >
                    <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">{e.emoji}</span>
                    {on && (
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 text-[10px] font-bold text-foreground">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="block px-3 py-2">
                    <span className="block text-sm font-semibold leading-tight">{e.label}</span>
                    <span className={`block text-[11px] leading-tight ${on ? "text-white/70" : "text-foreground/50"}`}>
                      {e.hint}
                    </span>
                  </span>
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
