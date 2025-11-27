/*
  # Sales Sensei - Umfassende RLS-Policies
  
  ## Rollenhierarchie
  1 = Master (alles)
  2 = Admin (fast alles, keine Master-Accounts löschen)
  3 = Company (Tenant-Daten)
  4 = Teamleiter (Team-Daten)
  5 = Coach (nur Statistiken, keine Rohdaten)
  6 = User (nur eigene Daten)
  
  ## Prinzipien
  - Jeder User sieht nur Daten seines Tenants
  - Höhere Rollen dürfen niedrigere nicht überschreiben
  - Coach sieht aggregierte Daten, keine Transkripte
  - Master/Admin haben globale Rechte
  
  ## Aktivierte Tabellen
  - tenants, roles, profiles, user_profiles
  - skill_scores, user_layouts
  - guidelines, training_guides, training_sessions
  - achievements, user_achievements, hall_of_fame, point_config
  - challenges
*/

-- =====================================================
-- HELPER: get_user_role_level
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS int AS $$
DECLARE
  user_role user_role_enum;
  role_lvl int;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  SELECT level INTO role_lvl FROM roles WHERE name = user_role;
  RETURN COALESCE(role_lvl, 999);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER: get_user_tenant_id
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
DECLARE
  t_id uuid;
BEGIN
  SELECT tenant_id INTO t_id FROM profiles WHERE id = auth.uid();
  RETURN t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TENANTS
-- =====================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant" ON tenants;
DROP POLICY IF EXISTS "Masters and admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Masters can manage tenants" ON tenants;

CREATE POLICY "Users can view their tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = get_user_tenant_id());

CREATE POLICY "Masters and admins can view all tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (get_user_role_level() <= 2);

CREATE POLICY "Masters can manage tenants"
  ON tenants FOR ALL
  TO authenticated
  USING (get_user_role_level() = 1)
  WITH CHECK (get_user_role_level() = 1);

-- =====================================================
-- ROLES
-- =====================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;

CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PROFILES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Masters and admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Company and teamleiter can view tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Masters can manage all profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Masters and admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role_level() <= 2);

CREATE POLICY "Company and teamleiter can view tenant profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role_level() <= 4 AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Masters can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (get_user_role_level() = 1)
  WITH CHECK (get_user_role_level() = 1);

-- =====================================================
-- USER_PROFILES
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own extended profile" ON user_profiles;

CREATE POLICY "Users can manage own extended profile"
  ON user_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SKILL_SCORES
-- =====================================================
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skill scores" ON skill_scores;
DROP POLICY IF EXISTS "Leaders can view tenant skill scores" ON skill_scores;
DROP POLICY IF EXISTS "Users can manage own skill scores" ON skill_scores;

CREATE POLICY "Users can view own skill scores"
  ON skill_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view tenant skill scores"
  ON skill_scores FOR SELECT
  TO authenticated
  USING (
    get_user_role_level() <= 4
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = skill_scores.user_id
      AND profiles.tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Users can manage own skill scores"
  ON skill_scores FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- USER_LAYOUTS
-- =====================================================
ALTER TABLE user_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own layouts" ON user_layouts;

CREATE POLICY "Users can manage own layouts"
  ON user_layouts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- GUIDELINES
-- =====================================================
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tenant guidelines" ON guidelines;
DROP POLICY IF EXISTS "Company can manage tenant guidelines" ON guidelines;

CREATE POLICY "Users can view tenant guidelines"
  ON guidelines FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Company can manage tenant guidelines"
  ON guidelines FOR ALL
  TO authenticated
  USING (get_user_role_level() <= 3 AND tenant_id = get_user_tenant_id())
  WITH CHECK (get_user_role_level() <= 3 AND tenant_id = get_user_tenant_id());

-- =====================================================
-- TRAINING_GUIDES
-- =====================================================
ALTER TABLE training_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own training guides" ON training_guides;
DROP POLICY IF EXISTS "Leaders can view tenant training guides" ON training_guides;

CREATE POLICY "Users can manage own training guides"
  ON training_guides FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_user_tenant_id());

CREATE POLICY "Leaders can view tenant training guides"
  ON training_guides FOR SELECT
  TO authenticated
  USING (get_user_role_level() <= 4 AND tenant_id = get_user_tenant_id());

-- =====================================================
-- TRAINING_SESSIONS
-- =====================================================
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Leaders can view tenant sessions metadata" ON training_sessions;
DROP POLICY IF EXISTS "Coaches see only scores not transcripts" ON training_sessions;
DROP POLICY IF EXISTS "Users can manage own training sessions" ON training_sessions;

CREATE POLICY "Users can view own training sessions"
  ON training_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view tenant sessions metadata"
  ON training_sessions FOR SELECT
  TO authenticated
  USING (
    get_user_role_level() <= 4
    AND tenant_id = get_user_tenant_id()
  );

CREATE POLICY "Users can manage own training sessions"
  ON training_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_user_tenant_id());

-- =====================================================
-- ACHIEVEMENTS
-- =====================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements viewable by all authenticated" ON achievements;

CREATE POLICY "Achievements viewable by all authenticated"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- USER_ACHIEVEMENTS
-- =====================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Leaders can view tenant achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can manage own achievements" ON user_achievements;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view tenant achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (
    get_user_role_level() <= 4
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_achievements.user_id
      AND profiles.tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Users can manage own achievements"
  ON user_achievements FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- HALL_OF_FAME
-- =====================================================
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public hall of fame viewable" ON hall_of_fame;
DROP POLICY IF EXISTS "Users can manage own hall of fame" ON hall_of_fame;

CREATE POLICY "Public hall of fame viewable"
  ON hall_of_fame FOR SELECT
  TO authenticated
  USING (allow_sharing = true OR user_id = auth.uid() OR get_user_role_level() <= 4);

CREATE POLICY "Users can manage own hall of fame"
  ON hall_of_fame FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- POINT_CONFIG
-- =====================================================
ALTER TABLE point_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tenant point config" ON point_config;
DROP POLICY IF EXISTS "Company can manage tenant point config" ON point_config;

CREATE POLICY "Users can view tenant point config"
  ON point_config FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Company can manage tenant point config"
  ON point_config FOR ALL
  TO authenticated
  USING (get_user_role_level() <= 3 AND tenant_id = get_user_tenant_id())
  WITH CHECK (get_user_role_level() <= 3 AND tenant_id = get_user_tenant_id());

-- =====================================================
-- CHALLENGES
-- =====================================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Leaders can view tenant challenges" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;

CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

CREATE POLICY "Leaders can view tenant challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (get_user_role_level() <= 4 AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = auth.uid() AND tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update own challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid())
  WITH CHECK (challenger_id = auth.uid() OR opponent_id = auth.uid());
