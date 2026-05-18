
-- Fix set_updated_at search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke EXECUTE on internal funcs from anon/auth (triggers still work; only direct API blocked)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- Tighten storage: prevent listing all files; allow read only on individual objects already covered.
DROP POLICY IF EXISTS "Public read rooms bucket" ON storage.objects;
CREATE POLICY "Public read rooms object" ON storage.objects
  FOR SELECT USING (bucket_id = 'rooms' AND (storage.foldername(name))[1] IS NOT NULL);

-- Tighten bookings/contact_messages insert (require basic non-empty fields)
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT
  WITH CHECK (length(customer_name) > 0 AND length(customer_phone) > 0 AND check_in <= check_out);

DROP POLICY IF EXISTS "Anyone can send messages" ON public.contact_messages;
CREATE POLICY "Anyone can send messages" ON public.contact_messages FOR INSERT
  WITH CHECK (length(name) > 0 AND length(message) > 0);
