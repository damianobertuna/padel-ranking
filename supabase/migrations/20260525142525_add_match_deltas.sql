-- Aggiungiamo le colonne per storicizzare i punti vinti/persi in ogni match
ALTER TABLE public.matches
    ADD COLUMN team_a_delta NUMERIC(6, 2) DEFAULT 0,
ADD COLUMN team_b_delta NUMERIC(6, 2) DEFAULT 0;
