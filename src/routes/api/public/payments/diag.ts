import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/public/payments/diag")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") === "sandbox" ? "sandbox" : "live") as StripeEnv;
        const out: Record<string, unknown> = { env };
        try {
          const stripe = createStripeClient(env);
          for (const key of ["pro_monthly", "pro_yearly", "slice_pack_10"]) {
            const prices = await stripe.prices.list({ lookup_keys: [key], expand: ["data.product"] });
            const p = prices.data[0];
            out[key] = p
              ? {
                  id: p.id,
                  active: p.active,
                  type: p.type,
                  amount: p.unit_amount,
                  tax_code: (p.product as any)?.tax_code ?? null,
                  product_active: (p.product as any)?.active ?? null,
                }
              : "MISSING";
          }
          // Try creating a real checkout session (no charge until paid)
          const key = "pro_monthly";
          const prices = await stripe.prices.list({ lookup_keys: [key] });
          if (prices.data.length) {
            try {
              const s = await stripe.checkout.sessions.create({
                line_items: [{ price: prices.data[0].id, quantity: 1 }],
                mode: "subscription",
                ui_mode: "embedded_page",
                return_url: "https://layercake.site/checkout/return",
                metadata: { userId: "diagnostic" },
                subscription_data: { metadata: { userId: "diagnostic" } },
                managed_payments: { enabled: true },
              } as any);
              out["session_managed_payments"] = { ok: true, id: s.id };
            } catch (e: any) {
              out["session_managed_payments"] = { ok: false, error: e?.raw?.message ?? e?.message };
            }
            try {
              const s2 = await stripe.checkout.sessions.create({
                line_items: [{ price: prices.data[0].id, quantity: 1 }],
                mode: "subscription",
                ui_mode: "embedded_page",
                return_url: "https://layercake.site/checkout/return",
                metadata: { userId: "diagnostic" },
              } as any);
              out["session_plain"] = { ok: true, id: s2.id };
            } catch (e: any) {
              out["session_plain"] = { ok: false, error: e?.raw?.message ?? e?.message };
            }
          }
        } catch (e: any) {
          out["fatal"] = e?.raw?.message ?? e?.message ?? String(e);
        }
        return Response.json(out);
      },
    },
  },
});
