CREATE OR REPLACE FUNCTION public.spend_slice_credit(p_user_id uuid, p_slice_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  remaining integer;
  updated_design uuid;
BEGIN
  IF public.has_role(p_user_id, 'admin') THEN
    SELECT slice_credits INTO remaining FROM public.profiles WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
      SET slice_credits = slice_credits - 1
      WHERE id = p_user_id AND slice_credits > 0
      RETURNING slice_credits INTO remaining;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'no_credits';
    END IF;
  END IF;

  UPDATE public.designs
    SET is_unlocked = true
    WHERE id = p_slice_id AND user_id = p_user_id
    RETURNING id INTO updated_design;
  IF updated_design IS NULL THEN
    RAISE EXCEPTION 'design_not_found';
  END IF;

  RETURN COALESCE(remaining, 0);
END;
$function$;