import { useEffect } from "react";

const ENDPOINT = "/api/public/monitor/report";
const DEDUPE_WINDOW_MS = 30_000;
const MAX_PER_SESSION = 20;

const recentlySent = new Map<string, number>();
let sentCount = 0;

export type ErrorKind =
  | "render_error"
  | "window_error"
  | "unhandled_rejection"
  | "not_found"
  | "asset_error";

/** Sends a single error report to the monitoring endpoint (fire-and-forget, deduped). */
export function reportError(input: {
  kind: ErrorKind;
  message: string;
  stack?: string;
  route?: string;
  meta?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;
  if (sentCount >= MAX_PER_SESSION) return;

  const key = `${input.kind}::${input.message}`.slice(0, 300);
  const now = Date.now();
  const last = recentlySent.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) return;
  recentlySent.set(key, now);
  sentCount += 1;

  const body = JSON.stringify({
    kind: input.kind,
    message: String(input.message).slice(0, 2000),
    stack: input.stack ? String(input.stack).slice(0, 8000) : undefined,
    route: input.route ?? window.location.pathname + window.location.search,
    userAgent: navigator.userAgent,
    release: import.meta.env["VITE_APP_RELEASE"] ?? undefined,
    meta: input.meta,
  });

  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* monitoring must never break the app */
  }
}

/** Global listeners for uncaught errors, promise rejections and failed asset loads. */
export function ErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target !== (window as unknown as HTMLElement) && "tagName" in target) {
        const tag = target.tagName?.toLowerCase();
        if (tag === "script" || tag === "link" || tag === "img") {
          reportError({
            kind: "asset_error",
            message: `Failed to load ${tag}: ${
              (target as HTMLImageElement).src ?? (target as HTMLLinkElement).href ?? "unknown"
            }`,
          });
          return;
        }
      }
      reportError({
        kind: "window_error",
        message: event.message || "Unknown window error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportError({
        kind: "unhandled_rejection",
        message:
          reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection"),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
