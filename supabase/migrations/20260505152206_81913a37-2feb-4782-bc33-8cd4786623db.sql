-- Atomic spend slice credit + unlock design
CREATE OR REPLACE FUNCTION public.spend_slice_credit(p_user_id uuid, p_slice_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining integer;
  updated_design uuid;
BEGIN
  UPDATE public.profiles
    SET slice_credits = slice_credits - 1
    WHERE id = p_user_id AND slice_credits > 0
    RETURNING slice_credits INTO remaining;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  UPDATE public.designs
    SET is_unlocked = true
    WHERE id = p_slice_id AND user_id = p_user_id
    RETURNING id INTO updated_design;
  IF updated_design IS NULL THEN
    RAISE EXCEPTION 'design_not_found';
  END IF;

  RETURN remaining;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spend_slice_credit(uuid, uuid) FROM public, anon, authenticated;

-- Atomic grant slice credits
CREATE OR REPLACE FUNCTION public.grant_slice_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total integer;
BEGIN
  UPDATE public.profiles
    SET slice_credits = slice_credits + p_amount
    WHERE id = p_user_id
    RETURNING slice_credits INTO new_total;
  RETURN new_total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_slice_credits(uuid, integer) FROM public, anon, authenticated;

-- Webhook event deduplication
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  stripe_event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook events: service role manages"
  ON public.processed_webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
