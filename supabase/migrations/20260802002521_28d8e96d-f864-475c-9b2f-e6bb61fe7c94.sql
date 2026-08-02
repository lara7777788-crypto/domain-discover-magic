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

  IF v_price IN ('business_monthly', 'business_yearly') THEN
    v_allowance := 250;
  ELSIF v_price IN ('pro_monthly', 'pro_yearly') THEN
    v_allowance := 90;
  ELSIF v_price = 'community_monthly' THEN
    v_allowance := 50;
  ELSE
    v_allowance := 0;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_profile.period_start IS NULL OR v_profile.period_start < date_trunc('month', now()) THEN
    v_unused := GREATEST(COALESCE(v_profile.monthly_allowance, 0) - COALESCE(v_profile.period_used, 0), 0);

    IF v_unused > 0 THEN
      INSERT INTO public.credit_rollovers (user_id, amount, expires_at)
      VALUES (p_user_id, v_unused, now() + interval '12 months');
    END IF;

    UPDATE public.profiles
      SET period_start = date_trunc('month', now()),
          period_used = 0,
          monthly_allowance = v_allowance
      WHERE id = p_user_id;
  ELSIF COALESCE(v_profile.monthly_allowance, 0) <> v_allowance THEN
    UPDATE public.profiles
      SET monthly_allowance = v_allowance
      WHERE id = p_user_id;
  END IF;
END;
$function$;