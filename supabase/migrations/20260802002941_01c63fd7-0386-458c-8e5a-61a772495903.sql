ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.credit_events REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;