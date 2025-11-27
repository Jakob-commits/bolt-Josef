/*
  # Migriere profiles Daten zu user_profiles
  
  1. Daten Migration
    - Kopiere alle profiles Daten zu user_profiles
    - Mappe alte Rollen auf neue roles Tabelle
    - Setze korrekte role_id für alle User
    
  2. Mapping
    - MASTER → Master (Level 1)
    - ADMIN → Admin (Level 2)
    - USER → User (Level 6)
    
  3. Sicherheit
    - Behalte alle bestehenden RLS Policies
    - Master-Account bleibt hauser@ki-sensei.de
*/

-- Migriere Daten von profiles zu user_profiles
DO $$
DECLARE
  master_role_id uuid;
  admin_role_id uuid;
  user_role_id uuid;
  prof RECORD;
BEGIN
  -- Hole Rollen-IDs
  SELECT id INTO master_role_id FROM roles WHERE name = 'Master';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
  SELECT id INTO user_role_id FROM roles WHERE name = 'User';

  -- Für jeden Eintrag in profiles
  FOR prof IN SELECT * FROM profiles LOOP
    -- Füge zu user_profiles hinzu oder update
    INSERT INTO user_profiles (
      user_id,
      role_id,
      company_id,
      skill_level,
      full_name,
      email,
      profile_image_url,
      created_at,
      updated_at
    )
    VALUES (
      prof.id,
      CASE 
        WHEN prof.role = 'MASTER' THEN master_role_id
        WHEN prof.role = 'ADMIN' THEN admin_role_id
        ELSE user_role_id
      END,
      prof.tenant_id,
      CASE 
        WHEN prof.skill_level = 1 THEN 'Beginner'
        WHEN prof.skill_level = 2 THEN 'Fortgeschritten'
        WHEN prof.skill_level = 3 THEN 'Profi'
        ELSE 'Beginner'
      END,
      prof.full_name,
      prof.email,
      prof.avatar_url,
      prof.created_at,
      prof.updated_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role_id = CASE 
        WHEN prof.role = 'MASTER' THEN master_role_id
        WHEN prof.role = 'ADMIN' THEN admin_role_id
        ELSE user_role_id
      END,
      company_id = COALESCE(EXCLUDED.company_id, user_profiles.company_id),
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      email = COALESCE(EXCLUDED.email, user_profiles.email),
      updated_at = now();
  END LOOP;
  
  RAISE NOTICE 'Migration abgeschlossen';
END $$;

-- Stelle sicher, dass hauser@ki-sensei.de Master ist
DO $$
DECLARE
  master_id uuid;
  master_role_id uuid;
BEGIN
  SELECT id INTO master_role_id FROM roles WHERE name = 'Master';
  
  SELECT id INTO master_id 
  FROM auth.users 
  WHERE email = 'hauser@ki-sensei.de';

  IF master_id IS NOT NULL THEN
    UPDATE user_profiles 
    SET 
      role_id = master_role_id,
      allow_sharing = true
    WHERE user_id = master_id;
    
    RAISE NOTICE 'Master-Account aktualisiert: %', master_id;
  END IF;
END $$;

-- Füge fehlende Spalten zu user_profiles hinzu (falls nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN full_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- View für einfachen Zugriff mit allen relevanten Daten
CREATE OR REPLACE VIEW user_profiles_complete AS
SELECT 
  up.user_id as id,
  up.user_id,
  up.company_id as tenant_id,
  r.name as role,
  r.level as role_level,
  up.full_name,
  up.email,
  COALESCE(up.avatar_url, up.profile_image_url) as avatar_url,
  up.skill_level,
  up.allow_sharing,
  up.created_at,
  up.updated_at
FROM user_profiles up
LEFT JOIN roles r ON up.role_id = r.id;

-- Grant SELECT auf View
GRANT SELECT ON user_profiles_complete TO authenticated;
