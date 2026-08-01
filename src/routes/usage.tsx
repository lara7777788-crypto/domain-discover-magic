import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { LowSliceSettings } from "@/components/LowSliceAlert";

export const Route = createFileRoute("/usage")({
  head: () => ({
    meta: [
      { title: "Receipts & usage — Layercake" },
      {
        name: "description",
        content:
          "See every slice you've spent and every credit you've earned, month by month, and download a CSV receipt.",
      },
      { property: "og:title", content: "Receipts & usage — Layercake" },
      {
        property: "og:description",
        content: "Monthly slice usage summaries you can download as CSV.",
      },
      { property: "og:url", content: "https://layercake.site/usage" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://layercake.site/usage" }],
  }),
  component: UsagePage,
});

type Event = {
  id: string;
  kind: "spend" | "grant";
  amount: number;
  source: string;
  note: string | null;
  balance_after: number | null;
  created_at: string;
};

const SOURCE_LABEL: Record<string, string> = {
  image: "Image slice",
  homemade: "Home made cake",
  mix: "Mix",
  effects: "Effects",
  icing: "Icing copy",
  generation: "Generation",
  coupon: "Code redeemed",
  purchase: "Pack purchased",
  subscription: "Subscription",
  other: "Other",
};

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const csvCell = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function UsagePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from("credit_events")
        .select("id, kind, amount, source, note, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (err) {
        console.error("[usage] load failed", err);
        setError("Couldn't load your receipts. Please refresh.");
        setEvents([]);
        return;
      }
      setEvents(
        (data ?? []).map((r) => ({
          id: r.id as string,
          kind: r.kind as Event["kind"],
          amount: Number(r.amount),
          source: (r.source as string) ?? "other",
          note: (r.note as string | null) ?? null,
          balance_after: r.balance_after === null ? null : Number(r.balance_after),
          created_at: r.created_at as string,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const periods = useMemo(() => {
    const map = new Map<string, { spent: number; earned: number; rows: Event[] }>();
    for (const e of events ?? []) {
      const k = monthKey(e.created_at);
      const bucket = map.get(k) ?? { spent: 0, earned: 0, rows: [] };
      if (e.kind === "spend") bucket.spent += e.amount;
      else bucket.earned += e.amount;
      bucket.rows.push(e);
      map.set(k, bucket);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [events]);

  const downloadCsv = (key: string | null) => {
    const rows = key
      ? (periods.find(([k]) => k === key)?.[1].rows ?? [])
      : (events ?? []);
    const header = ["Date", "Type", "What", "Slices", "Balance after", "Note"];
    const body = rows.map((e) => [
      new Date(e.created_at).toISOString(),
      e.kind === "spend" ? "Spent" : "Earned",
      SOURCE_LABEL[e.source] ?? e.source,
      `${e.kind === "spend" ? "-" : "+"}${fmt(e.amount)}`,
      e.balance_after === null ? "" : fmt(e.balance_after),
      e.note ?? "",
    ]);
    const csv = [header, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layercake-usage-${key ?? "all"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main
      className="relative min-h-screen"
      style={{ background: "linear-gradient(180deg, #FFF6BE 0%, #FFE9F1 55%, #E2F1DC 100%)" }}
    >
      <TopNav />
      <section className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">
          The paper trail
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Receipts.
        </h1>
        <p className="mt-3 max-w-xl text-foreground/65">
          Every slice spent and every credit earned, grouped by billing month. Download any period as
          a CSV.
        </p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <LowSliceSettings />



        {events === null ? (
          <div className="mt-10 rounded-3xl border border-white bg-white/70 p-12 text-center backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/45">
              Loading…
            </p>
          </div>
        ) : periods.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white bg-white/70 p-12 text-center backdrop-blur">
            <p className="text-foreground/60">No activity yet — bake something and it lands here.</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => downloadCsv(null)}
              className="mt-8 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_30px_-18px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5"
            >
              ⬇ Download everything (CSV)
            </button>

            <div className="mt-8 space-y-5">
              {periods.map(([key, p]) => (
                <div
                  key={key}
                  className="overflow-hidden rounded-3xl border border-white bg-white/80 backdrop-blur"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/5 p-5">
                    <div>
                      <div className="font-display text-lg font-semibold text-foreground">
                        {monthLabel(key)}
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">
                        <strong className="text-foreground">{fmt(p.spent)}</strong> slices consumed ·{" "}
                        <strong className="text-foreground">{fmt(p.earned)}</strong> credits earned ·{" "}
                        {p.rows.length} entries
                      </div>
                    </div>
                    <button
                      onClick={() => downloadCsv(key)}
                      className="rounded-full bg-foreground/5 px-5 py-2.5 text-xs font-semibold text-foreground/80 transition hover:bg-foreground/10"
                    >
                      Download CSV
                    </button>
                  </div>
                  <ul className="divide-y divide-foreground/5">
                    {p.rows.slice(0, 40).map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground/85">
                            {SOURCE_LABEL[e.source] ?? e.source}
                          </div>
                          <div className="text-[11px] text-foreground/45">
                            {new Date(e.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 text-sm font-semibold ${
                            e.kind === "spend" ? "text-foreground/70" : "text-emerald-700"
                          }`}
                        >
                          {e.kind === "spend" ? "−" : "+"}
                          {fmt(e.amount)} 🍰
                        </div>
                      </li>
                    ))}
                    {p.rows.length > 40 && (
                      <li className="px-5 py-3 text-[11px] text-foreground/45">
                        + {p.rows.length - 40} more in the CSV
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
