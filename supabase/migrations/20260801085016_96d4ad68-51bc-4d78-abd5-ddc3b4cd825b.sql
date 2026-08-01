DROP POLICY "Profiles: owner update" ON public.profiles;

ALTER TABLE public.profiles
  ALTER COLUMN slice_credits TYPE numeric(10,2) USING slice_credits::numeric,
  ADD COLUMN IF NOT EXISTS monthly_allowance numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_used numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_start date NOT NULL DEFAULT date_trunc('month', now())::date;

CREATE POLICY "Profiles: owner update" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_pro = (SELECT p.is_pro FROM public.profiles p WHERE p.id = auth.uid())
  AND NOT (pro_until IS DISTINCT FROM (SELECT p.pro_until FROM public.profiles p WHERE p.id = auth.uid()))
  AND slice_credits = (SELECT p.slice_credits FROM public.profiles p WHERE p.id = auth.uid())
  AND monthly_allowance = (SELECT p.monthly_allowance FROM public.profiles p WHERE p.id = auth.uid())
  AND period_used = (SELECT p.period_used FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.sync_credit_period(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_allowance numeric(10,2) := 0;
  v_price text;
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

  UPDATE public.profiles
    SET monthly_allowance = v_allowance,
        period_used = CASE WHEN period_start < date_trunc('month', now())::date THEN 0 ELSE period_used END,
        period_start = CASE WHEN period_start < date_trunc('month', now())::date THEN date_trunc('month', now())::date ELSE period_start END
    WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_status(p_user_id uuid)
RETURNS TABLE(balance numeric, monthly_remaining numeric, monthly_allowance numeric, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.sync_credit_period(p_user_id);
  RETURN QUERY
  SELECT p.slice_credits,
         GREATEST(p.monthly_allowance - p.period_used, 0),
         p.monthly_allowance,
         public.has_role(p_user_id, 'admin')
    FROM public.profiles p
    WHERE p.id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_credits(p_user_id uuid, p_amount numeric)
RETURNS TABLE(balance numeric, monthly_remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric(10,2) := GREATEST(COALESCE(p_amount, 1), 0);
  v_monthly_left numeric(10,2);
  v_from_monthly numeric(10,2);
  v_from_balance numeric(10,2);
BEGIN
  PERFORM public.sync_credit_period(p_user_id);

  IF public.has_role(p_user_id, 'admin') THEN
    RETURN QUERY
      SELECT p.slice_credits, GREATEST(p.monthly_allowance - p.period_used, 0)
        FROM public.profiles p WHERE p.id = p_user_id;
    RETURN;
  END IF;

  SELECT GREATEST(p.monthly_allowance - p.period_used, 0) INTO v_monthly_left
    FROM public.profiles p WHERE p.id = p_user_id FOR UPDATE;

  IF v_monthly_left IS NULL THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  v_from_monthly := LEAST(v_monthly_left, v_amount);
  v_from_balance := v_amount - v_from_monthly;

  UPDATE public.profiles p
    SET period_used = p.period_used + v_from_monthly,
        slice_credits = p.slice_credits - v_from_balance
    WHERE p.id = p_user_id AND p.slice_credits >= v_from_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  RETURN QUERY
    SELECT p.slice_credits, GREATEST(p.monthly_allowance - p.period_used, 0)
      FROM public.profiles p WHERE p.id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_credit_period(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_credit_period(uuid) TO service_role;