-- Add event type and recurrence support to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS recurrence_days integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recurrence_time time without time zone;

-- One-time events keep using event_at; recurring events rely on recurrence_days/time,
-- so event_at must be allowed to be empty for recurring events.
ALTER TABLE public.events ALTER COLUMN event_at DROP NOT NULL;

-- Validate event configuration depending on its type
CREATE OR REPLACE FUNCTION public.validate_event_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'one_time' THEN
    IF NEW.event_at IS NULL THEN
      RAISE EXCEPTION 'One-time events require a date and time.';
    END IF;
  ELSIF NEW.event_type = 'recurring' THEN
    IF array_length(NEW.recurrence_days, 1) IS NULL OR NEW.recurrence_time IS NULL THEN
      RAISE EXCEPTION 'Recurring events require at least one day and a time.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid event type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_event_schedule ON public.events;
CREATE TRIGGER trg_validate_event_schedule
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_schedule();

-- Auto-archive: hide one-time events whose date has already passed
CREATE OR REPLACE FUNCTION public.archive_past_events()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.events
  SET is_public = false
  WHERE event_type = 'one_time'
    AND is_public = true
    AND event_at IS NOT NULL
    AND event_at < now();
$$;