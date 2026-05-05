CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles: owner select"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Roles: service role manages"
  ON public.user_roles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Admins skip credit spend
CREATE OR REPLACE FUNCTION public.spend_generation_credit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF public.has_role(p_user_id, 'admin') THEN
    SELECT slice_credits INTO v_remaining FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_remaining, 0);
  END IF;

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

-- Grant admin to the founder account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
  FROM auth.users
  WHERE lower(email) = 'lara7777788@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;