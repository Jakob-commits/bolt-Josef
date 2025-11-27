/*
  # Sales Sensei - Challenge-System
  
  ## Neue Tabelle
  **challenges** - User-Challenges System
  - challenger_id, opponent_id
  - mode (scenario_type_enum)
  - difficulty (skill_level_enum)
  - status (challenge_status_enum)
  - revenge_parent_id für Revanchen
  - winner_id, loser_id nach Abschluss
  - expires_at für automatische Ablauf
  
  ## Business Rules (via Constraints & Triggers)
  1. Max 3 aktive Challenges pro User (als opponent)
  2. Nur 1 aktive Challenge zwischen zwei Personen
  3. Revanche-Chain über revenge_parent_id
  
  ## Sicherheit
  - Tenant-isoliert
  - RLS später aktiviert
*/

-- =====================================================
-- CHALLENGES
-- =====================================================
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode scenario_type_enum NOT NULL,
  difficulty skill_level_enum NOT NULL,
  status challenge_status_enum DEFAULT 'pending',
  revenge_parent_id uuid NULL REFERENCES challenges(id) ON DELETE SET NULL,
  winner_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  loser_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NULL,
  
  CHECK (challenger_id != opponent_id),
  CHECK (status != 'completed' OR (winner_id IS NOT NULL AND loser_id IS NOT NULL))
);

-- =====================================================
-- HELPER FUNCTION: Prüfe max 3 aktive Challenges
-- =====================================================
CREATE OR REPLACE FUNCTION check_max_challenges()
RETURNS TRIGGER AS $$
DECLARE
  active_count int;
BEGIN
  IF NEW.status = 'pending' OR NEW.status = 'accepted' THEN
    SELECT COUNT(*) INTO active_count
    FROM challenges
    WHERE opponent_id = NEW.opponent_id
    AND status IN ('pending', 'accepted')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF active_count >= 3 THEN
      RAISE EXCEPTION 'User kann maximal 3 aktive Challenges haben';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_challenges
  BEFORE INSERT OR UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_max_challenges();

-- =====================================================
-- HELPER FUNCTION: Nur 1 aktive Challenge zwischen zwei Usern
-- =====================================================
CREATE OR REPLACE FUNCTION check_unique_active_challenge()
RETURNS TRIGGER AS $$
DECLARE
  existing_count int;
BEGIN
  IF NEW.status = 'pending' OR NEW.status = 'accepted' THEN
    SELECT COUNT(*) INTO existing_count
    FROM challenges
    WHERE (
      (challenger_id = NEW.challenger_id AND opponent_id = NEW.opponent_id)
      OR
      (challenger_id = NEW.opponent_id AND opponent_id = NEW.challenger_id)
    )
    AND status IN ('pending', 'accepted')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Zwischen diesen beiden Usern existiert bereits eine aktive Challenge';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_unique_active_challenge
  BEFORE INSERT OR UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_unique_active_challenge();

-- =====================================================
-- INDIZES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_challenges_tenant_id ON challenges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent_id ON challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_challenges_revenge_parent_id ON challenges(revenge_parent_id);
