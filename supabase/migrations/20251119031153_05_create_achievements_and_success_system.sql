/*
  # Sales Sensei - Achievements & Erfolgssystem
  
  ## Neue Tabellen
  1. **achievements** - Verfügbare Achievements
     - code, title, description, icon, category, threshold
  
  2. **user_achievements** - Freigeschaltete Achievements
     - user_id, achievement_id, progress, unlocked_at
  
  3. **hall_of_fame** - Leaderboard / Hall of Fame
     - user_id, total_points, sharing-Optionen
  
  4. **point_config** - Punkte-Konfiguration pro Tenant
     - tenant_id, config_json (Punkte pro Modus/Difficulty)
  
  ## Datenintegrität
  - Unique Constraints für user_achievements
  - Indizes für Performance
*/

-- =====================================================
-- ACHIEVEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  threshold int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- USER_ACHIEVEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  progress int DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- HALL_OF_FAME
-- =====================================================
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points int DEFAULT 0,
  allow_sharing boolean DEFAULT false,
  best_session_url text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- POINT_CONFIG (Punkte-Konfiguration pro Tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS point_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  config_json jsonb NOT NULL DEFAULT '{
    "vollgespraech": {"anfaenger": 100, "fortgeschritten": 150, "profi": 200},
    "cold_call": {"anfaenger": 80, "fortgeschritten": 120, "profi": 160},
    "einwand": {"anfaenger": 60, "fortgeschritten": 90, "profi": 120},
    "bedarf": {"anfaenger": 70, "fortgeschritten": 105, "profi": 140},
    "smalltalk": {"anfaenger": 50, "fortgeschritten": 75, "profi": 100},
    "abschluss": {"anfaenger": 90, "fortgeschritten": 135, "profi": 180},
    "multipliers": {
      "customer_type": {"gelb": 1.1, "blau": 1.0, "gruen": 1.05, "rot": 1.15, "zufall": 1.2},
      "success_rating": {"1-50": 0.5, "51-70": 0.8, "71-85": 1.0, "86-95": 1.2, "96-100": 1.5}
    }
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

-- =====================================================
-- SEED: Standard-Achievements
-- =====================================================
INSERT INTO achievements (code, title, description, icon, category, threshold) VALUES
  ('first_training', 'Erstes Training', 'Dein erstes Training abgeschlossen', 'Trophy', 'training', 1),
  ('ten_trainings', '10 Trainings', '10 Trainings erfolgreich abgeschlossen', 'Award', 'training', 10),
  ('master_closer', 'Master Closer', '50 Trainings mit Abschluss-Fokus', 'Target', 'closing', 50),
  ('objection_handler', 'Einwand-Meister', '30 Einwandbehandlungen gemeistert', 'Shield', 'objection', 30),
  ('rapport_builder', 'Beziehungsprofi', 'Rapport-Building Score über 90', 'Heart', 'rapport', 90),
  ('needs_analyst', 'Bedarfsanalyst', 'Needs-Analysis Score über 85', 'Search', 'needs', 85),
  ('communication_pro', 'Kommunikationsprofi', 'Communication Score über 90', 'MessageSquare', 'communication', 90),
  ('rookie_graduate', 'Anfänger Absolvent', '20 Anfänger-Trainings abgeschlossen', 'GraduationCap', 'level', 20),
  ('advanced_achiever', 'Fortgeschrittener', '15 Fortgeschrittenen-Trainings', 'TrendingUp', 'level', 15),
  ('profi_master', 'Profi-Master', '10 Profi-Trainings gemeistert', 'Crown', 'level', 10),
  ('week_warrior', 'Wochen-Krieger', '7 Trainings in einer Woche', 'Calendar', 'streak', 7)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  threshold = EXCLUDED.threshold;

-- =====================================================
-- INDIZES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_id ON hall_of_fame(user_id);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_total_points ON hall_of_fame(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_point_config_tenant_id ON point_config(tenant_id);
