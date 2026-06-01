-- 1. Update room booking code prefix to BOKR
CREATE OR REPLACE FUNCTION public.set_booking_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := 'BOKR-' || lpad(nextval('public.booking_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Update event attendance reservation code prefix to BKA
CREATE OR REPLACE FUNCTION public.set_event_reservation_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reservation_code IS NULL OR NEW.reservation_code = '' THEN
    NEW.reservation_code := 'BKA-' || lpad(nextval('public.event_reservation_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Venue reservations (host an event) with BKE prefix
CREATE SEQUENCE IF NOT EXISTS public.venue_reservation_code_seq START 1;

CREATE TABLE public.venue_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_code text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  event_type text NOT NULL,
  event_date date NOT NULL,
  guest_count integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.venue_reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_reservations TO authenticated;
GRANT ALL ON public.venue_reservations TO service_role;

ALTER TABLE public.venue_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create venue reservations"
ON public.venue_reservations FOR INSERT TO public
WITH CHECK ((length(customer_name) > 0) AND (length(customer_phone) > 0) AND (guest_count > 0));

CREATE POLICY "Admins view venue reservations"
ON public.venue_reservations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update venue reservations"
ON public.venue_reservations FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete venue reservations"
ON public.venue_reservations FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE FUNCTION public.set_venue_reservation_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reservation_code IS NULL OR NEW.reservation_code = '' THEN
    NEW.reservation_code := 'BKE-' || lpad(nextval('public.venue_reservation_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_set_venue_reservation_code
BEFORE INSERT ON public.venue_reservations
FOR EACH ROW EXECUTE FUNCTION public.set_venue_reservation_code();

CREATE TRIGGER trg_venue_reservations_updated_at
BEFORE UPDATE ON public.venue_reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.venue_reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_reservations;

-- 4. Sync payment when a booking is marked completed
CREATE OR REPLACE FUNCTION public.sync_booking_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' THEN
    NEW.payment_status := 'paid';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_sync_booking_payment_status
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_payment_status();

CREATE OR REPLACE FUNCTION public.create_payment_on_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payment_status = 'paid'
     AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payments
      WHERE booking_id = NEW.id AND status = 'successful'
    ) THEN
      INSERT INTO public.payments (booking_id, amount, status, payment_method, paid_at)
      VALUES (NEW.id, COALESCE(NEW.total_amount, 0), 'successful', 'manual', now());
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_create_payment_on_paid
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_payment_on_paid();