-- 1. New roles (text comparisons below keep everything safe alongside new enum values)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reports_viewer';

-- 2. Permission helper functions
CREATE OR REPLACE FUNCTION public.is_ceo(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text IN ('admin','ceo'))
$$;

CREATE OR REPLACE FUNCTION public.can_edit_content(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text IN ('admin','ceo','manager','content_editor'))
$$;

CREATE OR REPLACE FUNCTION public.can_edit_rooms(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text IN ('admin','ceo','manager','receptionist','content_editor'))
$$;

CREATE OR REPLACE FUNCTION public.can_view_operations(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text IN ('admin','ceo','manager','receptionist','reports_viewer'))
$$;

CREATE OR REPLACE FUNCTION public.can_view_reports(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text IN ('admin','ceo','reports_viewer'))
$$;

-- 3. RLS policy updates

-- bookings: reports viewer can read for analytics (edit stays restricted to staff)
DROP POLICY IF EXISTS "Staff view bookings" ON public.bookings;
CREATE POLICY "Staff view bookings" ON public.bookings FOR SELECT TO authenticated USING (public.can_view_operations(auth.uid()));

-- event reservations
DROP POLICY IF EXISTS "Staff view event reservations" ON public.event_reservations;
CREATE POLICY "Staff view event reservations" ON public.event_reservations FOR SELECT TO authenticated USING (public.can_view_operations(auth.uid()));

-- venue reservations
DROP POLICY IF EXISTS "Staff view venue reservations" ON public.venue_reservations;
CREATE POLICY "Staff view venue reservations" ON public.venue_reservations FOR SELECT TO authenticated USING (public.can_view_operations(auth.uid()));

-- events: content editors may manage events
DROP POLICY IF EXISTS "Managers manage events" ON public.events;
CREATE POLICY "Content team manage events" ON public.events FOR ALL TO authenticated USING (public.can_edit_content(auth.uid())) WITH CHECK (public.can_edit_content(auth.uid()));

-- rooms: reception + content editors may update room details/content
DROP POLICY IF EXISTS "Managers manage rooms" ON public.rooms;
CREATE POLICY "Staff manage rooms" ON public.rooms FOR ALL TO authenticated USING (public.can_edit_rooms(auth.uid())) WITH CHECK (public.can_edit_rooms(auth.uid()));

-- payments: CEO manages; CEO + reports viewer can read; managers no longer have financial access
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "CEO manage payments" ON public.payments FOR ALL TO authenticated USING (public.is_ceo(auth.uid())) WITH CHECK (public.is_ceo(auth.uid()));
DROP POLICY IF EXISTS "Managers view payments" ON public.payments;
CREATE POLICY "Finance view payments" ON public.payments FOR SELECT TO authenticated USING (public.can_view_reports(auth.uid()));

-- user_roles: CEOs (not just legacy admin) manage role assignments
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "CEO manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_ceo(auth.uid())) WITH CHECK (public.is_ceo(auth.uid()));

-- profiles: CEO (staff mgmt) + reports viewer (user analytics) can view all profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Privileged view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.can_view_reports(auth.uid()) OR auth.uid() = id);