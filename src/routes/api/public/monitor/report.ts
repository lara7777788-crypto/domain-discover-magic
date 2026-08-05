import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  kind: z.enum(["render_error", "window_error", "unhandled_rejection", "not_found", "asset_error"]),
  message: z.string().min(1).max(2000),
  route: z.string().max(500).optional(),
  stack: z.string().max(8000).optional(),
  release: z.string().max(200).optional(),
  userAgent: z.string().max(1000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/api/public/monitor/report")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let parsed: z.infer<typeof payloadSchema>;
        try {
          parsed = payloadSchema.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ error: "invalid_payload" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { error: insertError } = await supabaseAdmin.from("error_events").insert({
          kind: parsed.kind,
          message: parsed.message.slice(0, 2000),
          route: parsed.route ?? null,
          stack: parsed.stack ?? null,
          release: parsed.release ?? null,
          user_agent: parsed.userAgent ?? request.headers.get("user-agent"),
          meta: parsed.meta ?? null,
        } as never);

        if (insertError) {
          console.error("monitor: failed to record error event", insertError);
          return new Response(JSON.stringify({ error: "record_failed" }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        // Evaluate alert thresholds (best-effort — never fail the report).
        let alerted = false;
        let realtimeAlerted = false;
        try {
          if (isMixRealtimeCrash(parsed)) {
            realtimeAlerted = await alertMixRealtime(supabaseAdmin, parsed);
          }
          alerted = await maybeAlert(supabaseAdmin);
        } catch (err) {
          console.error("monitor: alert evaluation failed", err);
        }

        return new Response(JSON.stringify({ ok: true, alerted, realtimeAlerted }), {
          status: 200,
          headers: corsHeaders,
        });
      },
    },
  },
});

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

type Payload = z.infer<typeof payloadSchema>;

/**
 * A crash on the live-updating Mix path: either the report is tagged as a
 * realtime/credit-listener failure, or it happened on /mix and mentions the
 * realtime channel machinery.
 */
function isMixRealtimeCrash(p: Payload) {
  const route = (p.route ?? "").toLowerCase();
  const message = `${p.message} ${p.stack ?? ""}`.toLowerCase();
  const surface = String(p.meta?.["surface"] ?? "").toLowerCase();

  if (surface === "mix_realtime" || surface === "credits_realtime") return true;

  const looksRealtime =
    message.includes("postgres_changes") ||
    message.includes("realtime") ||
    message.includes("subscribe") ||
    message.includes("removechannel") ||
    message.includes("tried to subscribe multiple times");

  return looksRealtime && (route.startsWith("/mix") || surface.includes("mix"));
}

