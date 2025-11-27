/*
  # Sales Sensei - Enums und Basis-Typen
  
  ## Übersicht
  Erstellt alle benötigten Enums für das Sales Sensei System:
  - user_role_enum: Benutzerrollen (Master bis User)
  - skill_level_enum: Schwierigkeitsstufen
  - scenario_type_enum: Trainingsszenarien
  - customer_type_enum: Kundentypen (DISG)
  - challenge_status_enum: Status von Challenges
  
  ## Hinweis
  Wir nutzen PostgreSQL ENUMs für Type-Safety und Validierung
*/

-- Erstelle Enums nur falls nicht vorhanden
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('master', 'admin', 'company', 'teamleiter', 'coach', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE skill_level_enum AS ENUM ('anfaenger', 'fortgeschritten', 'profi');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE scenario_type_enum AS ENUM ('vollgespraech', 'cold_call', 'einwand', 'bedarf', 'smalltalk', 'abschluss');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_type_enum AS ENUM ('gelb', 'blau', 'gruen', 'rot', 'zufall');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE challenge_status_enum AS ENUM ('pending', 'accepted', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
