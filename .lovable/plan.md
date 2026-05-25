
# Layercake — Premium Refinement Plan

A focused pass on the homepage and global visual system. No backend, auth, or pricing changes. All work lives in frontend/presentation code.

## 1. Visual System Upgrade (`src/styles.css`)

Refine the pastel palette into a more cinematic, editorial register without losing the wagashi soul.

- Slightly deepen `--foreground` for stronger editorial contrast.
- Add new tokens: `--gradient-ambient` (soft multi-stop pastel wash), `--gradient-icing` (hero radial), `--shadow-soft` (long, low-opacity), `--shadow-tactile` (button), `--grain` (SVG noise data URL).
- Add a global `.grain` overlay utility (fixed, mix-blend-overlay, ~6% opacity) applied at the root.
- Add new keyframes: `floaty` (cake hover), `ambient` (slow gradient drift), `layerRise` (stack assembly), `shimmer` (button sheen).
- Introduce two display weights for editorial hierarchy: Fredoka 600 for the wordmark/CTAs, plus an italic serif accent via `Instrument Serif` for the subheading word "beautiful" to add Parisian editorial flavor.

## 2. Hero Refinement (`src/routes/index.tsx`, `src/components/LayerCake.tsx`)

- Wrap the hero in an ambient gradient stage with a soft radial light behind the cake and a faint grain layer on top.
- LayerCake gets: subtle perspective tilt, drop shadow under the plate, gentle `floaty` animation (6s ease-in-out), specular highlight on each tier, and a glow ring behind the cherry.
- Typography hierarchy:
  - Eyebrow: small uppercase tracked label "Visual identity studio".
  - H1: "Make *beautiful* things, layer by layer." — "beautiful" in Instrument Serif italic, oversized, tighter leading, more negative space around it.
  - Subheading (new): "AI-native visual identity systems for the next generation of creators, brands and worlds." — max-width ~46ch, muted foreground, generous line-height.
  - Primary CTA: tactile pill with soft inner highlight, shadow-tactile, hover lift + shimmer sweep.
  - Secondary ghost link beside it.
- Rhythm: increase vertical spacing, center column max-w ~960px, asymmetric placement of small floating "ingredient" chips (sprinkles, dots) for whimsy.

## 3. New Homepage Sections (below hero)

Added in order inside `src/routes/index.tsx`, each with smooth scroll-reveal (IntersectionObserver + CSS transitions, no new deps).

**A. "Build a world, not just a logo."**
Editorial two-column: oversized serif headline left, short paragraph right explaining Layercake builds cohesive systems — logo, type, color, motion, voice — not isolated assets.

**B. Output Showcase Grid**
Bento-style masonry of 6 categories with pastel placeholder cards (CSS-only mock artifacts — no image generation needed, keeps it fast and on-brand):
brand identities · posters · packaging · editorial graphics · social campaigns · AI character worlds.
Each card uses a different palette token + a stylized SVG mock so it reads as a real output sample. Hover: subtle lift + tilt.

**C. Layer Stack Animation**
New component `src/components/LayerStack.tsx`. On scroll-into-view, six labeled layers (Concept → Palette → Type → Logo → Motion → World) rise and stack with staggered `layerRise` animation, forming a small identity system card at the end. Loops gently after assembly.

**D. "Prompts → Systems" explainer**
Centered short statement: "Layercake turns prompts into cohesive visual systems instead of isolated images." Flanked by a left "prompt" chip and right "system" cluster of 4 mini swatches/glyphs, with an animated connecting line.

**E. Closing CTA band**
Soft gradient band, single tactile CTA ("Bake your first slice"), one-line whisper below.

## 4. Global Polish

- `TopNav`: increase blur, add subtle bottom hairline only on scroll, refine spacing.
- Buttons: introduce a `premium` variant in `button.tsx` (gradient + inner highlight + shadow-tactile + shimmer on hover) used in hero + closing CTA. Existing button usage elsewhere untouched.
- Add scroll-reveal hook `src/hooks/useReveal.ts` (tiny, no deps) used by new sections.
- Mobile: stack everything single-column at <768px, reduce hero type scale fluidly with `clamp()`, ensure the cake scales down to ~240px, ensure showcase grid becomes 1–2 cols.
- Reduced-motion: all new animations gated behind `@media (prefers-reduced-motion: no-preference)`.

## 5. Out of Scope

- No changes to auth, credits, Stripe, server functions, RLS, or routes other than `/`.
- No new dependencies. All animation is CSS + a tiny IntersectionObserver hook.
- No image generation — showcase artifacts are SVG/CSS mocks for speed and brand cohesion.

## Files Touched

- `src/styles.css` — tokens, gradients, grain, keyframes, premium button styles.
- `src/routes/__root.tsx` — add Instrument Serif font link, grain overlay.
- `src/routes/index.tsx` — full homepage rewrite per above.
- `src/components/LayerCake.tsx` — dimensional refinements, float, glow.
- `src/components/LayerStack.tsx` — new.
- `src/components/ShowcaseGrid.tsx` — new.
- `src/components/ui/button.tsx` — add `premium` variant.
- `src/hooks/useReveal.ts` — new.

## Technical Notes

- Animations: pure CSS keyframes + transitions; reveal via a 30-line IntersectionObserver hook that toggles a `data-revealed` attribute. No framer-motion added.
- Grain: inline SVG turbulence as a data URL on a fixed `pointer-events-none` div at `z-0` with `mix-blend-overlay` and ~6% opacity.
- Editorial serif loaded alongside existing Fredoka/Plus Jakarta from Google Fonts (one extra `<link>`, negligible weight).
- All colors use semantic tokens — no hard-coded hex in components.
