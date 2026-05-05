CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(p_user_id uuid, p_code text)
RETURNS TABLE(granted integer, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon record;
  v_updated_coupon uuid;
  v_new_balance integer;
BEGIN
  SELECT id, slices, max_uses, uses_count, expires_at, active
    INTO v_coupon
    FROM public.coupons
    WHERE code = p_code
    FOR UPDATE;

  IF NOT FOUND OR NOT v_coupon.active THEN
    RAISE EXCEPTION 'coupon_not_found';
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RAISE EXCEPTION 'coupon_expired';
  END IF;

  -- Atomic max_uses guard
  UPDATE public.coupons
    SET uses_count = uses_count + 1
    WHERE id = v_coupon.id
      AND (max_uses IS NULL OR uses_count < max_uses)
    RETURNING id INTO v_updated_coupon;
  IF v_updated_coupon IS NULL THEN
    RAISE EXCEPTION 'coupon_exhausted';
  END IF;

  -- Per-user uniqueness
  BEGIN
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, slices_granted)
    VALUES (v_coupon.id, p_user_id, v_coupon.slices);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'already_redeemed';
  END;

  -- Atomic credit grant
  UPDATE public.profiles
    SET slice_credits = slice_credits + v_coupon.slices
    WHERE id = p_user_id
    RETURNING slice_credits INTO v_new_balance;

  granted := v_coupon.slices;
  balance := v_new_balance;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_coupon_atomic(uuid, text) FROM public, anon, authenticated;