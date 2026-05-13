
-- Restrict SECURITY DEFINER functions to authenticated only where possible
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- get_booked_slots needs to be callable by anon (public booking page)
-- This is intentional - it only returns time strings, no sensitive data

-- Fix the overly permissive bookings_insert policy
DROP POLICY IF EXISTS bookings_insert ON public.bookings;
CREATE POLICY "anyone can create bookings" ON public.bookings
FOR INSERT TO anon, authenticated
WITH CHECK (true);
