ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS low_slice_threshold numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS low_slice_alert_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_slice_notified_at timestamptz;