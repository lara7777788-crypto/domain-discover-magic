import { Link } from "@tanstack/react-router";
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
  const empty = !isAdmin && !loading && total < cost;

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium backdrop-blur ${
          empty
            ? "border-rose-300 bg-rose-50/90 text-rose-700"
            : "border-foreground/10 bg-white/70 text-foreground/70"
        }`}
      >
        <span aria-hidden>🍰</span>
        {isAdmin ? (
          <span>Unlimited (admin) · uses {costLabel(cost)}</span>
        ) : loading ? (
          <span>Counting slices…</span>
        ) : empty ? (
          <span>
            Out of slices — this needs {costLabel(cost)}
          </span>
        ) : (
          <span>
            <strong className="text-foreground">{formatSlices(total)}</strong> slice
            {total === 1 ? "" : "s"} left · uses {costLabel(cost)}
          </span>
        )}
      </div>
      {empty && (
        <Link
          to="/pricing"
          className="rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          Get more slices
        </Link>
      )}
    </div>
  );
}
