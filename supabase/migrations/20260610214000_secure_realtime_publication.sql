-- Security fix: stop broadcasting sensitive customer data over Realtime.
-- Tables containing names, emails, phone numbers and private messages are
-- removed from the supabase_realtime publication so they can no longer be
-- streamed to subscribers. Admin pages still load this data on demand via
-- RLS-protected SELECT queries. Public, non-sensitive tables (rooms, events)
-- remain published for live website updates.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'event_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.event_reservations;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'venue_reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.venue_reservations;
  END IF;
END $$;
