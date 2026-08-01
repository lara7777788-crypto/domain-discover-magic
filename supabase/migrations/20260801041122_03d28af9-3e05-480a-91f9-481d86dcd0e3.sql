ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS copy_text TEXT;

UPDATE public.designs
SET mode = COALESCE(mode, data->>'mode', CASE WHEN preview_url IS NOT NULL THEN 'image' ELSE NULL END),
    copy_text = COALESCE(copy_text, CASE WHEN data->>'mode' = 'copy' THEN data->'result'->>'copy' ELSE NULL END)
WHERE mode IS NULL OR copy_text IS NULL;