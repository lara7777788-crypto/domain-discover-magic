CREATE TABLE public.layer_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  layer text NOT NULL CHECK (layer IN ('wish','visual','text','layout','logo')),
  label text NOT NULL DEFAULT 'Untitled chip',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.layer_chips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chips: owner select" ON public.layer_chips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Chips: owner insert" ON public.layer_chips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Chips: owner update" ON public.layer_chips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Chips: owner delete" ON public.layer_chips FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX layer_chips_user_layer_idx ON public.layer_chips (user_id, layer, updated_at DESC);

CREATE TRIGGER layer_chips_set_updated_at
BEFORE UPDATE ON public.layer_chips
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();