import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function TopNav() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const linkClass =
    "shrink-0 whitespace-nowrap rounded-full bg-white/60 px-4 py-2.5 text-foreground/70 transition hover:bg-white hover:text-foreground sm:px-5";
  const activeClass =
    "shrink-0 whitespace-nowrap rounded-full bg-foreground px-4 py-2.5 font-semibold text-white transition hover:bg-foreground hover:text-white sm:px-5";

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-4 py-4 md:px-10 md:py-5">

      <nav className="pointer-events-auto ml-auto flex min-w-0 items-center gap-2 overflow-x-auto py-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!loading && user ? (
          <>
            <Link
              to="/pricing"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              Pro
            </Link>
            <Link
              to="/slices"
              search={{ tab: "slices" as const }}
              activeOptions={{ includeSearch: true }}
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              My slices
            </Link>
            <Link
              to="/slices"
              search={{ tab: "copy" as const }}
              activeOptions={{ includeSearch: true }}
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              My icing
            </Link>
            <Link
              to="/mix"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              Mix
            </Link>
            <Link
              to="/effects"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              Effects
            </Link>
            <Link
              to="/bake"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              New slice
            </Link>
            <button
              onClick={() => setConfirmLogout(true)}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-2.5 text-foreground/50 transition hover:text-foreground"
            >
              Sign out
            </button>
          </>

        ) : (
          <>
            <Link
              to="/about"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              About
            </Link>
            <Link
              to="/login"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              Sign in
            </Link>
          </>
        )}
      </nav>
    </header>
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
          />
          <div className="relative z-10 w-full max-w-xs rounded-3xl border border-white bg-cream/90 p-6 text-center shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)] backdrop-blur">
            <p className="font-display text-lg font-semibold text-foreground">Sign out?</p>
            <p className="mt-1 text-sm text-foreground/60">You’ll return to the Layercake splash.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-white hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmLogout(false);
                  try {
                    localStorage.removeItem("lc_splash_seen_at_v2");
                  } catch {
                    /* ignore */
                  }
                  await signOut();
                  window.location.replace("/");
                }}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-foreground/90"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
