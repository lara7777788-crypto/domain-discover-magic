-- RLS regression tests for Layercake credit / role tables.
-- Run with: bash scripts/test-rls.sh
-- All work happens inside a transaction and is rolled back at the end.

\set ON_ERROR_STOP on
\timing off
SET client_min_messages = warning;

BEGIN;

-- ---------------------------------------------------------------------------
-- Fixtures: synthesized non-admin profiles. The admin user is the founder
-- account (lara7777788@gmail.com) seeded by the admin-role migration.
-- We avoid touching auth.users because that schema requires elevated rights.
-- ---------------------------------------------------------------------------
\set admin_id '''6c07d4ea-2d9e-4b18-888d-3e8aace7fbdb'''

INSERT INTO public.profiles (id, email, display_name, slice_credits)
VALUES ('11111111-1111-1111-1111-111111111111', 'rls-test-nonadmin@example.test', 'rls test', 3),
       ('22222222-2222-2222-2222-222222222222', 'rls-test-other@example.test',    'rls other', 5);

INSERT INTO public.coupons (code, slices, max_uses, active)
VALUES ('RLS-TEST-COUPON', 7, 100, true);

INSERT INTO public.coupon_redemptions (coupon_id, user_id, slices_granted)
SELECT id, '22222222-2222-2222-2222-222222222222', 7 FROM public.coupons WHERE code='RLS-TEST-COUPON';

-- ---------------------------------------------------------------------------
-- Helper: assert(condition, label)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.assert(cond boolean, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT cond THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

-- ===========================================================================
-- AS NON-ADMIN USER
-- ===========================================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- 1. Non-admin can read ONLY their own profile row.
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.profiles;
  PERFORM pg_temp.assert(n = 1, 'non-admin sees only own profile row');
END $$;

-- 2. Non-admin CANNOT mutate slice_credits on their own profile (RLS WITH CHECK).
DO $$ DECLARE ok boolean := false; BEGIN
  BEGIN
    UPDATE public.profiles SET slice_credits = slice_credits + 100
      WHERE id = '11111111-1111-1111-1111-111111111111';
    -- The policy's WITH CHECK requires slice_credits to stay equal to the stored value.
    -- If the update silently affected 0 rows, that's also acceptable — re-read.
    PERFORM 1 FROM public.profiles
      WHERE id='11111111-1111-1111-1111-111111111111' AND slice_credits = 3;
    IF FOUND THEN ok := true; END IF;
  EXCEPTION WHEN check_violation OR insufficient_privilege THEN
    ok := true;
  END;
  PERFORM pg_temp.assert(ok, 'non-admin cannot increase own slice_credits via UPDATE');
END $$;

-- 3. Non-admin CANNOT read other users' rows (profiles, designs, layer_chips, subscriptions, user_roles).
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.profiles WHERE id <> '11111111-1111-1111-1111-111111111111';
  PERFORM pg_temp.assert(n = 0, 'non-admin cannot read other profiles');

  SELECT count(*) INTO n FROM public.user_roles;
  PERFORM pg_temp.assert(n = 0, 'non-admin cannot read user_roles (none belong to them)');

  SELECT count(*) INTO n FROM public.subscriptions WHERE user_id <> '11111111-1111-1111-1111-111111111111';
  PERFORM pg_temp.assert(n = 0, 'non-admin cannot read others subscriptions');
END $$;

-- 4. Non-admin CANNOT read coupons table (no SELECT policy exists; service-role only).
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.coupons;
  PERFORM pg_temp.assert(n = 0, 'non-admin cannot read coupons table');
END $$;

-- 5. Non-admin CANNOT read other users' coupon_redemptions.
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.coupon_redemptions WHERE user_id <> '11111111-1111-1111-1111-111111111111';
  PERFORM pg_temp.assert(n = 0, 'non-admin cannot read others coupon_redemptions');
END $$;

-- 6. Non-admin CANNOT INSERT into coupons / user_roles / coupon_redemptions / subscriptions / processed_webhook_events.
DO $$ DECLARE blocked boolean := false; BEGIN
  BEGIN
    INSERT INTO public.coupons (code, slices) VALUES ('HACK', 9999);
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN blocked := true;
  END;
  PERFORM pg_temp.assert(blocked, 'non-admin INSERT on coupons is blocked');
END $$;

DO $$ DECLARE blocked boolean := false; BEGIN
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
      VALUES ('11111111-1111-1111-1111-111111111111', 'admin');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN blocked := true;
  END;
  PERFORM pg_temp.assert(blocked, 'non-admin INSERT on user_roles (self-promote to admin) is blocked');
END $$;

DO $$ DECLARE blocked boolean := false; BEGIN
  BEGIN
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, slices_granted)
      SELECT id, '11111111-1111-1111-1111-111111111111', 9999 FROM public.coupons LIMIT 1;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR not_null_violation THEN blocked := true;
  END;
  PERFORM pg_temp.assert(blocked, 'non-admin INSERT on coupon_redemptions is blocked');
