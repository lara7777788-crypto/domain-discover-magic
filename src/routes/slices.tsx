import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";
import { makeThumb } from "@/lib/thumb";

type Tab = "slices" | "copy";

export const Route = createFileRoute("/slices")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => ({
    tab: (s.tab === "copy" ? "copy" : "slices") as Tab,
  }),
  head: () => ({
    meta: [
      { title: "My Slices — Layercake" },
      { name: "description", content: "Your saved cake slices and icing copy, ready to edit, download, or remix." },
      { property: "og:title", content: "My Slices — Layercake" },
      { property: "og:description", content: "Open, edit, and download the slices you've baked." },
      { property: "og:url", content: "https://layercake.site/slices" },
    ],
    links: [
      { rel: "canonical", href: "https://layercake.site/slices" },
    ],
  }),
  component: SlicesPage,
});

type Slice = {
  id: string;
  name: string;
  thumb_url: string | null;
  preview_url: string | null;
  is_unlocked: boolean;
  updated_at: string;
  mode: string | null;
  copy: string | null;
  prompt: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));




function SlicesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const [slices, setSlices] = useState<Slice[] | null>(null);
  const [failedPreviews, setFailedPreviews] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);

  const isCopyTab = tab === "copy";

  const visible = useMemo(
    () => (slices ?? []).filter((s) => (isCopyTab ? s.mode === "copy" : s.mode !== "copy")),
    [slices, isCopyTab],
  );

  const openSave = async (s: Slice) => {
    if (!user) return;
    let url = s.preview_url;
    if (!url) {
      const { data } = await supabase
        .from("designs")
        .select("preview_url")
        .eq("id", s.id)
        .eq("user_id", user.id)
        .maybeSingle();
      url = (data?.preview_url as string | null) ?? null;
    }
    if (!url) {
      setError("This slice is still loading its full-size image — give it a moment.");
      return;
    }
    setSavePayload({
      url,
      filename: `${(s.name || "layercake-slice").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.png`,
      sliceId: s.id,
      locked: false,
    });
  };

  const closeSave = () => setSavePayload(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    setSlices(null);
    setFailedPreviews({});
    setDiscovering(true);

    (async () => {
      // 1) Lightweight metadata + small thumbnails. Never select `preview_url`
      // or `data` here: those hold multi-megabyte base64 blobs and made the
      // gallery request time out before a single tile could render.
      let rows: Slice[] | null = null;
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        const { data, error } = await supabase
          .from("designs")
          .select("id, name, is_unlocked, updated_at, mode, copy_text, thumb_url, prompt_text")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(36);
        if (cancelled) return;
        if (!error) {
          rows = (data ?? []).map((row) => ({
            id: row.id as string,
            name: row.name as string,
            is_unlocked: row.is_unlocked as boolean,
            updated_at: row.updated_at as string,
            mode: ((row as { mode?: string | null }).mode ?? "image") as string,
            copy: ((row as { copy_text?: string | null }).copy_text ?? null) as string | null,
            prompt: ((row as { prompt_text?: string | null }).prompt_text ?? null) as string | null,
            thumb_url: ((row as { thumb_url?: string | null }).thumb_url ?? null) as string | null,
            preview_url: null,
          }));
          break;
        }
        console.error("[slices] metadata attempt failed", attempt, error);
        await sleep(600 * (attempt + 1));
      }
      if (cancelled) return;
      if (!rows) {
        setError("Failed to load your slices. Please refresh and try again.");
        setSlices([]);
        setDiscovering(false);
        return;
      }

      setSlices(rows);
      setDiscovering(false);

      // 2) Backfill: older rows have no thumbnail yet. Pull their full preview
      // one at a time, show it, then persist a small thumbnail so the next
      // visit is instant.
      const pending = rows.filter((r) => r.mode !== "copy" && !r.thumb_url);
      for (const row of pending) {
        if (cancelled) return;
        let url: string | null = null;
        for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
          const { data, error } = await supabase
            .from("designs")
            .select("preview_url")
            .eq("id", row.id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (cancelled) return;
          if (!error) {
            url = (data?.preview_url as string | null) ?? null;
            break;
          }
          console.error("[slices] preview attempt failed", row.id, attempt, error);
          await sleep(500 * (attempt + 1));
        }
        if (cancelled) return;
        if (!url) {
          setFailedPreviews((f) => ({ ...f, [row.id]: true }));
          continue;
        }
        setSlices((current) =>
          current?.map((s) => (s.id === row.id ? { ...s, preview_url: url, thumb_url: url } : s)) ?? current,
        );
        const thumb = await makeThumb(url);
        if (cancelled) return;
        if (thumb) {
          await supabase
            .from("designs")
            .update({ thumb_url: thumb } as never)
            .eq("id", row.id)
            .eq("user_id", user.id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);


  const remove = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this item?")) return;
    const { error: delErr, count } = await supabase
      .from("designs")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (delErr) {
      console.error("delete slice failed", delErr);
      alert("Couldn't delete that item. Please try again.");
      return;
    }
    if (!count) {
      alert("That item couldn't be deleted (it may already be gone).");
      setReloadKey((k) => k + 1);
      return;
    }
    setSlices((s) => s?.filter((x) => x.id !== id) ?? null);
  };

  const remix = (id: string) => {
    if (!user) return;
    navigate({ to: "/bake", search: { remix: id, mode: isCopyTab ? "copy" : "image" } });
  };

  const copyPrompt = async (s: Slice) => {
    if (!s.prompt) return;
    try {
      await navigator.clipboard.writeText(s.prompt);
      setCopiedPromptId(s.id);
      setTimeout(() => setCopiedPromptId((c) => (c === s.id ? null : c)), 1600);
    } catch {
      setError("Couldn't copy that prompt — select the text and copy manually.");
    }
  };

  const copyText = async (s: Slice) => {
    if (!s.copy) return;
    try {
      await navigator.clipboard.writeText(s.copy);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 1600);
    } catch {
      setError("Couldn't copy — open it in Bake and copy from there.");
    }
  };

  const tabClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
      active ? "bg-foreground text-white shadow-[0_10px_25px_-12px_rgba(0,0,0,0.5)]" : "bg-white/70 text-foreground/70"
    }`;

  return (
    <main
      className="relative min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 30%, #FFF5C2 60%, #DFF5DD 100%)",
      }}
    >
      <TopNav />
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">Your gallery</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
            {isCopyTab ? "My icing." : "My slices."}
          </h1>
        </div>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link to="/slices" search={{ tab: "slices" as Tab }} className={tabClass(!isCopyTab)}>
            My slices
          </Link>
          <Link to="/slices" search={{ tab: "copy" as Tab }} className={tabClass(isCopyTab)}>
            My icing
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            to="/bake"
            search={{ mode: "image" as "copy" | "image" }}
            className="shrink-0 whitespace-nowrap rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
          >
            + New slice
          </Link>
          <Link
            to="/bake"
            search={{ mode: "copy" as "copy" | "image" }}
            className="shrink-0 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-[0_10px_25px_-14px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
          >
            + New icing
          </Link>
        </div>


        {error && (
          <div className="mt-8 flex items-center justify-between gap-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {slices === null ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-72 animate-pulse items-center justify-center rounded-3xl border border-white bg-white/50"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/45">
                  Loading…
                </span>
              </div>
            ))}
          </div>
        ) : visible.length === 0 && discovering ? (
          <div className="mt-12 rounded-3xl border border-white bg-white/70 p-12 text-center backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground/45">Loading…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white bg-white/70 p-12 text-center backdrop-blur">
            <p className="text-foreground/60">{isCopyTab ? "No icing yet." : "No slices yet."}</p>
            <Link
              to="/bake"
              search={{ mode: (isCopyTab ? "copy" : "image") as "copy" | "image" }}
              className="mt-5 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white"
            >
              {isCopyTab ? "Whip your first icing" : "Bake your first slice"}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <div
                key={s.id}
                className="group overflow-hidden rounded-3xl border border-white bg-white/80 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.25)] backdrop-blur transition hover:-translate-y-0.5"
              >
                <Link
                  to="/bake"
                  search={{ slice: s.id, mode: (isCopyTab ? "copy" : "image") as "copy" | "image" }}
                  className="block"
                >
                  {isCopyTab ? (
                    <div className="min-h-[9rem] whitespace-pre-wrap p-5 text-sm leading-relaxed text-foreground/80">
                      {s.copy ? (s.copy.length > 320 ? `${s.copy.slice(0, 320)}…` : s.copy) : "No copy saved yet."}
                    </div>
                  ) : (
                    <div className="aspect-square w-full overflow-hidden bg-foreground/5">
                      {s.thumb_url ? (
                        <img
                          src={s.thumb_url}
                          alt={s.name}
                          loading="lazy"
                          decoding="async"
                           onError={() => {
                             setSlices((current) =>
                               current?.map((item) =>
                                 item.id === s.id ? { ...item, thumb_url: null, preview_url: null } : item,
                               ) ?? current,
                             );
                             setFailedPreviews((failed) => ({ ...failed, [s.id]: true }));
                           }}

                          className="h-full w-full object-cover"
                        />
                      ) : failedPreviews[s.id] ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-foreground/5 px-4 text-center">
                          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/45">
                            Preview didn't load
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setReloadKey((k) => k + 1);
                            }}
                            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-full w-full animate-pulse items-center justify-center bg-foreground/5">
                          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/45">
                            Loading…
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
                <div className="border-t border-foreground/5 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-semibold text-foreground">{s.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
                      {isCopyTab ? "Icing" : "Slice"}
                    </div>
                  </div>
                  {s.prompt && (
                    <details className="mt-3 rounded-2xl bg-foreground/[0.04] px-3 py-2">
                      <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
                        The prompt
                      </summary>
                      <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-foreground/70">
                        {s.prompt}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyPrompt(s)}
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground/75 transition active:scale-95"
                        >
                          {copiedPromptId === s.id ? "Copied ✓" : "Copy prompt"}
                        </button>
                        <Link
                          to="/homemade"
                          search={{ from: s.id }}
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground/75 transition active:scale-95"
                        >
                          Reuse in Home made
                        </Link>
                      </div>
                    </details>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => (isCopyTab ? copyText(s) : openSave(s))}
                      className="rounded-full bg-foreground/5 px-3 py-2.5 text-xs font-semibold text-foreground/80 transition active:scale-95 hover:bg-foreground/10"
                    >
                      {isCopyTab ? (copiedId === s.id ? "Copied ✓" : "Copy text") : "Save"}
                    </button>
                    <button
                      onClick={() => remix(s.id)}
                      className="rounded-full bg-foreground/5 px-3 py-2.5 text-xs font-semibold text-foreground/80 transition active:scale-95 hover:bg-foreground/10"
                    >
                      Remix
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="rounded-full bg-foreground/5 px-3 py-2.5 text-xs font-semibold text-foreground/50 transition active:scale-95 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <SaveSheet payload={savePayload} onClose={closeSave} />
    </main>
  );
}
