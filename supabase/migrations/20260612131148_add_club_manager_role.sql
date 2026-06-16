-- 1. Aggiornamento del vincolo 'players_role_check'
-- Rimuoviamo il vecchio vincolo binario
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_role_check;

-- Creiamo il nuovo vincolo che include 'club_manager'
ALTER TABLE public.players ADD CONSTRAINT players_role_check 
CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'club_manager'::text])));

-- 2. Creazione della tabella ponte 'club_managers'
-- Usiamo BIGINT per player_id e club_id per matchare esattamente l'identity type
CREATE TABLE IF NOT EXISTS public.club_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id BIGINT REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    club_id BIGINT REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Constraint per evitare che un manager venga assegnato due volte allo stesso circolo
    CONSTRAINT unique_player_club UNIQUE(player_id, club_id)
);

-- 3. Abilitazione della Row Level Security (RLS)
ALTER TABLE public.club_managers ENABLE ROW LEVEL SECURITY;

-- 4. Policy di sicurezza
-- Gli Admin (verificati tramite la tabella players) hanno controllo totale sulle assegnazioni
CREATE POLICY "Admins can do everything on club_managers" 
ON public.club_managers FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.players WHERE user_id = auth.uid() AND role = 'admin')
);

-- Tutti gli utenti autenticati possono leggere chi gestisce cosa (necessario per l'UI)
CREATE POLICY "Everyone can view club_managers" 
ON public.club_managers FOR SELECT 
USING (true);
