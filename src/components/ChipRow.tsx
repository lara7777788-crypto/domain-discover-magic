import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChipLayer = "wish" | "visual" | "text" | "layout" | "logo";

type Chip = { id: string; label: string; content: string };

export function ChipRow({
  layer,
  ink,
  currentValue,
  onPick,
  userId,
}: {
  layer: ChipLayer;
  ink: string;
  currentValue: string;
  onPick: (content: string) => void;
  userId: string;
}) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("layer_chips")
      .select("id, label, content")
      .eq("layer", layer)
      .order("updated_at", { ascending: false })
      .limit(20);
    setChips((data ?? []) as Chip[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [layer, userId]);

  const save = async () => {
    const v = currentValue.trim();
    if (!v) return;
    const label = v.slice(0, 32) + (v.length > 32 ? "…" : "");
    setBusy(true);
    await supabase.from("layer_chips").insert({ user_id: userId, layer, label, content: v });
    setBusy(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("layer_chips").delete().eq("id", id);
    setChips((c) => c.filter((x) => x.id !== id));
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] opacity-60" style={{ color: ink }}>
          Saved {layer} chips
        </span>
        <button
          onClick={save}
          disabled={busy || !currentValue.trim()}
          className="text-[11px] font-medium opacity-70 transition hover:opacity-100 disabled:opacity-30"
          style={{ color: ink }}
        >
          + Save as chip
        </button>
      </div>
      {chips.length === 0 ? (
        <p className="text-xs italic opacity-50" style={{ color: ink }}>
          No chips yet — save this layer to reuse it across slices.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c.id}
              className="group inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs backdrop-blur"
              style={{ color: ink, border: `1px solid ${ink}33` }}
            >
              <button onClick={() => onPick(c.content)} className="font-medium">{c.label}</button>
              <button
                onClick={() => remove(c.id)}
                className="opacity-0 transition group-hover:opacity-60 hover:opacity-100"
                aria-label="Delete chip"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
