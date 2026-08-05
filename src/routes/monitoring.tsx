import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type ErrorRow = {
  id: string;
  occurred_at: string;
  kind: string;
  route: string | null;
  message: string;
  user_agent: string | null;
};

type AlertState = {
  enabled: boolean;
  notify_email: string;
  window_minutes: number;
  error_threshold: number;
  cooldown_minutes: number;
  last_alert_at: string | null;
};

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring — Layercake error alerts" },
      {
        name: "description",
        content:
          "Admin view of Layercake production errors: failed page loads, crash reports, and the alert thresholds that trigger email notifications.",
      },
      { property: "og:title", content: "Monitoring — Layercake error alerts" },
      {
        property: "og:description",
        content: "Admin view of Layercake production errors and alert thresholds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<ErrorRow[] | null>(null);
  const [state, setState] = useState<AlertState | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    void (async () => {
      const [events, alertState] = await Promise.all([
        supabase
          .from("error_events")
          .select("id, occurred_at, kind, route, message, user_agent")
          .order("occurred_at", { ascending: false })
          .limit(100),
        supabase.from("monitor_alert_state").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (cancelled) return;
      if (events.error || !alertState.data) setDenied(true);
      setRows((events.data as ErrorRow[] | null) ?? []);
      setState((alertState.data as AlertState | null) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  const lastHour = (rows ?? []).filter(
    (r) => Date.now() - new Date(r.occurred_at).getTime() < 60 * 60 * 1000,
  ).length;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="font-display text-3xl text-foreground">Production monitoring</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Failed page loads and client crashes reported from layercake.site. Alerts email you when
          errors spike.
        </p>

        {!loading && !user && (
          <p className="mt-6 text-sm text-muted-foreground">
            <Link to="/login" className="underline">
              Sign in
            </Link>{" "}
            as an admin to view reports.
          </p>
        )}

        {denied && user && (
          <p className="mt-6 text-sm text-muted-foreground">
            This page is only visible to admins.
          </p>
        )}

        {state && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Errors (last hour)" value={String(lastHour)} />
            <Stat
              label="Alert rule"
              value={`${state.error_threshold} in ${state.window_minutes} min`}
            />
            <Stat
              label="Last alert sent"
              value={
                state.last_alert_at ? new Date(state.last_alert_at).toLocaleString() : "Never"
              }
            />
          </div>
        )}

        {state && (
          <p className="mt-3 text-xs text-muted-foreground">
            Notifications go to {state.notify_email} · cooldown {state.cooldown_minutes} min ·
            alerts {state.enabled ? "enabled" : "disabled"}
          </p>
        )}

        <div className="mt-8 space-y-2">
          {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
          {rows?.length === 0 && (
            <p className="text-sm text-muted-foreground">No errors recorded. 🎉</p>
          )}
          {rows?.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-0.5 font-mono">{r.kind}</span>
                <span>{new Date(r.occurred_at).toLocaleString()}</span>
                <span className="font-mono">{r.route ?? "—"}</span>
              </div>
              <p className="mt-1 break-words text-sm text-foreground">{r.message}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
