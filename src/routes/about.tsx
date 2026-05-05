import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Layercake" },
      {
        name: "description",
        content:
          "About Layercake, our founder Vela Protocol, our acceptable use policy, refund policy, and how to reach support.",
      },
      { property: "og:title", content: "About — Layercake" },
      {
        property: "og:description",
        content:
          "Meet Vela Protocol, read our disclaimer, user protocols, refund policy, and contact info.",
      },
    ],
  }),
  component: AboutPage,
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:p-10">
      <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}

function AboutPage() {
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
            🎂 The Recipe Card
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">
            A small bakery for big ideas.
          </h1>
          <p className="mt-4 text-base text-foreground/70">
            The sugar, the vinegar, and everything that goes into Layercake —
            who made it, how to use it, and how to find us.
          </p>
        </header>

        <div className="space-y-6">
          <Section title="Our founder">
            <p>
              Layercake is made by{" "}
              <span className="font-semibold text-foreground">
                Vela Protocol
              </span>
              , a small independent studio focused on tools that make creative
              work feel light, kind, and possible. We build software the way a
              good bakery makes pastries — slowly, with care, and with the
              person on the other side of the counter in mind.
            </p>
          </Section>

          <Section title="Disclaimer">
            <p>
              Layercake is a generative tool. The images, text, and layouts
              produced are created by AI based on the inputs you provide.{" "}
              <span className="font-semibold text-foreground">
                You are solely responsible for what you generate, download,
                share, publish, sell, or otherwise use.
              </span>
            </p>
            <p>
              Layercake, Vela Protocol, its affiliates, employees, and
              contractors are not liable for any direct, indirect, incidental,
              consequential, or punitive damages arising from the use or
              misuse of generated outputs, including but not limited to
              copyright disputes, trademark conflicts, defamation, harm to
              reputation, business loss, or any third-party claims. Outputs
              are provided "as is" without warranty of any kind. By using
              Layercake you agree that you have the rights to the inputs you
              submit and accept full responsibility for the outputs.
            </p>
          </Section>

          <Section title="User protocols & acceptable use">
            <p>
              Layercake is a creative tool — not a place for harm. The
              following content is strictly prohibited, whether attempted,
              generated, or shared:
            </p>
            <ul className="ml-1 space-y-2 list-none text-foreground/75">
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>Sexual content, pornography, or nudity of any kind</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>Sexualized depictions of minors (zero tolerance)</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>Racism, hate speech, or slurs targeting any group</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>Incitement to violence, terrorism, or self-harm</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>Instructions for weapons, illegal drugs, or crime</span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>Gore, cruelty, or graphic real-world harm</span></li>
            </ul>
            <p>
              <span className="font-semibold text-foreground">
                Enforcement ladder.
              </span>{" "}
              We don't surveil people. We don't read your prompts for fun. But
              when our safety system catches an infraction or attempt, access
              is paused on a graduated scale:
            </p>
            <ul className="ml-1 space-y-2 list-none text-foreground/75">
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">First infraction:</span>{" "}
                1‑day suspension
              </span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">Second:</span>{" "}
                7‑day suspension
              </span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">Third:</span>{" "}
                30‑day suspension
              </span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">Fourth:</span>{" "}
                permanent removal of access
              </span></li>
            </ul>
            <p>
              Severe violations (e.g. content involving minors) result in
              immediate permanent removal without warning.
            </p>
          </Section>

          <Section title="Privacy — what we don't do">
            <p>
              We{" "}
              <span className="font-semibold text-foreground">
                do not collect personal data
              </span>{" "}
              beyond what's needed to run your account and your generations.
              We{" "}
              <span className="font-semibold text-foreground">
                do not police, profile, or report users
              </span>{" "}
              to third parties. When abuse is detected, we simply block
              continued use of the service. That's it. Your creative work and
              your prompts are yours.
            </p>
          </Section>

          <Section title="Refund policy">
            <p>
              Layercake is a SaaS subscription. You may cancel at any time
              from your billing portal and you will not be charged again at
              the next renewal.
            </p>
            <ul className="ml-1 space-y-2 list-none text-foreground/75">
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">
                  Monthly plans:
                </span>{" "}
                full refund within 7 days of the original purchase if fewer
                than 10 slices were generated.
              </span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">
                  Yearly plans:
                </span>{" "}
                full refund within 14 days of the original purchase if fewer
                than 30 slices were generated. Pro‑rated refunds considered
                case by case after that.
              </span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                <span className="font-medium text-foreground">
                  Slice packs (one‑time):
                </span>{" "}
                refundable within 7 days if unused. Once any slice in a pack
                is generated, the pack is non‑refundable.
              </span></li>
              <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 text-sm leading-none">🧁</span><span>
                Accounts suspended for violations of the acceptable use
                policy are not eligible for refunds.
              </span></li>
            </ul>
            <p>
              To request a refund, email us with your account email and the
              order in question. We try to respond within one business day.
            </p>
          </Section>

          <Section title="Support — we'd love to hear from you">
            <p>
              Reviews make our day. If you love Layercake, tell a friend or
              leave us a review — that's how a small studio grows.
            </p>
            <p>
              If something isn't working, or a generation didn't turn out the
              way you hoped, please let us know. We read every message and
              we're happy to help, refund, or just chat about what you're
              trying to make.
            </p>
            <p className="rounded-2xl bg-foreground/5 p-4 text-foreground">
              📮{" "}
              <a
                href="mailto:lara@loveconcursall.com"
                className="font-semibold underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
              >
                lara@loveconcursall.com
              </a>
              <br />
              <span className="text-sm text-foreground/60">
                Questions, feedback, refunds, partnerships — anything at all.
              </span>
            </p>
          </Section>

          <div className="pt-4 text-center text-sm text-foreground/60">
            <Link
              to="/"
              className="underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground/60"
            >
              ← Back to Layercake
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