END $$;

-- 7. spend_generation_credit / has_role / grant_slice_credits are NOT executable by `authenticated`.
DO $$ DECLARE blocked boolean := false; BEGIN
  BEGIN
    PERFORM public.spend_generation_credit('11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  PERFORM pg_temp.assert(blocked, 'non-admin cannot call spend_generation_credit directly');
END $$;

DO $$ DECLARE blocked boolean := false; BEGIN
  BEGIN
    PERFORM public.has_role('11111111-1111-1111-1111-111111111111', 'admin');
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  PERFORM pg_temp.assert(blocked, 'non-admin cannot call has_role directly');
END $$;

DO $$ DECLARE blocked boolean := false; BEGIN
  BEGIN
    PERFORM public.grant_slice_credits('11111111-1111-1111-1111-111111111111', 9999);
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  PERFORM pg_temp.assert(blocked, 'non-admin cannot call grant_slice_credits directly');
END $$;

-- ===========================================================================
-- AS SERVICE ROLE (mirrors the server using supabaseAdmin)
-- ===========================================================================
RESET ROLE;
RESET "request.jwt.claims";

-- 8. spend_generation_credit DECREMENTS for non-admin.
DO $$ DECLARE before_credits int; after_credits int; BEGIN
  SELECT slice_credits INTO before_credits FROM public.profiles
    WHERE id='11111111-1111-1111-1111-111111111111';
  after_credits := public.spend_generation_credit('11111111-1111-1111-1111-111111111111');
  PERFORM pg_temp.assert(after_credits = before_credits - 1, 'non-admin: spend deducts exactly one slice');
END $$;

-- 9. spend_generation_credit BYPASSES deduction for admin.
DO $$
DECLARE
  v_admin uuid := '6c07d4ea-2d9e-4b18-888d-3e8aace7fbdb';
  before_credits int;
  after_credits int;
  remaining int;
BEGIN
  -- Confirm the founder is actually marked admin (sanity check on the seed).
  PERFORM pg_temp.assert(public.has_role(v_admin, 'admin'), 'founder account has admin role');
  UPDATE public.profiles SET slice_credits = 5 WHERE id = v_admin;
  SELECT slice_credits INTO before_credits FROM public.profiles WHERE id = v_admin;
  remaining := public.spend_generation_credit(v_admin);
  SELECT slice_credits INTO after_credits FROM public.profiles WHERE id = v_admin;
  PERFORM pg_temp.assert(after_credits = before_credits, 'admin: spend does NOT decrement slice_credits');
  PERFORM pg_temp.assert(remaining = before_credits, 'admin: spend returns current balance unchanged');
END $$;

-- 10. spend_generation_credit raises no_credits when non-admin hits zero.
DO $$ DECLARE got_no_credits boolean := false; BEGIN
  UPDATE public.profiles SET slice_credits = 0 WHERE id='11111111-1111-1111-1111-111111111111';
  BEGIN
    PERFORM public.spend_generation_credit('11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%no_credits%' THEN got_no_credits := true; END IF;
  END;
  PERFORM pg_temp.assert(got_no_credits, 'non-admin at 0 credits: spend raises no_credits');
END $$;

-- ---------------------------------------------------------------------------
ROLLBACK;
\echo
\echo '✅ All RLS regression tests passed.'
