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

  IF v_price IN ('pro_monthly', 'pro_yearly') THEN
    v_allowance := 90;
  ELSE
    v_allowance := 0;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_profile.period_start < date_trunc('month', now())::date THEN
    v_unused := GREATEST(v_profile.monthly_allowance - v_profile.period_used, 0);
    IF v_unused > 0 THEN
      INSERT INTO public.credit_rollovers (user_id, amount, granted_for, expires_at)
      VALUES (p_user_id, v_unused, v_profile.period_start, v_profile.period_start::timestamptz + interval '1 year')
      ON CONFLICT (user_id, granted_for)
      DO UPDATE SET amount = public.credit_rollovers.amount + EXCLUDED.amount;
    END IF;
  END IF;

  DELETE FROM public.credit_rollovers
    WHERE user_id = p_user_id AND (expires_at <= now() OR amount <= 0);

  UPDATE public.profiles
    SET monthly_allowance = v_allowance,
        period_used = CASE WHEN period_start < date_trunc('month', now())::date THEN 0 ELSE period_used END,
        period_start = CASE WHEN period_start < date_trunc('month', now())::date THEN date_trunc('month', now())::date ELSE period_start END
    WHERE id = p_user_id;
END;
$function$;

-- Backfill active yearly subscribers to the corrected 90 slice/month allowance.
UPDATE public.profiles p
   SET monthly_allowance = 90
 WHERE EXISTS (
   SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.price_id = 'pro_yearly'
      AND s.status IN ('active', 'trialing')
 );