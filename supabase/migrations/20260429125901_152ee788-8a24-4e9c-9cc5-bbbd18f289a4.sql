-- Singleton site content
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  assets JSONB NOT NULL DEFAULT '{}'::jsonb,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content_read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site_content_insert" ON public.site_content FOR INSERT WITH CHECK (true);
CREATE POLICY "site_content_update" ON public.site_content FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS site_content_touch ON public.site_content;
CREATE TRIGGER site_content_touch BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.site_content REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;

INSERT INTO public.site_content (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  comments TEXT,
  booking_date DATE NOT NULL,
  time_slot JSONB,
  program JSONB,
  animators JSONB NOT NULL DEFAULT '[]'::jsonb,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_read" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "bookings_update" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "bookings_delete" ON public.bookings FOR DELETE USING (true);

DROP TRIGGER IF EXISTS bookings_touch ON public.bookings;
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();