
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tighten site_content: only admins can write
DROP POLICY IF EXISTS site_content_insert ON public.site_content;
DROP POLICY IF EXISTS site_content_update ON public.site_content;

CREATE POLICY "admins insert site_content" ON public.site_content
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update site_content" ON public.site_content
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bookings: anyone can create; only admins can read/update/delete
DROP POLICY IF EXISTS bookings_read ON public.bookings;
DROP POLICY IF EXISTS bookings_update ON public.bookings;
DROP POLICY IF EXISTS bookings_delete ON public.bookings;

CREATE POLICY "admins read bookings" ON public.bookings
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update bookings" ON public.bookings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete bookings" ON public.bookings
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public RPC: get booked time slots for a date (returns just time strings)
CREATE OR REPLACE FUNCTION public.get_booked_slots(_date date)
RETURNS TABLE (time_slot_time text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (time_slot->>'time')::text
  FROM public.bookings
  WHERE booking_date = _date
    AND status = 'confirmed'
    AND time_slot IS NOT NULL
$$;

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "admins upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
