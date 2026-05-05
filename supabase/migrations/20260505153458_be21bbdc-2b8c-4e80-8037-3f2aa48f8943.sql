CREATE TABLE public.daily_generations (
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.daily_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily gens: service role manages"
  ON public.daily_generations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Daily gens: owner select"
  ON public.daily_generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_generation_quota(
  p_user_id uuid,
  p_daily_free integer
)
RETURNS TABLE(source text, free_used integer, credits_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_count integer;
  v_credits integer;
BEGIN
  -- Atomically bump today's counter if under the free cap
  INSERT INTO public.daily_generations (user_id, day, count, updated_at)
    VALUES (p_user_id, v_today, 1, now())
  ON CONFLICT (user_id, day) DO UPDATE
    SET count = public.daily_generations.count + 1,
        updated_at = now()
    WHERE public.daily_generations.count < p_daily_free
  RETURNING count INTO v_count;

  IF v_count IS NOT NULL THEN
    SELECT slice_credits INTO v_credits FROM public.profiles WHERE id = p_user_id;
    source := 'free';
    free_used := v_count;
    credits_remaining := COALESCE(v_credits, 0);
    RETURN NEXT;
    RETURN;
  END IF;

  -- Free quota exhausted — try to spend a credit
  UPDATE public.profiles
    SET slice_credits = slice_credits - 1
    WHERE id = p_user_id AND slice_credits > 0
    RETURNING slice_credits INTO v_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quota_exhausted';
  END IF;

  source := 'credit';
  free_used := p_daily_free;
  credits_remaining := v_credits;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_generation_quota(uuid, integer) FROM public, anon, authenticated;