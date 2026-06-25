-- ============================================================================
-- Fix: La policy "Admins can manage club_managers" non funziona perché
-- gli admin sono identificati tramite players.role, non user_roles.
-- L'admin potrebbe non avere una riga in user_roles.
-- ============================================================================

-- Drop vecchia policy che usava solo user_roles
DROP POLICY IF EXISTS "Admins can manage club_managers" ON public.club_managers;

-- Nuova policy: admin identificati tramite players.role
CREATE POLICY "Admins can manage club_managers"
ON public.club_managers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.players
        WHERE players.user_id = auth.uid()
        AND players.role = 'admin'
    )
);
