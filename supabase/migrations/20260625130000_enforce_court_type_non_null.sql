-- ============================================================================
-- Rimuove la possibilità di NULL per court_type
-- Aggiorna i match esistenti con NULL a 'outdoor' (default)
-- Rende il campo NOT NULL con default 'outdoor'
-- ============================================================================

-- 1. Aggiorna tutti i match con court_type = NULL a 'outdoor'
UPDATE public.matches
SET court_type = 'outdoor'
WHERE court_type IS NULL;

-- 2. Droga il vecchio constraint che permetteva NULL
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_court_type_check;

-- 3. Aggiunge il nuovo constraint che vieta NULL
ALTER TABLE public.matches
ADD CONSTRAINT matches_court_type_check
CHECK (court_type IN ('indoor', 'outdoor'));

-- 4. Imposta NOT NULL con default 'outdoor'
ALTER TABLE public.matches
ALTER COLUMN court_type SET NOT NULL;

ALTER TABLE public.matches
ALTER COLUMN court_type SET DEFAULT 'outdoor';

COMMENT ON COLUMN public.matches.court_type IS 'Tipo di campo: indoor (coperto) o outdoor (scoperto). Default: outdoor.';
