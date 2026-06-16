-- 1. Creazione della tabella dei ruoli sganciata dai giocatori
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT CHECK (role IN ('club_manager', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Eliminiamo la vecchia tabella ponte e la ricreiamo per puntare a auth.users
DROP TABLE IF EXISTS public.club_managers;

CREATE TABLE public.club_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    club_id BIGINT REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un utente non può essere assegnato due volte allo stesso circolo
    CONSTRAINT unique_user_club UNIQUE(user_id, club_id)
);

-- 3. Abilitiamo la RLS sulle nuove tabelle
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_managers ENABLE ROW LEVEL SECURITY;

-- 4. Policy di base (Gli Admin possono leggere e scrivere tutto)
CREATE POLICY "Admins can manage user_roles" 
ON public.user_roles FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage club_managers" 
ON public.club_managers FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
