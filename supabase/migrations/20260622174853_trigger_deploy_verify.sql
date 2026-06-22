-- ============================================================================
-- Trigger deploy verification: this migration verifies that the production
-- deploy pipeline applies new migrations correctly.
-- No schema changes — purely a verification marker.
-- ============================================================================
COMMENT ON TABLE public.matches IS 'Trigger deploy verification migration applied at 2026-06-22T17:48:53Z';
