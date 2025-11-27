/*
  # Consolidate Duplicate Policies - Part 2

  1. Tables in this migration
    - hall_of_fame (2 SELECT, 2 UPDATE)
    - user_profiles (multiple for all actions)
    - profiles (4 SELECT, 2 UPDATE)
    - training_sessions (3 SELECT)
    - training_guides (2 SELECT)
*/

-- Helper function
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Hall of Fame: Keep comprehensive policy
SELECT drop_policy_if_exists('hall_of_fame', 'Users can update their own hall of fame settings');
-- Keep: "Users can manage own hall of fame" and "Public hall of fame viewable"

-- User Profiles: Consolidate overlapping policies
-- Keep separate policies for different permission levels
SELECT drop_policy_if_exists('user_profiles', 'Users can read own profile');
SELECT drop_policy_if_exists('user_profiles', 'Users can insert own profile');
SELECT drop_policy_if_exists('user_profiles', 'Users can update own profile');
-- These are redundant with:
-- - "Users can manage own extended profile"
-- - up_user_select_self
-- - up_user_update_self

-- Consolidate the user self-access policies
SELECT drop_policy_if_exists('user_profiles', 'up_user_select_self');
SELECT drop_policy_if_exists('user_profiles', 'up_user_update_self');
-- Keep: "Users can manage own extended profile" (covers SELECT, INSERT, UPDATE, DELETE)

-- Profiles: Consolidate SELECT policies
SELECT drop_policy_if_exists('profiles', 'Company and teamleiter can view tenant profiles');
SELECT drop_policy_if_exists('profiles', 'Masters and admins can view all profiles');
-- Keep: "Masters can manage all profiles" (for masters) and "Users can view own profile"

-- Add a consolidated policy for leaders to view tenant profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = (select auth.uid())
      AND (
        -- Masters can see all
        p1.role = 'master'
        -- Leaders can see their tenant
        OR (p1.role IN ('admin', 'teamleiter', 'company') AND p1.tenant_id = profiles.tenant_id)
      )
    )
  );

-- Training Sessions: Consolidate SELECT policies
SELECT drop_policy_if_exists('training_sessions', 'Users can view own training sessions');

DROP POLICY IF EXISTS "Users can manage own training sessions" ON training_sessions;
CREATE POLICY "Users can manage own training sessions"
  ON training_sessions FOR ALL
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.tenant_id = p1.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p2.id = training_sessions.user_id
    )
  )
  WITH CHECK (user_id = (select auth.uid()));

-- Drop redundant leader policy
SELECT drop_policy_if_exists('training_sessions', 'Leaders can view tenant sessions metadata');

-- Training Guides: Consolidate
DROP POLICY IF EXISTS "Users can manage own training guides" ON training_guides;
CREATE POLICY "Users can manage own training guides"
  ON training_guides FOR ALL
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.tenant_id = p1.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p2.id = training_guides.user_id
    )
  )
  WITH CHECK (user_id = (select auth.uid()));

-- Drop redundant leader policy
SELECT drop_policy_if_exists('training_guides', 'Leaders can view tenant training guides');

-- Cleanup
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);