/** Immediate, separately throttled page for Mix realtime crashes. */
async function alertMixRealtime(supabase: AdminClient, p: Payload) {
  const { data: state } = await supabase
    .from("monitor_alert_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!state || state.enabled === false) return false;
  if ((state as { realtime_alerts_enabled?: boolean }).realtime_alerts_enabled === false) {
    return false;
  }

  const notifyEmail = String(state.notify_email ?? "");
  if (!notifyEmail) return false;

  const cooldownMinutes = Number(
    (state as { realtime_cooldown_minutes?: number }).realtime_cooldown_minutes ?? 15,
  );
  const lastAt = (state as { last_realtime_alert_at?: string | null }).last_realtime_alert_at;
  if (lastAt && Date.now() - new Date(lastAt).getTime() < cooldownMinutes * 60 * 1000) {
    return false;
  }

  const subject = "🚨 Layercake: Mix realtime listener crashed";
  const detail = `<table style="border-collapse:collapse;font-size:13px">
    <tr><td style="padding:4px 8px"><strong>Route</strong></td><td style="padding:4px 8px">${escapeHtml(
      p.route ?? "—",
    )}</td></tr>
    <tr><td style="padding:4px 8px"><strong>Type</strong></td><td style="padding:4px 8px">${escapeHtml(
      p.kind,
    )}</td></tr>
    <tr><td style="padding:4px 8px"><strong>Message</strong></td><td style="padding:4px 8px">${escapeHtml(
      p.message.slice(0, 400),
    )}</td></tr>
    <tr><td style="padding:4px 8px"><strong>Device</strong></td><td style="padding:4px 8px">${escapeHtml(
      (p.userAgent ?? "—").slice(0, 200),
    )}</td></tr>
  </table>`;

  const html = `<div style="font-family:system-ui,sans-serif;color:#1a1a1a">
  <h2 style="margin:0 0 8px">Mix / credits live-update crash</h2>
  <p style="margin:0 0 16px">A client crashed on the live credit &amp; mix realtime path. The error boundary caught it, so the page did not go blank — but the listener failed.</p>
  ${detail}
  <p style="margin:16px 0 0"><a href="https://layercake.site/monitoring">Open the monitoring page</a></p>
</div>`;

  const text = `Mix / credits realtime crash\nRoute: ${p.route ?? "—"}\nType: ${p.kind}\nMessage: ${p.message.slice(
    0,
    400,
  )}\n\nhttps://layercake.site/monitoring`;

  const messageId = crypto.randomUUID();
  const { error: queueError } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      idempotency_key: messageId,
      to: notifyEmail,
      from: "Layercake Monitoring <alerts@notify.layercake.site>",
      sender_domain: "notify.layercake.site",
      subject,
      html,
      text,
      purpose: "transactional",
      label: "mix_realtime_alert",
      queued_at: new Date().toISOString(),
    } as never,
  });

  if (queueError) {
    console.error("monitor: failed to enqueue mix realtime alert", queueError);
    return false;
  }

  await supabase
    .from("monitor_alert_state")
    .update({
      last_realtime_alert_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", 1);

  return true;
}


async function maybeAlert(supabase: AdminClient) {
  const { data: state } = await supabase
    .from("monitor_alert_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!state || state.enabled === false) return false;

  const windowMinutes = Number(state.window_minutes ?? 10);
  const threshold = Number(state.error_threshold ?? 5);
  const cooldownMinutes = Number(state.cooldown_minutes ?? 60);
  const notifyEmail = String(state.notify_email ?? "");
  if (!notifyEmail) return false;

  if (state.last_alert_at) {
    const since = Date.now() - new Date(state.last_alert_at as string).getTime();
    if (since < cooldownMinutes * 60 * 1000) return false;
  }

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("error_events")
    .select("kind, route, message, occurred_at")
    .gte("occurred_at", windowStart)
    .order("occurred_at", { ascending: false })
    .limit(200);

  const events = recent ?? [];
  if (events.length < threshold) return false;

  const rows = events
    .slice(0, 15)
    .map(
      (e) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(
          String(e.kind ?? ""),
        )}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(
          String(e.route ?? "—"),
        )}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${escapeHtml(
          String(e.message ?? "").slice(0, 160),
        )}</td></tr>`,
    )
    .join("");

  const subject = `🚨 Layercake: ${events.length} errors in ${windowMinutes} min`;
  const html = `<div style="font-family:system-ui,sans-serif;color:#1a1a1a">
  <h2 style="margin:0 0 8px">Layercake error spike</h2>
  <p style="margin:0 0 16px">${events.length} client errors were recorded in the last ${windowMinutes} minutes (threshold: ${threshold}).</p>
  <table style="border-collapse:collapse;font-size:13px"><thead><tr>
    <th align="left" style="padding:4px 8px">Type</th>
    <th align="left" style="padding:4px 8px">Route</th>
    <th align="left" style="padding:4px 8px">Message</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <p style="margin:16px 0 0"><a href="https://layercake.site/monitoring">Open the monitoring page</a></p>
</div>`;

  const text = `Layercake error spike: ${events.length} client errors in the last ${windowMinutes} minutes (threshold ${threshold}).\n\n${events
    .slice(0, 15)
    .map((e) => `- [${e.kind}] ${e.route ?? "—"} :: ${String(e.message ?? "").slice(0, 160)}`)
    .join("\n")}\n\nhttps://layercake.site/monitoring`;

  const messageId = crypto.randomUUID();
  const { error: queueError } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      idempotency_key: messageId,
      to: notifyEmail,
      from: "Layercake Monitoring <alerts@notify.layercake.site>",
      sender_domain: "notify.layercake.site",
      subject,
      html,
      text,
      purpose: "transactional",
      label: "error_rate_alert",
      queued_at: new Date().toISOString(),
    } as never,
  });

  if (queueError) {
    console.error("monitor: failed to enqueue alert email", queueError);
    return false;
  }

  await supabase
    .from("monitor_alert_state")
    .update({ last_alert_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
    .eq("id", 1);

  return true;
}
