-- Aggiunge la colonna organizer_id alla tabella matches
ALTER TABLE public.matches 
ADD COLUMN organizer_id BIGINT REFERENCES public.players(id) ON DELETE SET NULL;

-- (Opzionale ma consigliato) Aggiunge un commento per documentare il campo
COMMENT ON COLUMN public.matches.organizer_id IS 'L''ID del giocatore che ha creato e gestisce la partita';
