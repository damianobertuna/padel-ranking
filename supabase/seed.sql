-- Svuotiamo le tabelle per evitare duplicati se lo lanci più volte
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.players CASCADE;
TRUNCATE TABLE public.clubs CASCADE;

-- 1. Creiamo un Club
INSERT INTO public.clubs (id, name, city)
VALUES (1, 'Padel Club Catania', 'Catania');

-- 2. Creiamo qualche Giocatore finto
INSERT INTO public.players (id, first_name, last_name, ranking, gender, preferred_side) VALUES
(1, 'Mario', 'Rossi', 4.0, 'M', 'Left'),
(2, 'Luigi', 'Verdi', 3.5, 'M', 'Right'),
(3, 'Giulia', 'Bianchi', 3.0, 'F', 'Left'),
(4, 'Marco', 'Neri', 4.5, 'M', 'Both');

-- 3. Creiamo una partita 'pending' usando un UUID valido!
INSERT INTO public.matches (id, status, club_id, team_a_left_id, team_a_right_id)
VALUES ('11111111-2222-3333-4444-555555555555', 'pending', 1, 1, 2);
