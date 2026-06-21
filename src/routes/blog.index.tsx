import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";

const TITLE = "Blog — Layercake";
const DESCRIPTION = "Guides and notes from the Layercake kitchen on building cohesive brand worlds with AI.";
const URL = "https://layercake.site/blog";

type Post = { slug: string; title: string; description: string; date: string };

const POSTS: Post[] = [
  {
    slug: "visual-systems-vs-logo-generators",
    title: "Visual Systems vs. AI Logo Generators: Why a Logo Isn't a Brand",
    description:
      "AI logo generators give you a mark in seconds — but a logo alone isn't a brand. See how Layercake's visual-system approach outperforms standalone logo makers.",
    date: "2026-06-21",
  },
];

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <main
      className="relative min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, #ffe7d6 0%, transparent 60%), radial-gradient(900px 500px at 100% 10%, #ffd6e7 0%, transparent 55%), linear-gradient(180deg, #fff7f0 0%, #fff1f5 100%)",
      }}
    >
      <TopNav />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-8">
        <header className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
            🎂 The Layercake Blog
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">
            Notes from the kitchen
          </h1>
          <p className="mt-3 text-foreground/70">
            Guides on building cohesive brand worlds — not just logos.
          </p>
        </header>

        <ul className="space-y-5">
          {POSTS.map((p) => (
            <li key={p.slug}>
              <Link
                to="/blog/visual-systems-vs-logo-generators"
                className="block rounded-3xl border border-white/60 bg-white/70 p-7 shadow-sm backdrop-blur transition hover:-translate-y-0.5"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                  {new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                  {p.title}
                </h2>
                <p className="mt-2 text-[15px] text-foreground/70">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
