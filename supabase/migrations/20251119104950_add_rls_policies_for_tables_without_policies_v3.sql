/*
  # Add RLS Policies for Tables Without Policies (v3)

  1. Tables Affected
    - badges
    - leaderboard_periods
    - points_config
    - rookie_config
    - teams
    - user_badges
  
  2. Security
    - All tables have RLS enabled but no policies
    - Add restrictive policies for each table
    - Only authenticated users with proper tenant access
    - Use correct USING vs WITH CHECK for INSERT/UPDATE
*/

-- Badges: Read-only for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'badges' AND policyname = 'Authenticated users can view badges'
  ) THEN
    CREATE POLICY "Authenticated users can view badges"
      ON badges FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Leaderboard Periods: Tenant-specific access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leaderboard_periods' AND policyname = 'Users can view tenant leaderboard periods'
  ) THEN
    CREATE POLICY "Users can view tenant leaderboard periods"
      ON leaderboard_periods FOR SELECT
      TO authenticated
      USING (
        tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leaderboard_periods' AND policyname = 'Admins can manage leaderboard periods'
  ) THEN
    CREATE POLICY "Admins can manage leaderboard periods"
      ON leaderboard_periods FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master')
          AND tenant_id = leaderboard_periods.tenant_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master')
          AND tenant_id = leaderboard_periods.tenant_id
        )
      );
  END IF;
END $$;

-- Points Config: Tenant-specific access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'points_config' AND policyname = 'Users can view tenant points config v2'
  ) THEN
    CREATE POLICY "Users can view tenant points config v2"
      ON points_config FOR SELECT
      TO authenticated
      USING (
        tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'points_config' AND policyname = 'Leaders can manage points config'
  ) THEN
    CREATE POLICY "Leaders can manage points config"
      ON points_config FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master', 'teamleiter')
          AND tenant_id = points_config.tenant_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master', 'teamleiter')
          AND tenant_id = points_config.tenant_id
        )
      );
  END IF;
END $$;

-- Rookie Config: Tenant-specific access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rookie_config' AND policyname = 'Users can view tenant rookie config v2'
  ) THEN
    CREATE POLICY "Users can view tenant rookie config v2"
      ON rookie_config FOR SELECT
      TO authenticated
      USING (
        tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rookie_config' AND policyname = 'Leaders can manage rookie config'
  ) THEN
    CREATE POLICY "Leaders can manage rookie config"
      ON rookie_config FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master', 'teamleiter')
          AND tenant_id = rookie_config.tenant_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master', 'teamleiter')
          AND tenant_id = rookie_config.tenant_id
        )
      );
  END IF;
END $$;

-- Teams: Tenant-specific access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' AND policyname = 'Users can view tenant teams'
  ) THEN
    CREATE POLICY "Users can view tenant teams"
      ON teams FOR SELECT
      TO authenticated
      USING (
        tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' AND policyname = 'Teamleiter and above can manage teams'
  ) THEN
    CREATE POLICY "Teamleiter and above can manage teams"
      ON teams FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master', 'teamleiter')
          AND tenant_id = teams.tenant_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND role IN ('admin', 'master', 'teamleiter')
          AND tenant_id = teams.tenant_id
        )
      );
  END IF;
END $$;

-- User Badges: Users can view and earn own badges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_badges' AND policyname = 'Users can view own badges'
  ) THEN
    CREATE POLICY "Users can view own badges"
      ON user_badges FOR SELECT
      TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_badges' AND policyname = 'Users can earn badges'
  ) THEN
    CREATE POLICY "Users can earn badges"
      ON user_badges FOR INSERT
      TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;
