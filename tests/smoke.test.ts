/**
 * Navigation smoke tests for Layercake.
 *
 *   bun tests/smoke.test.ts                  # against http://localhost:8080
 *   SMOKE_BASE_URL=https://layercake.site bun tests/smoke.test.ts
 *
 * Verifies that the core routes render (no error boundary, no 4xx/5xx) and
 * that every internal link found on those pages resolves — catching broken
 * navigation (especially pricing / checkout links) before release.
 */
const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

const ROUTES = ["/", "/slices", "/bake", "/login", "/pricing", "/usage", "/mix", "/effects", "/homemade"];

const ERROR_MARKERS = [
  "Something went wrong",
  "Unexpected Application Error",
  "Internal Server Error",
  "Cannot find module",
  "does not exist in the route tree",
];

let pass = 0;
let fail = 0;

function ok(name: string) {
  pass++;
  console.log(`  ✓ ${name}`);
}
function bad(name: string, detail: string) {
  fail++;
  console.log(`  ✗ ${name} — ${detail}`);
}

async function load(path: string): Promise<{ status: number; html: string; url: string }> {
  const res = await fetch(`${BASE}${path}`, { redirect: "follow", headers: { accept: "text/html" } });
  const html = await res.text();
  return { status: res.status, html, url: res.url };
}

function internalLinks(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const href = m[1]!;
    if (/\.(png|jpe?g|webp|svg|ico|xml|txt|json|css|js|woff2?)$/i.test(href)) continue;
    if (href.startsWith("/api/") || href.startsWith("/_") || href.startsWith("/@")) continue;
    out.add(href === "" ? "/" : href);
  }
  return [...out];
}

async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  const discovered = new Set<string>();

  console.log("Core routes:");
  for (const path of ROUTES) {
    try {
      const { status, html, url } = await load(path);
      if (status >= 400) {
        bad(path, `HTTP ${status}`);
        continue;
      }
      const marker = ERROR_MARKERS.find((m) => html.includes(m));
      if (marker) {
        bad(path, `error boundary: "${marker}"`);
        continue;
      }
      if (html.length < 200) {
        bad(path, "empty document");
        continue;
      }
      ok(`${path} → ${new URL(url).pathname} (${status})`);
      internalLinks(html).forEach((l) => discovered.add(l));
    } catch (e) {
      bad(path, (e as Error).message);
    }
  }

  console.log("\nLinked destinations:");
  for (const path of [...discovered].sort()) {
    if (ROUTES.includes(path)) continue;
    try {
      const { status, html } = await load(path);
      if (status >= 400) bad(`link ${path}`, `HTTP ${status}`);
      else {
        const marker = ERROR_MARKERS.find((m) => html.includes(m));
        if (marker) bad(`link ${path}`, `error boundary: "${marker}"`);
        else ok(`link ${path} (${status})`);
      }
    } catch (e) {
      bad(`link ${path}`, (e as Error).message);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

await main();
