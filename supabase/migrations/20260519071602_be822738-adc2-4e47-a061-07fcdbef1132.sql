-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_at timestamptz NOT NULL,
  location text,
  image_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public events"
  ON public.events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins view all events"
  ON public.events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'events');

CREATE POLICY "Admins upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'events' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'events' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'events' AND has_role(auth.uid(), 'admin'::app_role));