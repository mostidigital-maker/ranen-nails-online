
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;

DROP POLICY "Anyone can book" ON public.appointments;
CREATE POLICY "Anyone can book" ON public.appointments FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(client_name)) BETWEEN 1 AND 100
  AND length(trim(client_phone)) BETWEEN 6 AND 20
  AND length(service_name) BETWEEN 1 AND 100
  AND appointment_at > now()
);
