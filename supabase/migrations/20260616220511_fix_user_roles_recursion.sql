-- 1. Pulizia: eliminiamo le policy che stanno causando la ricorsione infinita.
-- (Aggiungi qui eventuali altri nomi di policy di SELECT che avevi su user_roles, se ne avevi di vecchie)
DROP POLICY IF EXISTS "Gli utenti possono leggere il proprio ruolo" ON public.user_roles;

-- 2. Creiamo la funzione isolata per leggere il ruolo bypassando le RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 3. Creiamo la policy unificata sicura
CREATE POLICY "Accesso sicuro a user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    -- Consenti se l'utente sta leggendo la propria riga
    auth.uid() = user_id 
    OR 
    -- Consenti se l'utente è admin (usando la funzione anti-loop!)
    public.get_user_role() = 'admin'
);
