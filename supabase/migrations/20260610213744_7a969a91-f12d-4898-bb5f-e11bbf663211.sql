DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_messages') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'event_reservations') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.event_reservations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'venue_reservations') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.venue_reservations;
  END IF;
END $$;