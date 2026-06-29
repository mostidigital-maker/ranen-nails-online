
CREATE OR REPLACE FUNCTION public.get_busy_ranges(_from timestamptz, _to timestamptz)
RETURNS TABLE(start_at timestamptz, end_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.appointment_at,
         a.appointment_at + (COALESCE(s.duration_minutes, 60) || ' minutes')::interval
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  WHERE a.status IN ('pending','confirmed')
    AND a.appointment_at >= _from
    AND a.appointment_at <  _to
$$;
GRANT EXECUTE ON FUNCTION public.get_busy_ranges(timestamptz, timestamptz) TO anon, authenticated;
