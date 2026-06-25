-- ============================================================================
-- Aggiunge il campo court_type alla tabella matches
-- Valori: 'indoor' | 'outdoor' | NULL (non specificato)
-- ============================================================================
ALTER TABLE public.matches
ADD COLUMN court_type text DEFAULT NULL;

-- Vincolo per garantire solo valori validi
ALTER TABLE public.matches
ADD CONSTRAINT matches_court_type_check
CHECK (court_type IS NULL OR court_type IN ('indoor', 'outdoor'));

COMMENT ON COLUMN public.matches.court_type IS 'Tipo di campo: indoor (coperto) o outdoor (scoperto). NULL = non specificato.';

