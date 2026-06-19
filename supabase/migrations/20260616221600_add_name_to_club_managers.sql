-- ============================================================================
-- Add first_name and last_name columns to club_managers
-- This stores the manager's real name directly, avoiding dependency on
-- auth.users metadata which is often empty for invited users.
-- ============================================================================
ALTER TABLE public.club_managers
    ADD COLUMN first_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
