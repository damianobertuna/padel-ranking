-- ============================================================================
-- Allow club managers to update their own first_name and last_name
-- The existing policy only allows admins to manage club_managers.
-- This policy lets managers edit their own name fields.
-- ============================================================================
CREATE POLICY "I manager possono aggiornare il proprio nome"
ON public.club_managers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
