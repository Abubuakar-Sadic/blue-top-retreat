-- Helper functions (text comparison keeps them safe and future-proof)
CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role::text IN ('admin','ceo','manager','receptionist')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_above(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role::text IN ('admin','ceo','manager')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_manager_or_above(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_above(uuid) TO authenticated;

-- BOOKINGS: all staff view/update, managers+ delete
DROP POLICY IF EXISTS "Admins view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins delete bookings" ON public.bookings;
CREATE POLICY "Staff view bookings" ON public.bookings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Managers delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.is_manager_or_above(auth.uid()));

-- EVENT RESERVATIONS
DROP POLICY IF EXISTS "Admins view event reservations" ON public.event_reservations;
DROP POLICY IF EXISTS "Admins update event reservations" ON public.event_reservations;
DROP POLICY IF EXISTS "Admins delete event reservations" ON public.event_reservations;
CREATE POLICY "Staff view event reservations" ON public.event_reservations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update event reservations" ON public.event_reservations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Managers delete event reservations" ON public.event_reservations FOR DELETE TO authenticated USING (public.is_manager_or_above(auth.uid()));

-- VENUE RESERVATIONS
DROP POLICY IF EXISTS "Admins view venue reservations" ON public.venue_reservations;
DROP POLICY IF EXISTS "Admins update venue reservations" ON public.venue_reservations;
DROP POLICY IF EXISTS "Admins delete venue reservations" ON public.venue_reservations;
CREATE POLICY "Staff view venue reservations" ON public.venue_reservations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update venue reservations" ON public.venue_reservations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Managers delete venue reservations" ON public.venue_reservations FOR DELETE TO authenticated USING (public.is_manager_or_above(auth.uid()));

-- CONTACT MESSAGES
DROP POLICY IF EXISTS "Admins view messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins delete messages" ON public.contact_messages;
CREATE POLICY "Staff view messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Managers delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_manager_or_above(auth.uid()));

-- ROOMS: managers+ manage, public still views
DROP POLICY IF EXISTS "Admins manage rooms" ON public.rooms;
CREATE POLICY "Managers manage rooms" ON public.rooms FOR ALL TO authenticated USING (public.is_manager_or_above(auth.uid())) WITH CHECK (public.is_manager_or_above(auth.uid()));

-- EVENTS: managers+ manage, public still views public events
DROP POLICY IF EXISTS "Admins view all events" ON public.events;
DROP POLICY IF EXISTS "Admins insert events" ON public.events;
DROP POLICY IF EXISTS "Admins update events" ON public.events;
DROP POLICY IF EXISTS "Admins delete events" ON public.events;
CREATE POLICY "Managers manage events" ON public.events FOR ALL TO authenticated USING (public.is_manager_or_above(auth.uid())) WITH CHECK (public.is_manager_or_above(auth.uid()));

-- PAYMENTS: keep admin manage, add manager view
CREATE POLICY "Managers view payments" ON public.payments FOR SELECT TO authenticated USING (public.is_manager_or_above(auth.uid()));