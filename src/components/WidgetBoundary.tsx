import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Shown in the fallback so users know which piece hiccuped. */
  label?: string;
  /** Render nothing at all when this widget fails (background widgets). */
  silent?: boolean;
};

type State = { error: Error | null };

/**
 * Small, local error boundary for live/realtime widgets (credit meter, mix panel).
 * A crash inside one of these must never blank the whole page — we swap in a
 * friendly inline card with a retry instead.
 */
export class WidgetBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[WidgetBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.silent) return null;

    return (
      <div className="rounded-2xl border border-[#e8b7cf] bg-[#fdf2f7]/80 p-4 text-[12px] leading-relaxed text-foreground/75 backdrop-blur">
        <p className="font-semibold text-foreground">
          {this.props.label ? `${this.props.label} hit a snag 🍰` : "This bit hit a snag 🍰"}
        </p>
        <p className="mt-1">
          Everything else still works — your slices and balance are safe. Give it another go.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={this.reset}
            className="rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-white"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-foreground/5 px-4 py-2 text-[12px] font-semibold text-foreground/80"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
