
-- 1. Fix profiles privilege escalation: prevent users from updating billing fields
DROP POLICY IF EXISTS "Profiles: owner update" ON public.profiles;
CREATE POLICY "Profiles: owner update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_pro = (SELECT is_pro FROM public.profiles WHERE id = auth.uid())
  AND pro_until IS NOT DISTINCT FROM (SELECT pro_until FROM public.profiles WHERE id = auth.uid())
  AND slice_credits = (SELECT slice_credits FROM public.profiles WHERE id = auth.uid())
);

-- 2. Drop coupons authenticated read policy (server-side redeem only)
DROP POLICY IF EXISTS "Coupons: authenticated read active" ON public.coupons;

-- 3. Revoke execute on SECURITY DEFINER functions from regular users
REVOKE EXECUTE ON FUNCTION public.current_user_is_pro(text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
