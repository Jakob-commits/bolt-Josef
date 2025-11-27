/*
  # Consolidate Duplicate Policies - Part 3

  1. Tables in this migration
    - guidelines (2 SELECT)
    - leaderboard_periods (2 SELECT - one for view, one for manage)
    - point_config (2 SELECT)
    - points_config (2 SELECT)
    - rookie_config (2 SELECT)
    - teams (2 SELECT)
    - tenants (3 SELECT)
*/

-- Helper function
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Guidelines: Keep both (one for view, one for manage with different permissions)
-- No changes needed - both policies serve different purposes

-- Leaderboard Periods: Consolidate into manage policy
-- The "Admins can manage leaderboard periods" already includes SELECT in FOR ALL
-- So we can drop the view-only policy
SELECT drop_policy_if_exists('leaderboard_periods', 'Users can view tenant leaderboard periods');
-- Keep: "Admins can manage leaderboard periods"

-- Point Config: Keep both (view vs manage)
-- No changes needed

-- Points Config: Consolidate
-- "Leaders can manage points config" is FOR ALL, includes SELECT
SELECT drop_policy_if_exists('points_config', 'Users can view tenant points config v2');
-- Keep: "Leaders can manage points config"

-- Rookie Config: Consolidate
-- "Leaders can manage rookie config" is FOR ALL, includes SELECT
SELECT drop_policy_if_exists('rookie_config', 'Users can view tenant rookie config v2');
-- Keep: "Leaders can manage rookie config"

-- Teams: Consolidate
-- "Teamleiter and above can manage teams" is FOR ALL, includes SELECT
SELECT drop_policy_if_exists('teams', 'Users can view tenant teams');
-- Keep: "Teamleiter and above can manage teams"

-- Tenants: Consolidate SELECT policies
SELECT drop_policy_if_exists('tenants', 'Masters and admins can view all tenants');
SELECT drop_policy_if_exists('tenants', 'Users can view their tenant');

-- Recreate as single policy
DROP POLICY IF EXISTS "Masters can manage tenants" ON tenants;
CREATE POLICY "Masters can manage tenants"
  ON tenants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'master'
    )
    OR id IN (
      SELECT tenant_id FROM profiles WHERE id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'master'
    )
  );

-- Cleanup
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);
