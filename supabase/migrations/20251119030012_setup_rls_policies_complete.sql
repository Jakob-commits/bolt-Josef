/*
  # RLS Policies für Sales Sensei
  
  ## Übersicht
  Richtet Row Level Security für alle Haupttabellen ein:
  - profiles: User sehen nur eigenes Profil (außer MASTER/ADMIN)
  - skill_scores: User sehen nur eigene Scores
  - training_sessions: User sehen nur eigene Sessions
  - user_achievements: User sehen nur eigene Achievements
  - user_layouts: User sehen nur eigenes Layout
  - guidelines, training_guides: Alle authenticated User können lesen
  - tenants, roles: Lesbar für alle authenticated User
  
  ## Sicherheit
  - RLS wird aktiviert (falls nicht schon aktiv)
  - Policies werden nur erstellt, falls sie noch nicht existieren
  - MASTER und ADMIN haben erweiterte Rechte
*/

-- =====================================================
-- HELPER: Funktion um User-Rolle zu prüfen
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS int AS $$
DECLARE
  user_role text;
  role_lvl int;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  SELECT level INTO role_lvl FROM roles WHERE name = user_role;
  RETURN COALESCE(role_lvl, 999);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Masters and admins can view all profiles'
  ) THEN
    CREATE POLICY "Masters and admins can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (get_user_role_level() <= 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- =====================================================
-- SKILL_SCORES
-- =====================================================
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_scores' AND policyname = 'Users can view own skill scores'
  ) THEN
    CREATE POLICY "Users can view own skill scores"
      ON skill_scores FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR get_user_role_level() <= 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_scores' AND policyname = 'Users can insert own skill scores'
  ) THEN
    CREATE POLICY "Users can insert own skill scores"
      ON skill_scores FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_scores' AND policyname = 'Users can update own skill scores'
  ) THEN
    CREATE POLICY "Users can update own skill scores"
      ON skill_scores FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- TRAINING_SESSIONS
-- =====================================================
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_sessions' AND policyname = 'Users can view own training sessions'
  ) THEN
    CREATE POLICY "Users can view own training sessions"
      ON training_sessions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR get_user_role_level() <= 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_sessions' AND policyname = 'Users can insert own training sessions'
  ) THEN
    CREATE POLICY "Users can insert own training sessions"
      ON training_sessions FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_sessions' AND policyname = 'Users can update own training sessions'
  ) THEN
    CREATE POLICY "Users can update own training sessions"
      ON training_sessions FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- USER_ACHIEVEMENTS
-- =====================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_achievements' AND policyname = 'Users can view own achievements'
  ) THEN
    CREATE POLICY "Users can view own achievements"
      ON user_achievements FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR get_user_role_level() <= 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_achievements' AND policyname = 'Users can insert own achievements'
  ) THEN
    CREATE POLICY "Users can insert own achievements"
      ON user_achievements FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_achievements' AND policyname = 'Users can update own achievements'
  ) THEN
    CREATE POLICY "Users can update own achievements"
      ON user_achievements FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- USER_LAYOUTS
-- =====================================================
ALTER TABLE user_layouts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_layouts' AND policyname = 'Users can manage own layouts'
  ) THEN
    CREATE POLICY "Users can manage own layouts"
      ON user_layouts FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- GUIDELINES
-- =====================================================
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guidelines' AND policyname = 'Users can view guidelines in their tenant'
  ) THEN
    CREATE POLICY "Users can view guidelines in their tenant"
      ON guidelines FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.tenant_id = guidelines.tenant_id
          AND profiles.id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- TRAINING_GUIDES
-- =====================================================
ALTER TABLE training_guides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'training_guides' AND policyname = 'Authenticated users can view training guides'
  ) THEN
    CREATE POLICY "Authenticated users can view training guides"
      ON training_guides FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- =====================================================
-- TENANTS
-- =====================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenants' AND policyname = 'Users can view their tenant'
  ) THEN
    CREATE POLICY "Users can view their tenant"
      ON tenants FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.tenant_id = tenants.id
          AND profiles.id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- ROLES
-- =====================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roles' AND policyname = 'Roles are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Roles are viewable by authenticated users"
      ON roles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- =====================================================
-- ACHIEVEMENTS
-- =====================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'achievements' AND policyname = 'Achievements are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Achievements are viewable by authenticated users"
      ON achievements FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
