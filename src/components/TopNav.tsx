import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function TopNav() {
  const { user, signOut, loading } = useAuth();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10">
      <Link
        to="/"
        className="pointer-events-auto font-display text-base font-semibold tracking-tight text-foreground/80 transition hover:text-foreground"
      >
        layercake
      </Link>
      <nav className="pointer-events-auto flex items-center gap-2 text-sm">
        {!loading && user ? (
          <>
            <Link
              to="/pricing"
              className="rounded-full px-4 py-1.5 text-foreground/70 transition hover:bg-white/60 hover:text-foreground"
            >
              Pro
            </Link>
            <Link
              to="/slices"
              className="rounded-full px-4 py-1.5 text-foreground/70 transition hover:bg-white/60 hover:text-foreground"
            >
              My slices
            </Link>
            <Link
              to="/bake"
              className="rounded-full bg-foreground px-4 py-1.5 font-medium text-white transition hover:-translate-y-0.5"
            >
              New slice
            </Link>
            <button
              onClick={() => signOut()}
              className="rounded-full px-3 py-1.5 text-foreground/50 transition hover:text-foreground"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/about"
              className="rounded-full px-4 py-1.5 text-foreground/70 transition hover:bg-white/60 hover:text-foreground"
            >
              About
            </Link>
            <Link
              to="/login"
            className="rounded-full bg-foreground px-4 py-1.5 font-medium text-white transition hover:-translate-y-0.5"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
