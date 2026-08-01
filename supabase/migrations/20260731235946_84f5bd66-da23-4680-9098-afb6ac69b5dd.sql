INSERT INTO public.coupons (code, slices, max_uses, active, note) VALUES
  ('SWEET30', 30, 100, true, 'Promo: 30 slices'),
  ('SWEET50', 50, 100, true, 'Promo: 50 slices'),
  ('HOP100', 100, 50, true, 'Promo: 100 slices')
ON CONFLICT (code) DO UPDATE SET slices = EXCLUDED.slices, max_uses = EXCLUDED.max_uses, active = true, note = EXCLUDED.note, updated_at = now();