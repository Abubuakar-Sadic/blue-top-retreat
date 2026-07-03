-- 1. Normalize builtbyabubakar@gmail.com to the ceo role (currently legacy 'admin')
INSERT INTO public.user_roles (user_id, role)
VALUES ('2effb8a5-0fe8-406f-9671-47c035c0924d', 'ceo')
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE user_id = '2effb8a5-0fe8-406f-9671-47c035c0924d' AND role = 'admin';

-- Make sure the other two protected accounts hold the ceo role too
INSERT INTO public.user_roles (user_id, role) VALUES
  ('7a9c636a-3ec1-453c-a51c-e42a73ea66aa', 'ceo'),
  ('a6b7e7af-e731-4e0b-b405-91ed0953e86a', 'ceo')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Function identifying the permanent, protected CEO accounts
CREATE OR REPLACE FUNCTION public.is_protected_ceo(_uid uuid)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _uid IN (
    '2effb8a5-0fe8-406f-9671-47c035c0924d'::uuid,
    '7a9c636a-3ec1-453c-a51c-e42a73ea66aa'::uuid,
    'a6b7e7af-e731-4e0b-b405-91ed0953e86a'::uuid
  )
$$;

-- 3. Trigger preventing any change or removal of a protected CEO's role
CREATE OR REPLACE FUNCTION public.protect_ceo_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF public.is_protected_ceo(OLD.user_id) THEN
      RAISE EXCEPTION 'This CEO account is permanent — its role cannot be changed or removed.';
    END IF;
    RETURN OLD;
  ELSE -- UPDATE
    IF public.is_protected_ceo(OLD.user_id) THEN
      RAISE EXCEPTION 'This CEO account is permanent — its role cannot be changed or removed.';
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS protect_ceo_roles_trg ON public.user_roles;
CREATE TRIGGER protect_ceo_roles_trg
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_ceo_roles();