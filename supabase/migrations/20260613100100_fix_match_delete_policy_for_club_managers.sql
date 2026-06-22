-- ============================================================================
-- Fix RLS policy on matches DELETE to allow club_managers to delete matches
-- ============================================================================
-- The current policy "Consentito eliminare i propri match in programma" only
-- allows deletion if the user has a row in `players` linked to the match.
-- Club managers (who may have no `players` row) are silently blocked by RLS.
-- 
-- This policy adds a second condition: the user can delete a pending match
-- if they are a club_manager assigned to the match's club.

DROP POLICY IF EXISTS "Consentito eliminare i propri match in programma" ON public.matches;

CREATE POLICY "Consentito eliminare i propri match in programma" ON public.matches
    FOR DELETE TO authenticated
    USING (
        status = 'pending'::text
        AND (
            -- Existing condition: user has a player profile linked to the match or is admin
            EXISTS (
                SELECT 1
                FROM public.players
                WHERE players.user_id = auth.uid()
                    AND (
                        players.id = matches.team_a_left_id
                        OR players.id = matches.team_a_right_id
                        OR players.id = matches.team_b_left_id
                        OR players.id = matches.team_b_right_id
                        OR players.role = 'admin'::text
                    )
            )
            OR
            -- New condition: user is a club_manager assigned to the match's club
            EXISTS (
                SELECT 1
                FROM public.club_managers
                WHERE club_managers.user_id = auth.uid()
                    AND club_managers.club_id = matches.club_id
            )
        )
    );
