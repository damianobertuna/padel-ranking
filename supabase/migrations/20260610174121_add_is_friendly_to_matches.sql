-- Migrazione sicura per aggiungere il flag delle amichevoli senza rompere le colonne esistenti
ALTER TABLE "public"."matches" 
ADD COLUMN IF NOT EXISTS "is_friendly" boolean null default false;
