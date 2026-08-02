-- Multiple internal notes per reservation
CREATE TABLE public.reservation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('booking','venue_reservation','event_reservation','contact_message')),
  entity_id uuid NOT NULL,
  note text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation_notes TO authenticated;
GRANT ALL ON public.reservation_notes TO service_role;
ALTER TABLE public.reservation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read reservation notes" ON public.reservation_notes
  FOR SELECT TO authenticated USING (public.can_view_operations(auth.uid()));
CREATE POLICY "Staff can add reservation notes" ON public.reservation_notes
  FOR INSERT TO authenticated WITH CHECK (public.can_view_operations(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "Authors or managers can edit notes" ON public.reservation_notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_manager_or_above(auth.uid()));
CREATE POLICY "Authors or managers can delete notes" ON public.reservation_notes
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_manager_or_above(auth.uid()));

CREATE TRIGGER set_reservation_notes_updated_at
  BEFORE UPDATE ON public.reservation_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_reservation_notes_entity ON public.reservation_notes (entity_type, entity_id, created_at DESC);

-- Reservation timeline
CREATE TABLE public.reservation_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('booking','venue_reservation','event_reservation','contact_message')),
  entity_id uuid NOT NULL,
  event text NOT NULL,
  detail text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reservation_timeline TO authenticated;
GRANT ALL ON public.reservation_timeline TO service_role;
ALTER TABLE public.reservation_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read timeline" ON public.reservation_timeline
  FOR SELECT TO authenticated USING (public.can_view_operations(auth.uid()));
CREATE POLICY "Staff can add timeline entries" ON public.reservation_timeline
  FOR INSERT TO authenticated WITH CHECK (public.can_view_operations(auth.uid()));

CREATE INDEX idx_reservation_timeline_entity ON public.reservation_timeline (entity_type, entity_id, created_at);

-- Record submissions + status changes automatically
CREATE OR REPLACE FUNCTION public.log_reservation_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _etype text;
BEGIN
  IF TG_TABLE_NAME = 'bookings' THEN _etype := 'booking';
  ELSIF TG_TABLE_NAME = 'venue_reservations' THEN _etype := 'venue_reservation';
  ELSE _etype := 'event_reservation';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reservation_timeline (entity_type, entity_id, event, detail)
    VALUES (_etype, NEW.id, 'submitted', 'Reservation received from the website');
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.reservation_timeline (entity_type, entity_id, event, detail, actor_id)
    VALUES (_etype, NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status, auth.uid());
  END IF;

  IF TG_TABLE_NAME = 'bookings'
     AND NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.reservation_timeline (entity_type, entity_id, event, detail, actor_id)
    VALUES (_etype, NEW.id, 'payment_received', 'Payment marked as received', auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_timeline_bookings
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_reservation_timeline();
CREATE TRIGGER trg_timeline_venue
  AFTER INSERT OR UPDATE ON public.venue_reservations
  FOR EACH ROW EXECUTE FUNCTION public.log_reservation_timeline();
CREATE TRIGGER trg_timeline_event_res
  AFTER INSERT OR UPDATE ON public.event_reservations
  FOR EACH ROW EXECUTE FUNCTION public.log_reservation_timeline();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_timeline;