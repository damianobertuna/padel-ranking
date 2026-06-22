-- Abilitazione RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_managers ENABLE ROW LEVEL SECURITY;

-- Policy per user_roles: un utente può leggere solo il proprio ruolo
CREATE POLICY "Gli utenti possono leggere il proprio ruolo"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy per club_managers: un manager può leggere solo la propria assegnazione
CREATE POLICY "I manager possono leggere la propria assegnazione"
ON public.club_managers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
