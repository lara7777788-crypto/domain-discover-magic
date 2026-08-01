import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/public/payments/diag")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") === "sandbox" ? "sandbox" : "live") as StripeEnv;
        const fix = url.searchParams.get("fix") === "1";
        const out: Record<string, unknown> = { env };
        try {
          const stripe = createStripeClient(env);
          for (const key of ["pro_monthly", "pro_yearly", "slice_pack_10"]) {
            const prices = await stripe.prices.list({ lookup_keys: [key], expand: ["data.product"] });
            const p = prices.data[0];
            if (!p) {
              out[key] = "MISSING";
              continue;
            }
            const product = p.product as any;
            if (fix && !product?.tax_code) {
              await stripe.products.update(product.id, { tax_code: "txcd_10000000" });
            }
            out[key] = {
              id: p.id,
              amount: p.unit_amount,
              type: p.type,
              product: product?.id,
              tax_code: fix ? "txcd_10000000" : (product?.tax_code ?? null),
            };
          }
          const prices = await stripe.prices.list({ lookup_keys: ["pro_monthly"] });
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
          }
        } catch (e: any) {
          out["fatal"] = e?.raw?.message ?? e?.message ?? String(e);
        }
        return Response.json(out);
      },
    },
  },
});
