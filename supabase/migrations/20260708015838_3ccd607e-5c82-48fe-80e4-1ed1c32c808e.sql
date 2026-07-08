ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Seed existing rooms with a sensible order based on current price ordering
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY price_per_night ASC, created_at ASC) AS rn
  FROM public.rooms
)
UPDATE public.rooms r
SET display_order = o.rn
FROM ordered o
WHERE r.id = o.id AND r.display_order = 0;

CREATE INDEX IF NOT EXISTS idx_rooms_display_order ON public.rooms (display_order);