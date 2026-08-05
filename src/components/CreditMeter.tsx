import { Link } from "@tanstack/react-router";
import { WidgetBoundary } from "@/components/WidgetBoundary";
import { formatResetAt, formatSlices, nextQuotaReset, type Wallet } from "@/hooks/useCredits";

type Props = Pick<Wallet, "isAdmin"> & {
  total: number;
  cost: number;
  loading?: boolean;
  /** When the monthly allowance refills. Defaults to the next calendar month. */
  resetsAt?: Date;
  monthlyAllowance?: number;
  className?: string;
};

const costLabel = (cost: number) => (cost === 0.5 ? "1/2" : String(cost));

/** "12,340 slices left · uses 1 · resets Sep 1, 2:00 AM" meter shown above every generate button. */
export function CreditMeter(props: Props) {
  return (
    <WidgetBoundary label="Slice counter">
      <CreditMeterInner {...props} />
    </WidgetBoundary>
  );
}

function CreditMeterInner({

  cost,
  isAdmin,
  loading,
  resetsAt,
  className = "",
}: Props) {
  const empty = !isAdmin && !loading && total < cost;
  const reset = resetsAt ?? nextQuotaReset();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="inline-flex flex-wrap items-center gap-2">
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
            <span>Out of slices — this needs {costLabel(cost)}</span>
          ) : (
            <span aria-live="polite">
              <strong className="text-foreground">{formatSlices(total)}</strong> slice
              {total === 1 ? "" : "s"} left · uses {costLabel(cost)}
            </span>
          )}
        </div>
        {!isAdmin && !loading && (
          <span className="text-[11px] text-foreground/45">
            Quota resets {formatResetAt(reset)}
          </span>
        )}
        {empty && (
          <Link
            to="/pricing"
            className="rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Get more slices
          </Link>
        )}
      </div>

      {empty && (
        <div className="max-w-md rounded-2xl border border-[#e8b7cf] bg-[#fdf2f7] p-3 text-[12px] leading-relaxed text-foreground/75">
          <p className="font-semibold text-foreground">
            Student, teacher, artist or just starting out? 🍓
          </p>
          <p className="mt-1">
            The Community plan is <strong>$4/month for 50 slices</strong> — trust-based, no proof
            needed. Or wait until {formatResetAt(reset)} for your next refill.
          </p>
          <Link
            to="/pricing"
            className="mt-2 inline-flex rounded-full bg-[#d4508a] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Join Community · $4
          </Link>
        </div>
      )}
    </div>
  );
}
