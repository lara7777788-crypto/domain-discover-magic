import { formatSlices, type Wallet } from "@/hooks/useCredits";

type Props = Pick<Wallet, "isAdmin"> & {
  total: number;
  cost: number;
  loading?: boolean;
  className?: string;
};

const costLabel = (cost: number) => (cost === 0.5 ? "1/2" : String(cost));

/** "12,340 slices left · uses 1" meter shown above every generate button. */
export function CreditMeter({ total, cost, isAdmin, loading, className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-[12px] font-medium text-foreground/70 backdrop-blur ${className}`}
    >
      <span aria-hidden>🍰</span>
      {isAdmin ? (
        <span>Unlimited (admin) · uses {costLabel(cost)}</span>
      ) : loading ? (
        <span>Counting slices…</span>
      ) : (
        <span>
          <strong className="text-foreground">{formatSlices(total)}</strong> slice
          {total === 1 ? "" : "s"} left · uses {costLabel(cost)}
        </span>
      )}
    </div>
  );
}
