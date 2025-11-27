/*
  # Optimize RLS Policies - Use Subquery for auth.uid()

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Prevents re-evaluation for each row
    - Significant performance improvement at scale
  
  2. Approach
    - Drop and recreate policies with optimized version
    - Use DO blocks to handle existing policies safely
    - Maintain same security logic, only optimize execution
  
  3. Tables Affected
    - profiles
    - skill_scores
    - user_achievements
    - user_settings
    - folders
    - files
    - guides
    - hall_of_fame
    - challenges
    - challenge_results
    - user_layouts
    - training_guides
    - training_sessions
    - api_keys
*/

-- Helper: Drop policy if exists
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Profiles
SELECT drop_policy_if_exists('profiles', 'Users can view own profile');
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

SELECT drop_policy_if_exists('profiles', 'Users can update own profile');
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Skill Scores
SELECT drop_policy_if_exists('skill_scores', 'Users can view own skill scores');
CREATE POLICY "Users can view own skill scores"
  ON skill_scores FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('skill_scores', 'Users can manage own skill scores');
CREATE POLICY "Users can manage own skill scores"
  ON skill_scores FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('skill_scores', 'Users can insert own skill scores');
CREATE POLICY "Users can insert own skill scores"
  ON skill_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('skill_scores', 'Users can update own skill scores');  
CREATE POLICY "Users can update own skill scores"
  ON skill_scores FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User Achievements
SELECT drop_policy_if_exists('user_achievements', 'Users can view own achievements');
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_achievements', 'Users can manage own achievements');
CREATE POLICY "Users can manage own achievements"
  ON user_achievements FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_achievements', 'Users can insert own achievements');
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_achievements', 'Users can update own achievements');
CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User Settings
SELECT drop_policy_if_exists('user_settings', 'Users can read own settings');
CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_settings', 'Users can insert own settings');
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_settings', 'Users can update own settings');
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_settings', 'Users can manage their own settings');
CREATE POLICY "Users can manage their own settings"
  ON user_settings FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Folders
SELECT drop_policy_if_exists('folders', 'Users can read own folders');
CREATE POLICY "Users can read own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('folders', 'Users can insert own folders');
CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('folders', 'Users can update own folders');
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('folders', 'Users can delete own folders');
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('folders', 'Users can manage their own folders');
CREATE POLICY "Users can manage their own folders"
  ON folders FOR ALL
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

-- Files
SELECT drop_policy_if_exists('files', 'Users can read own files');
CREATE POLICY "Users can read own files"
  ON files FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('files', 'Users can insert own files');
CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('files', 'Users can update own files');
CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('files', 'Users can delete own files');
CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- Guides
SELECT drop_policy_if_exists('guides', 'Users can read own guides');
CREATE POLICY "Users can read own guides"
  ON guides FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('guides', 'Users can insert own guides');
CREATE POLICY "Users can insert own guides"
  ON guides FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('guides', 'Users can update own guides');
CREATE POLICY "Users can update own guides"
  ON guides FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

SELECT drop_policy_if_exists('guides', 'Users can delete own guides');
CREATE POLICY "Users can delete own guides"
  ON guides FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- Hall of Fame
SELECT drop_policy_if_exists('hall_of_fame', 'Users can update their own hall of fame settings');
CREATE POLICY "Users can update their own hall of fame settings"
  ON hall_of_fame FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('hall_of_fame', 'Users can manage own hall of fame');
CREATE POLICY "Users can manage own hall of fame"
  ON hall_of_fame FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User Documents
SELECT drop_policy_if_exists('user_documents', 'Users can manage their own documents');
CREATE POLICY "Users can manage their own documents"
  ON user_documents FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Challenges
SELECT drop_policy_if_exists('challenges', 'Users can view own challenges');
CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (challenger_id = (select auth.uid()) OR opponent_id = (select auth.uid()));

SELECT drop_policy_if_exists('challenges', 'Users can create challenges');
CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = (select auth.uid()));

SELECT drop_policy_if_exists('challenges', 'Users can update own challenges');
CREATE POLICY "Users can update own challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (challenger_id = (select auth.uid()) OR opponent_id = (select auth.uid()))
  WITH CHECK (challenger_id = (select auth.uid()) OR opponent_id = (select auth.uid()));

SELECT drop_policy_if_exists('challenges', 'Users can update their challenges');
CREATE POLICY "Users can update their challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (challenger_id = (select auth.uid()) OR opponent_id = (select auth.uid()))
  WITH CHECK (challenger_id = (select auth.uid()) OR opponent_id = (select auth.uid()));

-- Challenge Results
SELECT drop_policy_if_exists('challenge_results', 'Users can view their challenge results');
CREATE POLICY "Users can view their challenge results"
  ON challenge_results FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('challenge_results', 'Users can insert their challenge results');
CREATE POLICY "Users can insert their challenge results"
  ON challenge_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- User Layouts
SELECT drop_policy_if_exists('user_layouts', 'Users can manage own layouts');
CREATE POLICY "Users can manage own layouts"
  ON user_layouts FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Training Guides
SELECT drop_policy_if_exists('training_guides', 'Users can manage own training guides');
CREATE POLICY "Users can manage own training guides"
  ON training_guides FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Training Sessions
SELECT drop_policy_if_exists('training_sessions', 'Users can view own training sessions');
CREATE POLICY "Users can view own training sessions"
  ON training_sessions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('training_sessions', 'Users can manage own training sessions');
CREATE POLICY "Users can manage own training sessions"
  ON training_sessions FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User Profiles (complex policies with tenant logic)
SELECT drop_policy_if_exists('user_profiles', 'Users can read own profile');
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_profiles', 'Users can insert own profile');
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_profiles', 'Users can update own profile');
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_profiles', 'Users can manage own extended profile');
CREATE POLICY "Users can manage own extended profile"
  ON user_profiles FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_profiles', 'up_user_select_self');
CREATE POLICY "up_user_select_self"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

SELECT drop_policy_if_exists('user_profiles', 'up_user_update_self');
CREATE POLICY "up_user_update_self"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- API Keys
SELECT drop_policy_if_exists('api_keys', 'Master and Admin can view own API keys');
CREATE POLICY "Master and Admin can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

SELECT drop_policy_if_exists('api_keys', 'Master and Admin can create API keys');
CREATE POLICY "Master and Admin can create API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

SELECT drop_policy_if_exists('api_keys', 'Master and Admin can update own API keys');
CREATE POLICY "Master and Admin can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

SELECT drop_policy_if_exists('api_keys', 'Master and Admin can delete own API keys');
CREATE POLICY "Master and Admin can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('master', 'admin')
    )
  );

-- Cleanup helper function
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);
