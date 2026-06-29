
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed boolean NOT NULL DEFAULT false,
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '19:00',
  slot_step_minutes int NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_hours TO anon, authenticated;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads hours" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage hours" ON public.business_hours FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_business_hours_updated BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.business_hours (day_of_week, is_closed, open_time, close_time) VALUES
  (0,false,'09:00','19:00'),(1,false,'09:00','19:00'),(2,false,'09:00','19:00'),
  (3,false,'09:00','19:00'),(4,false,'09:00','19:00'),(5,false,'09:00','15:00'),
  (6,true,'09:00','19:00');

CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
GRANT SELECT ON public.blocked_slots TO anon, authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads blocks" ON public.blocked_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage blocks" ON public.blocked_slots FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
