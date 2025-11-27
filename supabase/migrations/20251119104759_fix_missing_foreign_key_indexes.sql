/*
  # Fix Missing Foreign Key Indexes

  1. Performance Optimization
    - Add missing indexes on all foreign key columns
    - This prevents full table scans on JOIN operations
    - Critical for query performance at scale
  
  2. Affected Tables
    - badges (tenant_id)
    - challenges (loser_id, winner_id)
    - company_documents (company_id, uploaded_by)
    - guidelines (created_by)
    - leaderboard_periods (tenant_id)
    - team_members (user_id)
    - teams (tenant_id)
    - training_sessions (guideline_id)
    - user_badges (badge_id)
    - user_documents (user_id)
*/

-- Badges
CREATE INDEX IF NOT EXISTS idx_badges_tenant_id ON badges(tenant_id);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_loser_id ON challenges(loser_id);
CREATE INDEX IF NOT EXISTS idx_challenges_winner_id ON challenges(winner_id);

-- Company Documents
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_uploaded_by ON company_documents(uploaded_by);

-- Guidelines
CREATE INDEX IF NOT EXISTS idx_guidelines_created_by ON guidelines(created_by);

-- Leaderboard Periods
CREATE INDEX IF NOT EXISTS idx_leaderboard_periods_tenant_id ON leaderboard_periods(tenant_id);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON teams(tenant_id);

-- Training Sessions
CREATE INDEX IF NOT EXISTS idx_training_sessions_guideline_id ON training_sessions(guideline_id);

-- User Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- User Documents
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
