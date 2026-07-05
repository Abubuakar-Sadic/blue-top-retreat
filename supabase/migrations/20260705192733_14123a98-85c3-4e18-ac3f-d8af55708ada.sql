-- 1. Fix storage upload/update/delete policies: all staff are 'ceo', but the
--    old policies only allowed 'admin'. Use the existing capability helpers.

DROP POLICY IF EXISTS "Admins upload rooms" ON storage.objects;
DROP POLICY IF EXISTS "Admins update rooms" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete rooms" ON storage.objects;
DROP POLICY IF EXISTS "Public read rooms object" ON storage.objects;

CREATE POLICY "Public read rooms object" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'rooms');

CREATE POLICY "Staff upload rooms" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rooms' AND public.can_edit_rooms(auth.uid()));

CREATE POLICY "Staff update rooms" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'rooms' AND public.can_edit_rooms(auth.uid()));

CREATE POLICY "Staff delete rooms" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'rooms' AND public.can_edit_rooms(auth.uid()));

DROP POLICY IF EXISTS "Admins upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete event images" ON storage.objects;

CREATE POLICY "Staff upload event images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'events' AND public.can_edit_content(auth.uid()));

CREATE POLICY "Staff update event images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'events' AND public.can_edit_content(auth.uid()));

CREATE POLICY "Staff delete event images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'events' AND public.can_edit_content(auth.uid()));

-- 2. Gallery images managed from the admin dashboard (stored in the public
--    'rooms' bucket under a gallery/ folder).

CREATE TABLE public.gallery_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  label text,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published gallery images" ON public.gallery_images
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.can_edit_content(auth.uid()));

CREATE POLICY "Content staff can insert gallery images" ON public.gallery_images
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_content(auth.uid()));

CREATE POLICY "Content staff can update gallery images" ON public.gallery_images
  FOR UPDATE TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

CREATE POLICY "Content staff can delete gallery images" ON public.gallery_images
  FOR DELETE TO authenticated
  USING (public.can_edit_content(auth.uid()));

CREATE TRIGGER set_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();