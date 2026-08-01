CREATE OR REPLACE FUNCTION public.credit_status(p_user_id uuid)
RETURNS TABLE(balance numeric, monthly_remaining numeric, monthly_allowance numeric, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

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

REVOKE ALL ON FUNCTION public.credit_status(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_credit_period(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_credit_period(uuid) TO service_role;