/*
  # Sales Sensei Success System - Comprehensive Schema
  
  1. New Tables
    - `hall_of_fame` - Leaderboard mit User-Punkten und Sharing-Optionen
    - `points_config` - Konfigurierbare Punktevergabe pro Trainingsmodus
    - `rookie_config` - Rookie-Bonus-Einstellungen pro Tenant
    - `challenges` - Herausforderungen zwischen Usern
    - `challenge_results` - Ergebnisse der Challenges
    - `badges` - Definierte Badges/Achievements
    - `user_badges` - Zugewiesene Badges pro User
    - `leaderboard_periods` - Zeitlich begrenzte Wettbewerbe
    
  2. Security
    - RLS für alle Tabellen aktiviert
    - Policies nach Rollenhierarchie
    
  3. Features
    - Punktesystem mit Rookie-Bonus
    - Challenge-System mit Revanche
    - Hall of Fame mit Opt-in Sharing
    - Konfigurierbare Punktevergabe
*/

-- Hall of Fame Tabelle
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  total_points integer DEFAULT 0 NOT NULL,
  training_points integer DEFAULT 0 NOT NULL,
  challenge_points integer DEFAULT 0 NOT NULL,
  allow_sharing boolean DEFAULT false,
  best_session_id uuid REFERENCES training_sessions(id) ON DELETE SET NULL,
  rank_position integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Punkte-Konfiguration
CREATE TABLE IF NOT EXISTS points_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  training_mode text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('anfaenger', 'fortgeschritten', 'profi')),
  base_points integer NOT NULL,
  challenge_multiplier_win float DEFAULT 1.5,
  challenge_multiplier_loss float DEFAULT -0.5,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, training_mode, difficulty)
);

-- Rookie-Bonus Konfiguration
CREATE TABLE IF NOT EXISTS rookie_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  rookie_period_days integer DEFAULT 30,
  rookie_bonus_factor float DEFAULT 1.3,
  rookie_bonus_flat integer DEFAULT 20,
  applies_to_challenges boolean DEFAULT true,
  applies_to_events boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  challenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opponent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired', 'cancelled')),
  training_mode text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('anfaenger', 'fortgeschritten', 'profi')),
  winner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  loser_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  revenge_parent_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  completed_at timestamptz,
  CHECK (challenger_id != opponent_id)
);

-- Challenge Results
CREATE TABLE IF NOT EXISTS challenge_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES training_sessions(id) ON DELETE SET NULL,
  score integer NOT NULL,
  points_earned integer DEFAULT 0,
  is_winner boolean DEFAULT false,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Badges/Achievements Definition
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  category text,
  requirement_type text NOT NULL CHECK (requirement_type IN ('points', 'trainings', 'challenges', 'streak', 'custom')),
  requirement_value integer,
  points_reward integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, badge_id)
);

-- Leaderboard Periods (zeitlich begrenzte Events)
CREATE TABLE IF NOT EXISTS leaderboard_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  multiplier float DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_tenant ON hall_of_fame(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user ON hall_of_fame(user_id);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_rank ON hall_of_fame(tenant_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_challenges_users ON challenges(challenger_id, opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenge_results_challenge ON challenge_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- RLS aktivieren
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rookie_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies für hall_of_fame
CREATE POLICY "Users can view hall of fame in their tenant"
  ON hall_of_fame FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hall of fame settings"
  ON hall_of_fame FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies für points_config
CREATE POLICY "Users can view points config in their tenant"
  ON points_config FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage points config"
  ON points_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER')
      AND tenant_id = points_config.tenant_id
    )
  );

-- RLS Policies für rookie_config
CREATE POLICY "Users can view rookie config in their tenant"
  ON rookie_config FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage rookie config"
  ON rookie_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER')
      AND tenant_id = rookie_config.tenant_id
    )
  );

-- RLS Policies für challenges
CREATE POLICY "Users can view challenges involving them"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    challenger_id = auth.uid() OR 
    opponent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER', 'COACH')
      AND tenant_id = challenges.tenant_id
    )
  );

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "Users can update their challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (
    challenger_id = auth.uid() OR opponent_id = auth.uid()
  );

-- RLS Policies für challenge_results
CREATE POLICY "Users can view their challenge results"
  ON challenge_results FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_results.challenge_id
      AND (challenger_id = auth.uid() OR opponent_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their challenge results"
  ON challenge_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies für badges
CREATE POLICY "Users can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NULL OR
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage badges"
  ON badges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER')
    )
  );

-- RLS Policies für user_badges
CREATE POLICY "Users can view user badges in their tenant"
  ON user_badges FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies für leaderboard_periods
CREATE POLICY "Users can view leaderboard periods in their tenant"
  ON leaderboard_periods FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage leaderboard periods"
  ON leaderboard_periods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER')
      AND tenant_id = leaderboard_periods.tenant_id
    )
  );

-- Standard-Punktekonfiguration einfügen
INSERT INTO points_config (tenant_id, training_mode, difficulty, base_points, challenge_multiplier_win, challenge_multiplier_loss)
SELECT 
  t.id,
  mode,
  diff,
  CASE 
    WHEN diff = 'anfaenger' THEN 10
    WHEN diff = 'fortgeschritten' THEN 20
    WHEN diff = 'profi' THEN 30
  END as base_points,
  1.5,
  -0.5
FROM tenants t
CROSS JOIN (VALUES ('cold_call'), ('warm_call'), ('einwand'), ('abschluss'), ('smalltalk')) AS modes(mode)
CROSS JOIN (VALUES ('anfaenger'), ('fortgeschritten'), ('profi')) AS difficulties(diff)
ON CONFLICT DO NOTHING;

-- Standard-Rookie-Config einfügen
INSERT INTO rookie_config (tenant_id, enabled, rookie_period_days, rookie_bonus_factor, rookie_bonus_flat)
SELECT id, true, 30, 1.3, 20
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Standard-Badges einfügen
INSERT INTO badges (code, title, description, icon, category, requirement_type, requirement_value, points_reward, is_active)
VALUES
  ('first_training', 'Erstes Training', 'Absolviere dein erstes Training', '🎯', 'training', 'trainings', 1, 50, true),
  ('10_trainings', '10 Trainings', 'Absolviere 10 Trainings', '🔥', 'training', 'trainings', 10, 100, true),
  ('50_trainings', '50 Trainings', 'Absolviere 50 Trainings', '⭐', 'training', 'trainings', 50, 500, true),
  ('first_challenge_win', 'Erster Challenge-Sieg', 'Gewinne deine erste Challenge', '🏆', 'challenge', 'challenges', 1, 100, true),
  ('challenge_master', 'Challenge-Meister', 'Gewinne 10 Challenges', '👑', 'challenge', 'challenges', 10, 500, true),
  ('100_points', '100 Punkte', 'Erreiche 100 Gesamtpunkte', '💯', 'points', 'points', 100, 0, true),
  ('500_points', '500 Punkte', 'Erreiche 500 Gesamtpunkte', '🌟', 'points', 'points', 500, 0, true),
  ('1000_points', '1000 Punkte', 'Erreiche 1000 Gesamtpunkte', '💎', 'points', 'points', 1000, 0, true),
  ('7_day_streak', '7-Tage-Streak', 'Trainiere 7 Tage in Folge', '🔥', 'streak', 'streak', 7, 200, true),
  ('rookie_star', 'Rookie-Star', 'Sammle 500 Punkte in deinem ersten Monat', '🌠', 'custom', 'points', 500, 300, true)
ON CONFLICT (code) DO NOTHING;
