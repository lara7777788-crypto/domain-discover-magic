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
      { name: "description", content: "Your saved cake slices, ready to edit or download." },
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

function SlicesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [slices, setSlices] = useState<Slice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

  const openSave = (s: Slice) => {
    if (!s.preview_url) {
      setError("This slice has no preview yet — open it in Bake to render one.");
      return;
    }
    setSavePayload({
      url: s.preview_url,
      filename: `${(s.name || "layercake-slice").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.png`,
    });
  };

  const closeSave = () => setSavePayload(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("id, name, preview_url, is_unlocked, updated_at")
        .order("updated_at", { ascending: false });
      if (error) setError(error.message);
      else setSlices(data as Slice[]);
    })();
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this slice?")) return;
    await supabase.from("designs").delete().eq("id", id);
    setSlices((s) => s?.filter((x) => x.id !== id) ?? null);
  };

  const remix = async (id: string) => {
    if (!user) return;
    const { data: src } = await supabase.from("designs").select("name, data").eq("id", id).maybeSingle();
    if (!src) return;
    const { data: copy, error } = await supabase
      .from("designs")
      .insert({ user_id: user.id, name: `${src.name} (remix)`, data: src.data, preview_url: null })
      .select("id")
      .single();
    if (error || !copy) return;
    navigate({ to: "/bake", search: { slice: copy.id } });
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

        {error && <div className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

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
