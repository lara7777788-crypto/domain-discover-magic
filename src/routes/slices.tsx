import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { SaveSheet, type SavePayload } from "@/components/SaveSheet";

export const Route = createFileRoute("/slices")({
  head: () => ({
    meta: [
      { title: "My Slices — Layercake" },
      { name: "description", content: "Your saved cake slices, ready to edit, download, or remix." },
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
};

type SliceMeta = Omit<Slice, "preview_url">;

function SlicesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [slices, setSlices] = useState<Slice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

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
        .select("id, name, is_unlocked, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(24);
      if (cancelled) return;
      if (error) {
        console.error("[slices] failed to load designs", error);
        setError("Failed to load your slices. Please refresh and try again.");
        setSlices([]);
      } else {
        const rows = (data ?? []) as SliceMeta[];
        setSlices(rows.map((row) => ({ ...row, preview_url: null })));

        for (const row of rows) {
          if (cancelled) return;
          const { data: preview } = await supabase
            .from("designs")
            .select("id, preview_url")
            .eq("id", row.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (cancelled) return;
          if (preview?.preview_url) {
            setSlices((current) =>
              current?.map((slice) =>
                slice.id === row.id ? { ...slice, preview_url: preview.preview_url as string } : slice,
              ) ?? current,
            );
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const remove = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this slice?")) return;
    const { error: delErr, count } = await supabase
      .from("designs")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (delErr) {
      console.error("delete slice failed", delErr);
      alert("Couldn't delete that slice. Please try again.");
      return;
    }
    if (!count) {
      alert("That slice couldn't be deleted (it may already be gone).");
      setReloadKey((k) => k + 1);
      return;
    }
    setSlices((s) => s?.filter((x) => x.id !== id) ?? null);
  };

  const remix = (id: string) => {
    if (!user) return;
    // Don't create a DB row here — open the editor with the source pre-filled
    // as an UNSAVED draft. It only persists when the user clicks Bake.
    navigate({ to: "/bake", search: { remix: id } });
  };

  return (
    <main
      className="relative min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 30%, #FFF5C2 60%, #DFF5DD 100%)",
      }}
    >
      <TopNav />
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-28">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/50">Your gallery</p>
            <h1 className="mt-2 font-display text-5xl font-semibold text-foreground md:text-6xl">My slices.</h1>
          </div>
          <Link
            to="/bake"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
          >
            + New slice
          </Link>
        </div>

        {error && (
          <div className="mt-8 flex items-center justify-between gap-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {slices === null ? (
          <div className="mt-12 text-foreground/50">Loading…</div>
        ) : slices.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white bg-white/70 p-12 text-center backdrop-blur">
            <p className="text-foreground/60">No slices yet.</p>
            <Link
              to="/bake"
              className="mt-5 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white"
            >
              Bake your first slice
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {slices.map((s) => (
              <div
                key={s.id}
                className="group overflow-hidden rounded-3xl border border-white bg-white/80 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.25)] backdrop-blur transition hover:-translate-y-0.5"
              >
                <Link to="/bake" search={{ slice: s.id }} className="block">
                  <div className="aspect-square w-full overflow-hidden bg-foreground/5">
                    {s.preview_url ? (
                      <img src={s.preview_url} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-foreground/30">No preview</div>
                    )}
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-semibold text-foreground">{s.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
                      {s.is_unlocked ? "Unlocked" : "Preview"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openSave(s)}
                      className="text-xs font-medium text-foreground/70 hover:text-foreground"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => remix(s.id)}
                      className="text-xs font-medium text-foreground/70 hover:text-foreground"
                    >
                      Remix
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-xs text-foreground/40 hover:text-red-600"
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
