/*
  # Sales Sensei - User Profile, Skills & Layout
  
  ## Neue Tabellen
  1. **profiles** - Hauptprofiltabelle
     - Verknüpft mit auth.users.id
     - Enthält tenant_id, role, skill_level
  
  2. **user_profiles** - Erweiterte Profildaten
     - Bio, Settings als JSONB
  
  3. **skill_scores** - Skill-Metriken pro User
     - 5 Skill-Kategorien als Integer
  
  4. **user_layouts** - Dashboard-Layouts
     - JSONB mit Layout-Konfiguration
  
  ## Wichtig
  - profiles.id = auth.users.id (für Supabase Auth)
  - Alle Tabellen mit tenant/user Fremdschlüsseln
  - skill_level nutzt skill_level_enum
*/

-- =====================================================
-- PROFILES (Hauptprofiltabelle)
-- =====================================================
DO $$
BEGIN
  -- Prüfe ob alte profiles-Tabelle existiert und konvertiere
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role' AND data_type = 'text'
  ) THEN
    -- Erstelle neue Tabelle mit Enum
    CREATE TABLE profiles_new (
      id uuid PRIMARY KEY,
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      team_id uuid NULL,
      role user_role_enum NOT NULL,
      full_name text NOT NULL,
      email text UNIQUE NOT NULL,
      avatar_url text NULL,
      skill_level skill_level_enum DEFAULT 'anfaenger',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Migriere Daten
    INSERT INTO profiles_new (id, tenant_id, team_id, role, full_name, email, avatar_url, skill_level, created_at, updated_at)
    SELECT 
      id,
      tenant_id,
      team_id,
      CASE 
        WHEN LOWER(role) = 'master' THEN 'master'::user_role_enum
        WHEN LOWER(role) = 'admin' THEN 'admin'::user_role_enum
        WHEN LOWER(role) = 'company' THEN 'company'::user_role_enum
        WHEN LOWER(role) = 'teamleiter' THEN 'teamleiter'::user_role_enum
        WHEN LOWER(role) = 'coach' THEN 'coach'::user_role_enum
        ELSE 'user'::user_role_enum
      END,
      full_name,
      email,
      avatar_url,
      CASE 
        WHEN skill_level = 0 THEN 'anfaenger'::skill_level_enum
        WHEN skill_level = 1 THEN 'fortgeschritten'::skill_level_enum
        WHEN skill_level = 2 THEN 'profi'::skill_level_enum
        ELSE 'anfaenger'::skill_level_enum
      END,
      created_at,
      updated_at
    FROM profiles
    ON CONFLICT (id) DO NOTHING;
    
    -- Lösche alte Tabelle
    DROP TABLE profiles CASCADE;
    
    -- Benenne neue Tabelle um
    ALTER TABLE profiles_new RENAME TO profiles;
  ELSE
    -- Erstelle Tabelle neu falls nicht vorhanden
    CREATE TABLE IF NOT EXISTS profiles (
      id uuid PRIMARY KEY,
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      team_id uuid NULL,
      role user_role_enum NOT NULL,
      full_name text NOT NULL,
      email text UNIQUE NOT NULL,
      avatar_url text NULL,
      skill_level skill_level_enum DEFAULT 'anfaenger',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- =====================================================
-- USER_PROFILES (Erweiterte Metadaten)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio text NULL,
  settings_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- SKILL_SCORES
-- =====================================================
CREATE TABLE IF NOT EXISTS skill_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rapport_building int DEFAULT 0,
  needs_analysis int DEFAULT 0,
  objection_handling int DEFAULT 0,
  closing int DEFAULT 0,
  communication int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- USER_LAYOUTS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_layouts_new') THEN
    CREATE TABLE user_layouts_new (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      layout jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(user_id)
    );
    
    -- Migriere alte Daten falls vorhanden
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_layouts') THEN
      INSERT INTO user_layouts_new (user_id, layout, created_at, updated_at)
      SELECT user_id, layout, created_at, updated_at
      FROM user_layouts
      ON CONFLICT (user_id) DO NOTHING;
      
      DROP TABLE user_layouts CASCADE;
    END IF;
    
    ALTER TABLE user_layouts_new RENAME TO user_layouts;
  END IF;
END $$;

-- =====================================================
-- INDIZES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_scores_user_id ON skill_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_layouts_user_id ON user_layouts(user_id);
