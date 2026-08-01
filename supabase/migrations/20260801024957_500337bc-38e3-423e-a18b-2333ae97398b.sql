-- ============ 1. Booking reference system (BTV-TYPE-YYYYMMDD-NNN) ============
CREATE TABLE IF NOT EXISTS public.booking_ref_counters (
  ref_date date NOT NULL,
  ref_type text NOT NULL,
  last_seq integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ref_date, ref_type)
);
GRANT ALL ON public.booking_ref_counters TO service_role;
ALTER TABLE public.booking_ref_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_booking_reference(_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE d date := (now() AT TIME ZONE 'UTC')::date; n integer;
BEGIN
  INSERT INTO public.booking_ref_counters (ref_date, ref_type, last_seq)
  VALUES (d, upper(_type), 1)
  ON CONFLICT (ref_date, ref_type)
  DO UPDATE SET last_seq = public.booking_ref_counters.last_seq + 1
  RETURNING last_seq INTO n;
  RETURN 'BTV-' || upper(_type) || '-' || to_char(d, 'YYYYMMDD') || '-' || lpad(n::text, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := public.next_booking_reference('ROOM');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_venue_reservation_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.reservation_code IS NULL OR NEW.reservation_code = '' THEN
    NEW.reservation_code := public.next_booking_reference('VENUE');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_event_reservation_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.reservation_code IS NULL OR NEW.reservation_code = '' THEN
    NEW.reservation_code := public.next_booking_reference('EVENT');
  END IF;
  RETURN NEW;
END; $$;

ALTER TABLE public.venue_reservations
  DROP CONSTRAINT IF EXISTS venue_reservations_reservation_code_key;
ALTER TABLE public.venue_reservations
  ADD CONSTRAINT venue_reservations_reservation_code_key UNIQUE (reservation_code);

-- ============ 2. Room booking fields ============
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS arrival_time text,
  ADD COLUMN IF NOT EXISTS adults integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rooms_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nights integer,
  ADD COLUMN IF NOT EXISTS airport_pickup boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS purpose_of_stay text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- ============ 3. Venue reservation fields ============
ALTER TABLE public.venue_reservations
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS preferred_venue text,
  ADD COLUMN IF NOT EXISTS decoration_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS catering_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sound_system_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photography_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- ============ 4. Event reservation fields ============
ALTER TABLE public.event_reservations
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS arrival_time text,
  ADD COLUMN IF NOT EXISTS vip_table boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bottle_reservation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS celebration_type text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- ============ 5. Notification centre ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  entity_id uuid,
  reference text,
  customer_name text,
  summary text,
  status text NOT NULL DEFAULT 'pending',
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read notifications" ON public.notifications;
CREATE POLICY "Staff can read notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can update notifications" ON public.notifications;
CREATE POLICY "Staff can update notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can delete notifications" ON public.notifications;
CREATE POLICY "Staff can delete notifications" ON public.notifications
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications (created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_new_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _type text; _ref text; _name text; _summary text; _status text;
BEGIN
  IF TG_TABLE_NAME = 'bookings' THEN
    _type := 'room_booking'; _ref := NEW.booking_code; _name := NEW.customer_name;
    _summary := 'Room booking ' || to_char(NEW.check_in, 'DD Mon') || ' - ' || to_char(NEW.check_out, 'DD Mon');
    _status := NEW.status;
  ELSIF TG_TABLE_NAME = 'venue_reservations' THEN
    _type := 'venue_reservation'; _ref := NEW.reservation_code; _name := NEW.customer_name;
    _summary := COALESCE(NEW.event_type, 'Event') || ' on ' || to_char(NEW.event_date, 'DD Mon YYYY');
    _status := NEW.status;
  ELSIF TG_TABLE_NAME = 'event_reservations' THEN
    _type := 'event_reservation'; _ref := NEW.reservation_code; _name := NEW.attendee_name;
    _summary := COALESCE(NEW.event_title, 'Event') || ' - ' || NEW.party_size || ' guest(s)';
    _status := NEW.status;
  ELSE
    _type := 'contact_message'; _ref := NULL; _name := NEW.name;
    _summary := COALESCE(NEW.subject, 'New enquiry');
    _status := 'new';
  END IF;

  INSERT INTO public.notifications (type, entity_id, reference, customer_name, summary, status)
  VALUES (_type, NEW.id, _ref, _name, _summary, _status);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS notify_booking_insert ON public.bookings;
CREATE TRIGGER notify_booking_insert AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_activity();
DROP TRIGGER IF EXISTS notify_venue_insert ON public.venue_reservations;
CREATE TRIGGER notify_venue_insert AFTER INSERT ON public.venue_reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_activity();
DROP TRIGGER IF EXISTS notify_event_res_insert ON public.event_reservations;
CREATE TRIGGER notify_event_res_insert AFTER INSERT ON public.event_reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_activity();
DROP TRIGGER IF EXISTS notify_contact_insert ON public.contact_messages;
CREATE TRIGGER notify_contact_insert AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_activity();

CREATE OR REPLACE FUNCTION public.sync_notification_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.notifications SET status = NEW.status WHERE entity_id = NEW.id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_notif_booking ON public.bookings;
CREATE TRIGGER sync_notif_booking AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_status();
DROP TRIGGER IF EXISTS sync_notif_venue ON public.venue_reservations;
CREATE TRIGGER sync_notif_venue AFTER UPDATE OF status ON public.venue_reservations
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_status();
DROP TRIGGER IF EXISTS sync_notif_event ON public.event_reservations;
CREATE TRIGGER sync_notif_event AFTER UPDATE OF status ON public.event_reservations
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_status();

-- ============ 6. Realtime ============
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.venue_reservations REPLICA IDENTITY FULL;
ALTER TABLE public.event_reservations REPLICA IDENTITY FULL;
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_reservations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reservations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============ 7. Purge test data & reset numbering ============
DELETE FROM public.payments;
DELETE FROM public.bookings;
DELETE FROM public.venue_reservations;
DELETE FROM public.event_reservations;
DELETE FROM public.contact_messages;
DELETE FROM public.notifications;
DELETE FROM public.booking_ref_counters;