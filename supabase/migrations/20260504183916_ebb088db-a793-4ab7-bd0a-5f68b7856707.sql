
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL,
  target_type text NOT NULL DEFAULT 'general',
  target_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit reviews" ON public.reviews
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');

CREATE POLICY "anyone reads approved reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE POLICY "admins read all reviews" ON public.reviews
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete reviews" ON public.reviews
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_target ON public.reviews(target_type, target_id);
