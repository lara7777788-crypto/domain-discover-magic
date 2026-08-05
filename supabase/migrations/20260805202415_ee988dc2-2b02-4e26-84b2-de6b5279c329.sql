ALTER TABLE public.monitor_alert_state
  ADD COLUMN IF NOT EXISTS realtime_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS realtime_cooldown_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS last_realtime_alert_at timestamp with time zone;