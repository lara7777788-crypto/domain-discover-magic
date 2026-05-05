/**
 * RLS regression tests for Layercake credit / role tables.
 *
 *   bun tests/rls.test.ts
 *
 * Verifies:
 *   1. Admin (founder) bypasses spend_generation_credit deduction.
 *   2. Non-admin cannot read other users' rows in credit / role tables.
 *   3. Non-admin cannot mutate slice_credits, user_roles, coupons.
 *   4. Privileged RPCs are not callable from the `authenticated` role.
 *
 * Test users are created via the Supabase admin API and torn down at the end.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
const ADMIN_EMAIL = "lara7777788@gmail.com";

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
  throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_PUBLISHABLE_KEY");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let pass = 0;
let fail = 0;
const ok = (label: string) => {
  pass++;
  console.log(`  ✓ ${label}`);
};
const bad = (label: string, detail?: unknown) => {
  fail++;
  console.log(`  ✗ ${label}`);
  if (detail !== undefined) console.log("    →", detail);
};
const expect = (cond: boolean, label: string, detail?: unknown) =>
  cond ? ok(label) : bad(label, detail);

async function main() {
  // ---------- Discover the founder/admin user --------------------------------
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const adminUser = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
  if (!adminUser) throw new Error(`admin fixture missing: ${ADMIN_EMAIL}`);

  // Sanity: founder is actually flagged admin.
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", adminUser.id)
    .eq("role", "admin");
  expect((roleRows?.length ?? 0) === 1, "founder account has admin role");

  // ---------- Create two non-admin users -------------------------------------
  const created: string[] = [];
  const mkUser = async (label: string) => {
    const { data, error } = await admin.auth.admin.createUser({
      email: `rls-${label}-${Date.now()}@example.test`,
      password: crypto.randomUUID() + "Aa!1",
      email_confirm: true,
    });
    if (error) throw error;
    created.push(data.user.id);
    return data.user;
  };

  const userA = await mkUser("a");
  const userB = await mkUser("b");

  // Give them known credit balances.
  await admin.from("profiles").update({ slice_credits: 3 }).eq("id", userA.id);
  await admin.from("profiles").update({ slice_credits: 5 }).eq("id", userB.id);

  // Seed a coupon + redemption owned by userB so userA can try to read them.
  const couponCode = `RLS-${Date.now()}`;
  const { data: coupon, error: couponErr } = await admin
    .from("coupons")
    .insert({ code: couponCode, slices: 7, max_uses: 100, active: true })
    .select("id")
    .single();
  if (couponErr) throw couponErr;
  await admin
    .from("coupon_redemptions")
    .insert({ coupon_id: coupon.id, user_id: userB.id, slices_granted: 7 });

  try {
    // ---------- Sign in as userA (non-admin) and probe RLS -------------------
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: session, error: signInErr } = await userClient.auth.signInWithPassword({
      email: userA.email!,
      password: "wrong", // we'll use admin-issued session instead
    }).catch(() => ({ data: null, error: { message: "skip" } } as any));

    // Easier: mint a session directly via admin API.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userA.email!,
    });
    if (linkErr) throw linkErr;

    // Use admin.createUser path to set a known password instead.
    const newPassword = "TestPass!" + Math.random().toString(36).slice(2);
    await admin.auth.admin.updateUserById(userA.id, { password: newPassword });
    const signIn = await userClient.auth.signInWithPassword({
      email: userA.email!,
      password: newPassword,
    });
    if (signIn.error) throw signIn.error;

    // 1. Non-admin sees only their own profile row.
    {
      const { data, error } = await userClient.from("profiles").select("id");
      expect(!error && data?.length === 1 && data[0].id === userA.id,
        "non-admin: sees only own profile row", error?.message ?? data);
    }

    // 2. Non-admin cannot increase own slice_credits (WITH CHECK forbids it).
    {
      const { error } = await userClient
        .from("profiles")
        .update({ slice_credits: 9999 })
        .eq("id", userA.id);
      const { data: after } = await admin
        .from("profiles")
        .select("slice_credits")
        .eq("id", userA.id)
        .single();
      expect(after?.slice_credits === 3,
        "non-admin: cannot self-grant slice_credits via UPDATE",
        { error: error?.message, after });
    }

    // 3. Cannot read other users' rows in credit / role tables.
    {
      const { data } = await userClient.from("profiles").select("id").neq("id", userA.id);
      expect((data?.length ?? 0) === 0, "non-admin: cannot read other profiles", data);
    }
    {
      const { data } = await userClient.from("user_roles").select("user_id");
      expect((data?.length ?? 0) === 0, "non-admin: cannot read user_roles", data);
    }
    {
      const { data } = await userClient.from("subscriptions").select("user_id").neq("user_id", userA.id);
      expect((data?.length ?? 0) === 0, "non-admin: cannot read others' subscriptions", data);
    }
    {
      const { data } = await userClient.from("coupons").select("id");
      expect((data?.length ?? 0) === 0, "non-admin: cannot read coupons table", data);
    }
    {
      const { data } = await userClient
        .from("coupon_redemptions")
        .select("user_id")
        .neq("user_id", userA.id);
      expect((data?.length ?? 0) === 0, "non-admin: cannot read others' coupon_redemptions", data);
    }

    // 4. Cannot INSERT into restricted tables.
    {
      const { error } = await userClient
        .from("coupons")
        .insert({ code: "HACK-" + Date.now(), slices: 9999 });
      expect(!!error, "non-admin: INSERT on coupons is blocked", error?.message);
    }
    {
      const { error } = await userClient
        .from("user_roles")
        .insert({ user_id: userA.id, role: "admin" });
      expect(!!error, "non-admin: cannot self-promote into user_roles", error?.message);
    }
    {
      const { error } = await userClient
        .from("coupon_redemptions")
        .insert({ coupon_id: coupon.id, user_id: userA.id, slices_granted: 9999 });
      expect(!!error, "non-admin: INSERT on coupon_redemptions is blocked", error?.message);
    }
    {
      const { error } = await userClient
        .from("subscriptions")
        .insert({
          user_id: userA.id,
          stripe_customer_id: "cus_x",
          stripe_subscription_id: "sub_x",
          product_id: "prod_x",
          price_id: "price_x",
          status: "active",
        });
      expect(!!error, "non-admin: INSERT on subscriptions is blocked", error?.message);
    }

    // 5. Privileged RPCs are not callable as authenticated.
    for (const fn of ["spend_generation_credit", "grant_slice_credits", "has_role"] as const) {
      const args =
        fn === "has_role" ? { _user_id: userA.id, _role: "admin" }
        : fn === "grant_slice_credits" ? { p_user_id: userA.id, p_amount: 1 }
        : { p_user_id: userA.id };
      const { error } = await userClient.rpc(fn, args as any);
      expect(!!error, `non-admin: cannot call ${fn} RPC directly`, error?.message);
    }

    // ---------- As service role: verify admin bypass + non-admin deduction ---

    // 6. Non-admin spend deducts exactly one slice.
    {
      const { data: before } = await admin.from("profiles").select("slice_credits").eq("id", userA.id).single();
      const { data: returned, error } = await admin.rpc("spend_generation_credit", { p_user_id: userA.id });
      const { data: after } = await admin.from("profiles").select("slice_credits").eq("id", userA.id).single();
      expect(!error && after!.slice_credits === before!.slice_credits - 1,
        "non-admin: spend_generation_credit deducts exactly one slice",
        { error: error?.message, before, returned, after });
    }

    // 7. Admin bypasses the deduction.
    {
      await admin.from("profiles").update({ slice_credits: 4 }).eq("id", adminUser.id);
      const { data: returned, error } = await admin.rpc("spend_generation_credit", { p_user_id: adminUser.id });
      const { data: after } = await admin.from("profiles").select("slice_credits").eq("id", adminUser.id).single();
      expect(!error && after!.slice_credits === 4 && returned === 4,
        "admin: spend_generation_credit does NOT deduct credits",
        { error: error?.message, returned, after });
    }

    // 8. Non-admin at zero credits raises no_credits.
    {
      await admin.from("profiles").update({ slice_credits: 0 }).eq("id", userA.id);
      const { error } = await admin.rpc("spend_generation_credit", { p_user_id: userA.id });
      expect(!!error && /no_credits/.test(error.message),
        "non-admin at 0 credits: spend raises no_credits",
        error?.message);
    }
  } finally {
    // ---------- Teardown ------------------------------------------------------
    await admin.from("coupon_redemptions").delete().eq("coupon_id", coupon.id);
    await admin.from("coupons").delete().eq("id", coupon.id);
    for (const id of created) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
