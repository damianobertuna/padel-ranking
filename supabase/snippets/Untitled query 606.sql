-- Andrea Pappalardo (ID: 7)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p7@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Andrea","last_name":"Pappalardo"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 7;
END $$;

-- Luca Grasso (ID: 8)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p8@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Luca","last_name":"Grasso"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 8;
END $$;

-- Marco Faro (ID: 9)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p9@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Marco","last_name":"Faro"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 9;
END $$;

-- Giuseppe Privitera (ID: 10)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p10@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Giuseppe","last_name":"Privitera"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 10;
END $$;

-- Antonio Musumeci (ID: 11)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p11@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Antonio","last_name":"Musumeci"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 11;
END $$;

-- Francesco Lombardo (ID: 12)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p12@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Francesco","last_name":"Lombardo"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 12;
END $$;

-- Matteo Russo (ID: 13)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p13@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Matteo","last_name":"Russo"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 13;
END $$;

-- Alessandro Messina (ID: 14)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p14@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Alessandro","last_name":"Messina"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 14;
END $$;

-- Giovanni Greco (ID: 15)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p15@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Giovanni","last_name":"Greco"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 15;
END $$;

-- Davide Bruno (ID: 16)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p16@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Davide","last_name":"Bruno"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 16;
END $$;

-- Simone Gallo (ID: 17)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p17@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Simone","last_name":"Gallo"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 17;
END $$;

-- Lorenzo Conti (ID: 18)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p18@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Lorenzo","last_name":"Conti"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 18;
END $$;

-- Stefano De Luca (ID: 19)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p19@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Stefano","last_name":"De Luca"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 19;
END $$;

-- Christian Costa (ID: 20)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p20@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Christian","last_name":"Costa"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 20;
END $$;

-- Gabriele Giordano (ID: 21)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p21@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Gabriele","last_name":"Giordano"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 21;
END $$;

-- Riccardo Rizzo (ID: 22)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p22@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Riccardo","last_name":"Rizzo"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 22;
END $$;

-- Emanuele Lombardi (ID: 23)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p23@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Emanuele","last_name":"Lombardi"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 23;
END $$;

-- Vincenzo Moretti (ID: 24)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p24@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Vincenzo","last_name":"Moretti"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 24;
END $$;

-- Edoardo Barbieri (ID: 25)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p25@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Edoardo","last_name":"Barbieri"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 25;
END $$;

-- Daniele Fontana (ID: 26)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p26@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Daniele","last_name":"Fontana"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 26;
END $$;

-- Federico Santoro (ID: 27)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p27@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Federico","last_name":"Santoro"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 27;
END $$;

-- Alessia Caruso (ID: 28)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p28@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Alessia","last_name":"Caruso"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 28;
END $$;

-- Chiara Spampinato (ID: 29)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p29@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Chiara","last_name":"Spampinato"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 29;
END $$;

-- Giulia Rinaldi (ID: 30)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p30@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Giulia","last_name":"Rinaldi"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 30;
END $$;

-- Sara Ferrara (ID: 31)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p31@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Sara","last_name":"Ferrara"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 31;
END $$;

-- Martina Galli (ID: 32)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p32@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Martina","last_name":"Galli"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 32;
END $$;

-- Valentina Panza (ID: 33)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p33@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Valentina","last_name":"Panza"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 33;
END $$;

-- Francesca Pellegrini (ID: 34)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p34@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Francesca","last_name":"Pellegrini"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 34;
END $$;

-- Silvia Fiore (ID: 35)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p35@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Silvia","last_name":"Fiore"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 35;
END $$;

-- Elena D'Amico (ID: 36)
DO $$
DECLARE new_uid uuid := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, aud, role)
    VALUES (new_uid, '00000000-0000-0000-0000-000000000000', 'damianobertuna+p36@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Elena","last_name":"D''Amico"}'::jsonb, false, now(), now(), 'authenticated', 'authenticated');
    UPDATE public.players SET user_id = new_uid WHERE id = 36;
END $$;