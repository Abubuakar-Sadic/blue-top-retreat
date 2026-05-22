
-- Sequences for human-friendly codes
CREATE SEQUENCE IF NOT EXISTS public.booking_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.event_reservation_code_seq START 1;

-- bookings: add booking_code column
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_code text UNIQUE;

CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := 'BOK-' || lpad(nextval('public.booking_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_code ON public.bookings;
CREATE TRIGGER trg_set_booking_code
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_code();

-- Backfill existing rows
UPDATE public.bookings
SET booking_code = 'BOK-' || lpad(nextval('public.booking_code_seq')::text, 6, '0')
WHERE booking_code IS NULL;

-- event_reservations table
CREATE TABLE IF NOT EXISTS public.event_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code text UNIQUE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  event_title text,
  attendee_name text NOT NULL,
  attendee_phone text NOT NULL,
  attendee_email text,
  party_size integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_event_reservation_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reservation_code IS NULL OR NEW.reservation_code = '' THEN
    NEW.reservation_code := 'BKE-' || lpad(nextval('public.event_reservation_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_event_reservation_code ON public.event_reservations;
CREATE TRIGGER trg_set_event_reservation_code
BEFORE INSERT ON public.event_reservations
FOR EACH ROW EXECUTE FUNCTION public.set_event_reservation_code();

DROP TRIGGER IF EXISTS trg_event_reservations_updated ON public.event_reservations;
CREATE TRIGGER trg_event_reservations_updated
BEFORE UPDATE ON public.event_reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.event_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create event reservations" ON public.event_reservations;
CREATE POLICY "Anyone can create event reservations"
  ON public.event_reservations FOR INSERT TO public
  WITH CHECK (length(attendee_name) > 0 AND length(attendee_phone) > 0 AND party_size > 0);

DROP POLICY IF EXISTS "Admins view event reservations" ON public.event_reservations;
CREATE POLICY "Admins view event reservations"
  ON public.event_reservations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update event reservations" ON public.event_reservations;
CREATE POLICY "Admins update event reservations"
  ON public.event_reservations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete event reservations" ON public.event_reservations;
CREATE POLICY "Admins delete event reservations"
  ON public.event_reservations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed legacy rooms if rooms table is empty
INSERT INTO public.rooms (room_name, slug, room_type, description, price_per_night, capacity, amenities, is_available)
SELECT * FROM (VALUES
  ('Standard Room','standard-room','Standard','Comfortable twin beds with modern amenities, perfect for business travelers and short stays.',350,2,ARRAY['Free Wi-Fi','Air Conditioning','Flat-screen TV','Private Bathroom','24/7 Security'],true),
  ('Deluxe Room','deluxe-room','Deluxe','Spacious king-size bedroom with premium furnishings, city views, and a luxurious en-suite bathroom.',550,2,ARRAY['Free Wi-Fi','Air Conditioning','Smart TV','Coffee Maker','Luxury Bathroom','Free Parking'],true),
  ('Executive Suite','executive-suite','Suite','Our finest accommodation featuring a separate living area, premium décor, and VIP amenities.',850,3,ARRAY['High-speed Wi-Fi','Climate Control','65" Smart TV','Nespresso Machine','Spa Bathroom','VIP Parking','In-room Dining','24/7 Concierge'],true)
) AS v(room_name,slug,room_type,description,price_per_night,capacity,amenities,is_available)
WHERE NOT EXISTS (SELECT 1 FROM public.rooms);

-- Realtime
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER TABLE public.event_reservations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reservations; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
