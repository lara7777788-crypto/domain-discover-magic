import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";

type Tab = "slices" | "copy";

export const Route = createFileRoute("/slices")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab === "copy" ? "copy" : "slices") as Tab,
  }),
  head: () => ({
    meta: [
      { title: "My Slices — Layercake" },
      { name: "description", content: "Your saved cake slices and copy, ready to edit, download, or remix." },
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
  preview_url: string | null;
  is_unlocked: boolean;
  updated_at: string;
  mode: string | null;
  copy: string | null;
};

type SliceMeta = Omit<Slice, "preview_url">;

function SlicesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const [slices, setSlices] = useState<Slice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isCopyTab = tab === "copy";

  const visible = useMemo(
    () => (slices ?? []).filter((s) => (isCopyTab ? s.mode === "copy" : s.mode !== "copy")),
    [slices, isCopyTab],
  );

  const openSave = (s: Slice) => {
    if (!s.preview_url) {
      setError("This slice has no preview yet — open it in Bake to render one.");
      return;
    }
    setSavePayload({
      url: s.preview_url,
      filename: `${(s.name || "layercake-slice").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.png`,
      sliceId: s.id,
      locked: !s.is_unlocked,
    });
  };

  const closeSave = () => setSavePayload(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    setSlices(null);
    (async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("id, name, is_unlocked, updated_at, mode:data->>mode, copy:data->result->>copy")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(36);
      if (cancelled) return;
      if (error) {
        console.error("[slices] failed to load designs", error);
        setError("Failed to load your slices. Please refresh and try again.");
        setSlices([]);
        return;
      }

      const rows = (data ?? []) as unknown as SliceMeta[];
      setSlices(rows.map((row) => ({ ...row, preview_url: null })));

      // Previews are heavy base64 blobs — fetch them in small parallel batches,
      // all batches in flight at once so the grid fills fast.
      const imageRows = rows.filter((r) => r.mode !== "copy");
      const BATCH = 3;
      const batches: SliceMeta[][] = [];
      for (let i = 0; i < imageRows.length; i += BATCH) batches.push(imageRows.slice(i, i + BATCH));

      await Promise.all(
        batches.map(async (batch) => {
          const { data: found } = await supabase
            .from("designs")
            .select("id, preview_url")
            .eq("user_id", user.id)
            .in("id", batch.map((b) => b.id));
          if (cancelled || !found?.length) return;
          setSlices((current) =>
            current?.map((slice) => {
              const hit = found.find((f) => f.id === slice.id && f.preview_url);
              return hit ? { ...slice, preview_url: hit.preview_url as string } : slice;
            }) ?? current,
          );
        }),
      );
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
    // Don't create a DB row here — open the editor with the source pre-filled
    // as an UNSAVED draft. It only persists when the user clicks Bake.
    navigate({ to: "/bake", search: { remix: id, mode: isCopyTab ? "copy" : "image" } });
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
            {isCopyTab ? "My copy." : "My slices."}
          </h1>
        </div>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link to="/slices" search={{ tab: "slices" as Tab }} className={tabClass(!isCopyTab)}>
            My slices
          </Link>
          <Link to="/slices" search={{ tab: "copy" as Tab }} className={tabClass(isCopyTab)}>
            My copy
          </Link>
          <Link
            to="/bake"
            search={{ mode: (isCopyTab ? "copy" : "image") as "copy" | "image" }}
            className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
          >
            + New {isCopyTab ? "copy" : "slice"}
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
        ) : visible.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white bg-white/70 p-12 text-center backdrop-blur">
            <p className="text-foreground/60">{isCopyTab ? "No saved copy yet." : "No slices yet."}</p>
            <Link
              to="/bake"
              search={{ mode: (isCopyTab ? "copy" : "image") as "copy" | "image" }}
              className="mt-5 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white"
            >
              {isCopyTab ? "Whip your first copy" : "Bake your first slice"}
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
                      {s.preview_url ? (
                        <img
                          src={s.preview_url}
                          alt={s.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
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
                      {isCopyTab ? "Copy" : s.is_unlocked ? "Unlocked" : "Preview"}
                    </div>
                  </div>
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
