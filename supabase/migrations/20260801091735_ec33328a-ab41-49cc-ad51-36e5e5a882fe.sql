-- 1. Ledger ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('spend','grant')),
  amount numeric(10,2) NOT NULL,
  source text NOT NULL DEFAULT 'other',
  note text,
  balance_after numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_events TO authenticated;
GRANT ALL ON public.credit_events TO service_role;

ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit events: owner select"
  ON public.credit_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Credit events: service role manages"
  ON public.credit_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS credit_events_user_created_idx
  ON public.credit_events (user_id, created_at DESC);

-- 2. Prompt text on designs ------------------------------------------------
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS prompt_text text;

UPDATE public.designs
   SET prompt_text = data->'result'->>'prompt'
 WHERE prompt_text IS NULL
   AND data->'result'->>'prompt' IS NOT NULL;

-- 3. spend_credits: log every spend ---------------------------------------
DROP FUNCTION IF EXISTS public.spend_credits(uuid, numeric);

CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid,
  p_amount numeric,
  p_source text DEFAULT 'generation'
)
RETURNS TABLE(balance numeric, monthly_remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_amount numeric(10,2) := GREATEST(COALESCE(p_amount, 1), 0);
  v_monthly_left numeric(10,2);
  v_from_monthly numeric(10,2);
  v_left numeric(10,2);
  v_take numeric(10,2);
  v_rollover numeric(10,2);
  v_balance numeric(10,2);
  r record;
BEGIN
  PERFORM public.sync_credit_period(p_user_id);

  IF public.has_role(p_user_id, 'admin') THEN
    SELECT COALESCE(SUM(cr.amount), 0) INTO v_rollover
      FROM public.credit_rollovers cr WHERE cr.user_id = p_user_id AND cr.expires_at > now();

    INSERT INTO public.credit_events (user_id, kind, amount, source, note)
      VALUES (p_user_id, 'spend', 0, COALESCE(p_source, 'generation'), 'admin — no charge');

    RETURN QUERY
      SELECT p.slice_credits + v_rollover, GREATEST(p.monthly_allowance - p.period_used, 0)
        FROM public.profiles p WHERE p.id = p_user_id;
    RETURN;
  END IF;

  SELECT GREATEST(p.monthly_allowance - p.period_used, 0) INTO v_monthly_left
    FROM public.profiles p WHERE p.id = p_user_id FOR UPDATE;

  IF v_monthly_left IS NULL THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  v_from_monthly := LEAST(v_monthly_left, v_amount);
  v_left := v_amount - v_from_monthly;

  IF v_from_monthly > 0 THEN
    UPDATE public.profiles p SET period_used = p.period_used + v_from_monthly WHERE p.id = p_user_id;
  END IF;

  FOR r IN
    SELECT cr.id, cr.amount FROM public.credit_rollovers cr
      WHERE cr.user_id = p_user_id AND cr.expires_at > now() AND cr.amount > 0
      ORDER BY cr.expires_at ASC
      FOR UPDATE
  LOOP
    EXIT WHEN v_left <= 0;
    v_take := LEAST(r.amount, v_left);
    UPDATE public.credit_rollovers SET amount = amount - v_take WHERE id = r.id;
    v_left := v_left - v_take;
  END LOOP;

  DELETE FROM public.credit_rollovers WHERE user_id = p_user_id AND amount <= 0;

  IF v_left > 0 THEN
    UPDATE public.profiles p
      SET slice_credits = p.slice_credits - v_left
      WHERE p.id = p_user_id AND p.slice_credits >= v_left;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'no_credits';
    END IF;
  END IF;

  SELECT COALESCE(SUM(cr.amount), 0) INTO v_rollover
    FROM public.credit_rollovers cr WHERE cr.user_id = p_user_id AND cr.expires_at > now();

  SELECT p.slice_credits + v_rollover + GREATEST(p.monthly_allowance - p.period_used, 0)
    INTO v_balance
    FROM public.profiles p WHERE p.id = p_user_id;

  INSERT INTO public.credit_events (user_id, kind, amount, source, balance_after)
    VALUES (p_user_id, 'spend', v_amount, COALESCE(p_source, 'generation'), v_balance);

  RETURN QUERY
    SELECT p.slice_credits + v_rollover, GREATEST(p.monthly_allowance - p.period_used, 0)
      FROM public.profiles p WHERE p.id = p_user_id;
END;
$function$;

-- 4. Log coupon grants -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(p_user_id uuid, p_code text)
RETURNS TABLE(granted integer, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon record;
  v_updated_coupon uuid;
  v_new_balance integer;
BEGIN
  SELECT id, code, slices, max_uses, uses_count, expires_at, active
    INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(p_code)
    FOR UPDATE;

  IF NOT FOUND OR NOT v_coupon.active THEN
    RAISE EXCEPTION 'coupon_not_found';
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RAISE EXCEPTION 'coupon_expired';
  END IF;

  UPDATE public.coupons
    SET uses_count = uses_count + 1
    WHERE id = v_coupon.id
      AND (max_uses IS NULL OR uses_count < max_uses)
    RETURNING id INTO v_updated_coupon;
  IF v_updated_coupon IS NULL THEN
    RAISE EXCEPTION 'coupon_exhausted';
  END IF;

  BEGIN
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, slices_granted)
    VALUES (v_coupon.id, p_user_id, v_coupon.slices);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'already_redeemed';
  END;

  UPDATE public.profiles
    SET slice_credits = slice_credits + v_coupon.slices
    WHERE id = p_user_id
    RETURNING slice_credits INTO v_new_balance;

  INSERT INTO public.credit_events (user_id, kind, amount, source, note, balance_after)
    VALUES (p_user_id, 'grant', v_coupon.slices, 'coupon', v_coupon.code, v_new_balance);

  granted := v_coupon.slices;
  balance := v_new_balance;
  RETURN NEXT;
END;
$function$;

-- 5. Log pack / purchase grants -------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_slice_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric(10,2);
BEGIN
  UPDATE public.profiles
    SET slice_credits = slice_credits + GREATEST(COALESCE(p_amount, 0), 0)
    WHERE id = p_user_id
    RETURNING slice_credits INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  INSERT INTO public.credit_events (user_id, kind, amount, source, balance_after)
    VALUES (p_user_id, 'grant', GREATEST(COALESCE(p_amount, 0), 0), 'purchase', v_balance);

  RETURN v_balance::integer;
END;
$function$;