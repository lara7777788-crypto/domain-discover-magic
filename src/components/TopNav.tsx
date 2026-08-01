import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import splashMascot from "../assets/jp-frogcat-color.png";

export function TopNav() {
  const { user, signOut, loading } = useAuth();
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
                onClick={() => signOut()}
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

      {/* Splash action button — centered below the top menu, not in a corner */}
      <Link
        to="/"
        className="pointer-events-auto fixed left-1/2 top-[4.25rem] z-40 -translate-x-1/2 rounded-full border border-foreground/10 bg-cream/85 px-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:scale-105 hover:bg-cream"
      >
        <span className="flex items-center gap-2">
          <img
            src={splashMascot}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          <span className="whitespace-nowrap font-display text-sm font-semibold tracking-tight text-foreground">
            Splash
          </span>
        </span>
      </Link>
    </>
  );
}
