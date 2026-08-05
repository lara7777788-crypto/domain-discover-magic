CREATE TABLE IF NOT EXISTS public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  route text,
  message text NOT NULL,
  stack text,
  user_agent text,
  release text,
  user_id uuid,
  meta jsonb
);

CREATE INDEX IF NOT EXISTS error_events_occurred_at_idx ON public.error_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS error_events_kind_idx ON public.error_events (kind);

GRANT SELECT ON public.error_events TO authenticated;
GRANT ALL ON public.error_events TO service_role;
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read error events" ON public.error_events;
CREATE POLICY "Admins can read error events"
ON public.error_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.monitor_alert_state (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  notify_email text NOT NULL DEFAULT 'lara7777788@gmail.com',
  window_minutes integer NOT NULL DEFAULT 10,
  error_threshold integer NOT NULL DEFAULT 5,
  cooldown_minutes integer NOT NULL DEFAULT 60,
  last_alert_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monitor_alert_state_singleton CHECK (id = 1)
);

GRANT SELECT ON public.monitor_alert_state TO authenticated;
GRANT ALL ON public.monitor_alert_state TO service_role;
ALTER TABLE public.monitor_alert_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read monitor alert state" ON public.monitor_alert_state;
CREATE POLICY "Admins can read monitor alert state"
ON public.monitor_alert_state FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.monitor_alert_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;