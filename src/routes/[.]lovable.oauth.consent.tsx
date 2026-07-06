import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Local wrapper — `supabase.auth.oauth` is beta and not always in the SDK types.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/login", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-16 text-sm text-foreground/70">
      Could not load this authorization request: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as any;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthApi().approveAuthorization(authorization_id)
      : await oauthApi().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message ?? "Something went wrong.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFE5F1 0%, #FFE9D6 22%, #FFF5C2 42%, #DFF5DD 62%, #DCEEFF 82%, #ECE0FF 100%)",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-white bg-white/85 p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] backdrop-blur">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Connect {clientName} to Layercake?
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {clientName} will be able to read and create designs in your Layercake account as you.
          </p>
          {error && (
            <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <button
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1 rounded-full border border-foreground/15 bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
