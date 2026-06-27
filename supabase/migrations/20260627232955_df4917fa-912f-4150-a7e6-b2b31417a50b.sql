-- 1) Audit log table for every staff-role change
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role app_role,
  action text NOT NULL CHECK (action IN ('granted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only CEOs may read the audit log. No INSERT/UPDATE/DELETE policy => clients
-- can never write or tamper with it; rows are written only by the SECURITY
-- DEFINER trigger below.
CREATE POLICY "CEO view role audit log"
ON public.role_audit_log
FOR SELECT TO authenticated
USING (public.is_ceo(auth.uid()));

CREATE INDEX idx_role_audit_log_created_at ON public.role_audit_log (created_at DESC);

-- 2) Trigger that records who changed whom, and when
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (actor_id, target_id, role, action)
    VALUES (auth.uid(), NEW.user_id, NEW.role, 'granted');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (actor_id, target_id, role, action)
    VALUES (auth.uid(), OLD.user_id, OLD.role, 'revoked');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_log_role_change
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- 3) Server-side guard: never allow the last CEO to be removed
CREATE OR REPLACE FUNCTION public.prevent_last_ceo_removal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.role::text IN ('ceo','admin') THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role::text IN ('ceo','admin')) <= 1 THEN
      RAISE EXCEPTION 'There must be at least one CEO at all times.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_last_ceo_removal
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_ceo_removal();