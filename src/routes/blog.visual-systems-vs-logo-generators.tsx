import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";

const TITLE = "Visual Systems vs. AI Logo Generators: Why a Logo Isn't a Brand";
const DESCRIPTION =
  "AI logo generators give you a mark in seconds — but a logo alone isn't a brand. See how Layercake's visual-system approach (palette, type, motion, and copy) outperforms standalone AI logo makers.";
const URL = "https://layercake.site/blog/visual-systems-vs-logo-generators";
const PUBLISHED = "2026-06-21";

export const Route = createFileRoute("/blog/visual-systems-vs-logo-generators")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "ai logo generator, brand identity generator, visual identity system, brand kit, ai branding" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { property: "article:published_time", content: PUBLISHED },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          url: URL,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          author: { "@type": "Organization", name: "Layercake" },
          publisher: {
            "@type": "Organization",
            name: "Layercake",
            url: "https://layercake.site",
          },
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
  component: Post,
});

function Post() {
  return (
    <main
      className="relative min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, #ffe7d6 0%, transparent 60%), radial-gradient(900px 500px at 100% 10%, #ffd6e7 0%, transparent 55%), linear-gradient(180deg, #fff7f0 0%, #fff1f5 100%)",
      }}
    >
      <TopNav />

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-8">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
            🎂 From the Layercake kitchen
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            {TITLE}
          </h1>
          <p className="mt-4 text-lg text-foreground/70">
            Most "AI logo generator" tools hand you a single mark and call it a brand. They
            don't. A real brand is a <em>cohesive world</em> — palette, typography, motion,
            and copy that all sound like the same person. Here's why that gap matters, and
            how Layercake closes it.
          </p>
        </header>

        <section className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            The AI logo generator problem
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/75">
            <p>
              Type a name into a typical AI logo generator and you'll get a grid of icons —
              monograms, abstract marks, a wordmark or two. Click one, download a PNG, and
              you're done. Except you're not. A logo isn't a brand any more than a single
              ingredient is a meal.
            </p>
            <p>
              The day after you ship that logo you'll need: a color palette that doesn't
              fight it, a heading font that carries the same energy, a body font that's
              actually readable, button styles, gradient choices, an Instagram avatar, a
              banner for LinkedIn, and copy that sounds like one person wrote it. A
              standalone mark can't tell you any of that.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            What a visual system actually contains
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/75">
            <p>A real brand identity system has at minimum:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Palette</strong> — primary, secondary, neutrals, surfaces, and a clear contrast story.</li>
              <li><strong>Typography</strong> — a display pair plus body font with defined weights and scale.</li>
              <li><strong>Logo set</strong> — wordmark, monogram, and stacked variations that work at every size.</li>
              <li><strong>Motion</strong> — easing, duration, and hover behavior that reinforce the vibe.</li>
              <li><strong>Voice</strong> — taglines, microcopy, and tone rules so the writing matches the visuals.</li>
              <li><strong>Applications</strong> — social avatars, banners, OG images, product screenshots.</li>
            </ul>
            <p>
              Standalone AI logo generators give you item three. Layercake gives you all six,
              because each "slice" you bake is part of the same underlying world.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Side-by-side: logo generator vs. Layercake
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-foreground/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">What you get</th>
                  <th className="px-4 py-3 font-semibold text-foreground">AI logo generator</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Layercake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10 bg-white/60 text-foreground/75">
                <tr><td className="px-4 py-3">A logo mark</td><td className="px-4 py-3">✓</td><td className="px-4 py-3">✓</td></tr>
                <tr><td className="px-4 py-3">Color palette</td><td className="px-4 py-3">Sometimes</td><td className="px-4 py-3">✓ tuned to the mark</td></tr>
                <tr><td className="px-4 py-3">Type pairing</td><td className="px-4 py-3">Rare</td><td className="px-4 py-3">✓ display + body</td></tr>
                <tr><td className="px-4 py-3">Social banners + avatars</td><td className="px-4 py-3">Manual</td><td className="px-4 py-3">✓ baked as slices</td></tr>
                <tr><td className="px-4 py-3">Motion / animation guidance</td><td className="px-4 py-3">No</td><td className="px-4 py-3">✓</td></tr>
                <tr><td className="px-4 py-3">Tagline + voice</td><td className="px-4 py-3">No</td><td className="px-4 py-3">✓ generated copy</td></tr>
                <tr><td className="px-4 py-3">Everything sounds like one brand</td><td className="px-4 py-3">No</td><td className="px-4 py-3">✓ shared "world"</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Why "cohesive world" beats "more mark options"
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/75">
            <p>
              The reason generic AI logo tools feel disposable is that every output is
              isolated. Generate two more variations and you'll get two unrelated palettes,
              two unrelated typefaces, and a brand that drifts every time you ship a new
              asset.
            </p>
            <p>
              Layercake works the opposite way. You describe the vibe once. Every slice you
              bake after that — landing hero, product screenshot, LinkedIn banner, app icon,
              pricing page header — pulls from the same palette, the same type, the same
              voice. Three months in your brand still looks like itself.
            </p>
            <p>
              That's the real promise of a <strong>brand identity generator</strong>, and
              it's the part most AI logo generators skip.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            When a plain logo generator is still fine
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/75">
            <p>
              If you need a single mark for a one-off side project — a Discord avatar, a
              throwaway hackathon submission, a placeholder before a real rebrand — a
              standalone AI logo generator will do the job. You don't need a system.
            </p>
            <p>
              The moment the project becomes anything you care about — a startup, a product,
              a personal brand, a podcast you'll be running for a year — a single logo isn't
              enough. You'll spend the next six months patching mismatched assets together.
              That's the gap Layercake is built for.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-sm backdrop-blur md:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            Bake a real brand, not just a logo
          </h2>
          <p className="mt-3 text-foreground/70">
            Describe your vibe once. Get a cohesive world of slices — logo, palette,
            typography, banners, copy — that all sound like the same brand.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/bake"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white"
            >
              Bake a slice
            </Link>
            <Link
              to="/pricing"
              className="rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              See pricing
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
