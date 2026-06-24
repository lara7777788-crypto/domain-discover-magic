DROP POLICY "Designs: owner update" ON public.designs;
CREATE POLICY "Designs: owner update" ON public.designs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_unlocked IS NOT DISTINCT FROM (
      SELECT d.is_unlocked FROM public.designs d WHERE d.id = designs.id
    )
  );