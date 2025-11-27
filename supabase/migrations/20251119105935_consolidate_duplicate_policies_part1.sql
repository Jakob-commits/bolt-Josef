/*
  # Consolidate Duplicate Policies - Part 1

  1. Problem
    - Multiple permissive policies for same action on same table
    - Causes unnecessary policy evaluation overhead
    - Makes policy management confusing
  
  2. Solution
    - Drop redundant policies
    - Keep one comprehensive policy per action
    - Maintain same security logic
  
  3. Tables in this migration
    - achievements (3 duplicate SELECT policies)
    - challenges (2 SELECT, 2 UPDATE)
    - folders (multiple duplicates across all actions)
    - user_settings (multiple duplicates)
    - skill_scores (multiple duplicates)
    - user_achievements (multiple duplicates)
*/

-- Helper function
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Achievements: Keep one, drop duplicates
SELECT drop_policy_if_exists('achievements', 'Achievements viewable by all authenticated');
SELECT drop_policy_if_exists('achievements', 'All authenticated users can view achievements');
-- Keep: "Achievements are viewable by authenticated users"

-- Challenges: Consolidate SELECT policies
SELECT drop_policy_if_exists('challenges', 'Leaders can view tenant challenges');
-- Keep "Users can view own challenges" and modify to include leaders
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    challenger_id = (select auth.uid()) 
    OR opponent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.tenant_id = p1.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND (p2.id = challenges.challenger_id OR p2.id = challenges.opponent_id)
    )
  );

-- Challenges: Drop duplicate UPDATE policy
SELECT drop_policy_if_exists('challenges', 'Users can update their challenges');
-- Keep: "Users can update own challenges"

-- Folders: Keep comprehensive policy, drop specific ones
SELECT drop_policy_if_exists('folders', 'Users can read own folders');
SELECT drop_policy_if_exists('folders', 'Users can insert own folders');
SELECT drop_policy_if_exists('folders', 'Users can update own folders');
SELECT drop_policy_if_exists('folders', 'Users can delete own folders');
-- Keep: "Users can manage their own folders" (covers all operations)

-- User Settings: Keep comprehensive policy
SELECT drop_policy_if_exists('user_settings', 'Users can read own settings');
SELECT drop_policy_if_exists('user_settings', 'Users can insert own settings');
SELECT drop_policy_if_exists('user_settings', 'Users can update own settings');
-- Keep: "Users can manage their own settings"

-- Skill Scores: Consolidate
SELECT drop_policy_if_exists('skill_scores', 'Users can view own skill scores');
SELECT drop_policy_if_exists('skill_scores', 'Users can insert own skill scores');
SELECT drop_policy_if_exists('skill_scores', 'Users can update own skill scores');
-- Keep: "Users can manage own skill scores" and update to include leaders for SELECT

DROP POLICY IF EXISTS "Users can manage own skill scores" ON skill_scores;
CREATE POLICY "Users can manage own skill scores"
  ON skill_scores FOR ALL
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.tenant_id = p1.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p2.id = skill_scores.user_id
    )
  )
  WITH CHECK (user_id = (select auth.uid()));

-- Drop redundant leader policy
SELECT drop_policy_if_exists('skill_scores', 'Leaders can view tenant skill scores');

-- User Achievements: Consolidate
SELECT drop_policy_if_exists('user_achievements', 'Users can view own achievements');
SELECT drop_policy_if_exists('user_achievements', 'Users can insert own achievements');
SELECT drop_policy_if_exists('user_achievements', 'Users can update own achievements');

DROP POLICY IF EXISTS "Users can manage own achievements" ON user_achievements;
CREATE POLICY "Users can manage own achievements"
  ON user_achievements FOR ALL
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.tenant_id = p1.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p2.id = user_achievements.user_id
    )
  )
  WITH CHECK (user_id = (select auth.uid()));

-- Drop redundant leader policy
SELECT drop_policy_if_exists('user_achievements', 'Leaders can view tenant achievements');

-- Cleanup
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);
