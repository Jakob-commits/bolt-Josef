/*
  # Optimize Remaining RLS Policies - Companies, Team Members, Hall of Fame (v3)

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row
    - Critical for tables with complex tenant/role logic
  
  2. Tables Affected
    - companies
    - team_members
    - hall_of_fame (uses allow_sharing, not is_public)
    - company_documents
    - user_profiles (leader policies)
  
  3. Schema Corrections
    - team_members: company_id (not team_id)
    - hall_of_fame: allow_sharing (not is_public)
*/

-- Helper: Drop policy if exists
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Companies
SELECT drop_policy_if_exists('companies', 'Master and Admin can view all companies');
CREATE POLICY "Master and Admin can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

SELECT drop_policy_if_exists('companies', 'Admin and above can create companies');
CREATE POLICY "Admin and above can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

SELECT drop_policy_if_exists('companies', 'Admin and above can update companies');
CREATE POLICY "Admin and above can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

-- Team Members
SELECT drop_policy_if_exists('team_members', 'Users can view team members of their company');
CREATE POLICY "Users can view team members of their company"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM team_members 
      WHERE user_id = (select auth.uid())
    )
  );

SELECT drop_policy_if_exists('team_members', 'Authorized users can create team members');
CREATE POLICY "Authorized users can create team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin', 'teamleiter', 'company')
    )
  );

-- Hall of Fame - Public viewable policy (uses allow_sharing)
SELECT drop_policy_if_exists('hall_of_fame', 'Public hall of fame viewable');
CREATE POLICY "Public hall of fame viewable"
  ON hall_of_fame FOR SELECT
  TO authenticated
  USING (
    allow_sharing = true
    OR user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.tenant_id = p1.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p2.id = hall_of_fame.user_id
    )
  );

-- Company Documents
SELECT drop_policy_if_exists('company_documents', 'Company members can view company documents');
CREATE POLICY "Company members can view company documents"
  ON company_documents FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

SELECT drop_policy_if_exists('company_documents', 'Teamleiter and above can upload company documents');
CREATE POLICY "Teamleiter and above can upload company documents"
  ON company_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin', 'teamleiter', 'company')
    )
    AND company_id IN (
      SELECT company_id 
      FROM user_profiles 
      WHERE user_id = (select auth.uid())
    )
  );

-- User Profiles - Leader Policies
SELECT drop_policy_if_exists('user_profiles', 'up_master_full_access');
CREATE POLICY "up_master_full_access"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'master'
    )
  );

SELECT drop_policy_if_exists('user_profiles', 'up_leaders_create_users');
CREATE POLICY "up_leaders_create_users"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid())
      AND p.role IN ('master', 'admin', 'teamleiter')
      AND p.tenant_id = (
        SELECT tenant_id FROM profiles WHERE id = user_profiles.user_id
      )
    )
  );

SELECT drop_policy_if_exists('user_profiles', 'up_leaders_update_users');
CREATE POLICY "up_leaders_update_users"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.id = user_profiles.user_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p1.tenant_id = p2.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.id = user_profiles.user_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p1.tenant_id = p2.tenant_id
    )
  );

SELECT drop_policy_if_exists('user_profiles', 'up_leaders_delete_users');
CREATE POLICY "up_leaders_delete_users"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.id = user_profiles.user_id
      WHERE p1.id = (select auth.uid())
      AND p1.role IN ('master', 'admin', 'teamleiter')
      AND p1.tenant_id = p2.tenant_id
    )
  );

-- Cleanup helper function
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);
