-- 1. Radere al suolo gli esperimenti precedenti
DROP POLICY IF EXISTS "Accesso sicuro a user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gli utenti possono leggere il proprio ruolo" ON public.user_roles;
DROP FUNCTION IF EXISTS public.get_user_role();

-- 2. La policy perfetta e a prova di bomba
CREATE POLICY "Lettura del proprio ruolo"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
