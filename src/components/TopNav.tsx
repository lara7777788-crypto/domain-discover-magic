import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function TopNav() {
  const { user, signOut, loading } = useAuth();
  const linkClass =
    "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-foreground/70 transition hover:bg-white/60 hover:text-foreground sm:px-4";
  const activeClass = "bg-foreground font-medium text-white hover:bg-foreground hover:text-white";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-4 py-4 md:px-10 md:py-5">
      <Link
        to="/"
        className="pointer-events-auto shrink-0 font-display text-base font-semibold tracking-tight text-foreground/80 transition hover:text-foreground max-[420px]:max-w-[104px] max-[420px]:overflow-hidden"
      >
        layercake
      </Link>
      <nav className="pointer-events-auto ml-auto flex min-w-0 items-center gap-1 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
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
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              My slices
            </Link>
            <Link
              to="/bake"
              activeProps={{ className: activeClass }}
              inactiveProps={{ className: linkClass }}
            >
              New slice
            </Link>
            <button
              onClick={() => signOut()}
              className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-foreground/50 transition hover:text-foreground sm:px-3"
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
  );
}
