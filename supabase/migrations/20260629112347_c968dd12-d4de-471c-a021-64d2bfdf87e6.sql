
UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'ranen@ranennails.com';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'ranen@ranennails.com'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE role = 'user'
AND user_id IN (SELECT id FROM auth.users WHERE email = 'ranen@ranennails.com');
