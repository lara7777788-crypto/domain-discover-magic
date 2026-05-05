CREATE OR REPLACE FUNCTION public.spend_generation_credit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
BEGIN
  UPDATE public.profiles
    SET slice_credits = slice_credits - 1
    WHERE id = p_user_id AND slice_credits > 0
    RETURNING slice_credits INTO v_remaining;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_credits';
  END IF;
  RETURN v_remaining;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spend_generation_credit(uuid) FROM public, anon, authenticated;

-- One free slice per new account, for life
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (id, email, display_name, slice_credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    1
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

DROP FUNCTION IF EXISTS public.consume_generation_quota(uuid, integer);
DROP TABLE IF EXISTS public.daily_generations;