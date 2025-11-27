/*
  # Sales Sensei - Tenants & Rollen System
  
  ## Neue Tabellen
  1. **tenants** - Mandanten/Firmen
     - id (uuid, primary key)
     - name (text)
     - created_at, updated_at (timestamptz)
  
  2. **roles** - Rollendefinitionen mit Hierarchie
     - id (uuid, primary key)
     - name (user_role_enum)
     - level (int) - 1=Master bis 6=User
     - created_at (timestamptz)
  
  ## Seed-Daten
  - Standard-Rollen (Master bis User) mit Leveln
  
  ## Sicherheit
  - RLS wird später aktiviert
  - Tabellen werden nur erstellt falls nicht vorhanden
*/

-- =====================================================
-- TENANTS
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ROLES mit Enum
-- =====================================================
DO $$
BEGIN
  -- Prüfe ob Tabelle existiert
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles_new') THEN
    CREATE TABLE roles_new (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name user_role_enum UNIQUE NOT NULL,
      level int NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    
    -- Migriere Daten von alter roles-Tabelle falls vorhanden
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
      INSERT INTO roles_new (name, level, created_at)
      SELECT 
        CASE 
          WHEN LOWER(name) = 'master' THEN 'master'::user_role_enum
          WHEN LOWER(name) = 'admin' THEN 'admin'::user_role_enum
          WHEN LOWER(name) = 'company' THEN 'company'::user_role_enum
          WHEN LOWER(name) = 'teamleiter' THEN 'teamleiter'::user_role_enum
          WHEN LOWER(name) = 'coach' THEN 'coach'::user_role_enum
          WHEN LOWER(name) = 'user' THEN 'user'::user_role_enum
        END,
        level,
        created_at
      FROM roles
      WHERE LOWER(name) IN ('master', 'admin', 'company', 'teamleiter', 'coach', 'user')
      ON CONFLICT (name) DO NOTHING;
      
      -- Lösche alte Tabelle und benenne neue um
      DROP TABLE roles CASCADE;
    END IF;
    
    ALTER TABLE roles_new RENAME TO roles;
  END IF;
END $$;

-- =====================================================
-- SEED: Standard-Rollen einfügen
-- =====================================================
INSERT INTO roles (name, level) VALUES
  ('master', 1),
  ('admin', 2),
  ('company', 3),
  ('teamleiter', 4),
  ('coach', 5),
  ('user', 6)
ON CONFLICT (name) DO UPDATE SET level = EXCLUDED.level;

-- =====================================================
-- INDIZES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
