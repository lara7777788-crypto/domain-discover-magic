REVOKE ALL ON FUNCTION public.spend_credits(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.grant_slice_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_slice_credits(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.redeem_coupon_atomic(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_atomic(uuid, text) TO service_role;