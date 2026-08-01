
CREATE TABLE IF NOT EXISTS public.credit_rollovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  granted_for date NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, granted_for)
);

GRANT SELECT ON public.credit_rollovers TO authenticated;
GRANT ALL ON public.credit_rollovers TO service_role;

ALTER TABLE public.credit_rollovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rollovers: owner select" ON public.credit_rollovers;
CREATE POLICY "Rollovers: owner select" ON public.credit_rollovers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Rollovers: service role manages" ON public.credit_rollovers;
CREATE POLICY "Rollovers: service role manages" ON public.credit_rollovers
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS set_credit_rollovers_updated_at ON public.credit_rollovers;
CREATE TRIGGER set_credit_rollovers_updated_at
  BEFORE UPDATE ON public.credit_rollovers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Roll unused monthly allowance forward for 12 months, and drop expired rollover.
CREATE OR REPLACE FUNCTION public.sync_credit_period(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_allowance numeric(10,2) := 0;
  v_price text;
  v_profile record;
  v_unused numeric(10,2);
BEGIN
  SELECT price_id INTO v_price
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status IN ('active','trialing')
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;

  IF v_price = 'pro_monthly' THEN
    v_allowance := 90;
  ELSIF v_price = 'pro_yearly' THEN
    v_allowance := 45;
  ELSE
    v_allowance := 0;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- New month: carry the unused part of last period's allowance into the ledger.
  IF v_profile.period_start < date_trunc('month', now())::date THEN
    v_unused := GREATEST(v_profile.monthly_allowance - v_profile.period_used, 0);
    IF v_unused > 0 THEN
      INSERT INTO public.credit_rollovers (user_id, amount, granted_for, expires_at)
      VALUES (p_user_id, v_unused, v_profile.period_start, v_profile.period_start::timestamptz + interval '1 year')
      ON CONFLICT (user_id, granted_for)
      DO UPDATE SET amount = public.credit_rollovers.amount + EXCLUDED.amount;
    END IF;
  END IF;

  -- Expire rollover older than a year.
  DELETE FROM public.credit_rollovers
    WHERE user_id = p_user_id AND (expires_at <= now() OR amount <= 0);

  UPDATE public.profiles
    SET monthly_allowance = v_allowance,
        period_used = CASE WHEN period_start < date_trunc('month', now())::date THEN 0 ELSE period_used END,
        period_start = CASE WHEN period_start < date_trunc('month', now())::date THEN date_trunc('month', now())::date ELSE period_start END
    WHERE id = p_user_id;
END;
$function$;

DROP FUNCTION IF EXISTS public.credit_status(uuid);
CREATE FUNCTION public.credit_status(p_user_id uuid)
RETURNS TABLE(balance numeric, monthly_remaining numeric, monthly_allowance numeric, rollover numeric, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rollover numeric(10,2);
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM public.sync_credit_period(p_user_id);

  SELECT COALESCE(SUM(r.amount), 0) INTO v_rollover
    FROM public.credit_rollovers r
    WHERE r.user_id = p_user_id AND r.expires_at > now();

  RETURN QUERY
  SELECT p.slice_credits + v_rollover,
         GREATEST(p.monthly_allowance - p.period_used, 0),
         p.monthly_allowance,
         v_rollover,
         public.has_role(p_user_id, 'admin')
    FROM public.profiles p
    WHERE p.id = p_user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.credit_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_status(uuid) TO service_role;

-- Spend order: monthly allowance -> oldest rollover -> purchased packs. Admins never spend.
CREATE OR REPLACE FUNCTION public.spend_credits(p_user_id uuid, p_amount numeric)
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
  r record;
BEGIN
  PERFORM public.sync_credit_period(p_user_id);

  IF public.has_role(p_user_id, 'admin') THEN
    SELECT COALESCE(SUM(cr.amount), 0) INTO v_rollover
      FROM public.credit_rollovers cr WHERE cr.user_id = p_user_id AND cr.expires_at > now();
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

  -- Oldest (soonest-expiring) rollover first.
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

  RETURN QUERY
    SELECT p.slice_credits + v_rollover, GREATEST(p.monthly_allowance - p.period_used, 0)
      FROM public.profiles p WHERE p.id = p_user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, numeric) TO service_role;
