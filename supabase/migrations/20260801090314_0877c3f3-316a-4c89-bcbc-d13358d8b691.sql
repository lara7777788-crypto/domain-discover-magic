REVOKE ALL ON FUNCTION public.credit_status(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_status(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.credit_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_status(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.sync_credit_period(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_credit_period(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric) FROM anon;