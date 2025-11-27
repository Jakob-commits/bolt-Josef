/*
  # Sales Sensei - Fix Training Tables mit CASCADE
*/

DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Hole Standard-Tenant
  SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
  
  -- =====================================================
  -- GUIDELINES
  -- =====================================================
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'guidelines' AND column_name = 'scenario_type' 
    AND udt_name = 'scenario_type_enum'
  ) THEN
    ALTER TABLE IF EXISTS guidelines RENAME TO guidelines_old;
    
    CREATE TABLE guidelines (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      created_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
      title text NOT NULL,
      content text NOT NULL,
      optimized_content text NULL,
      scenario_type scenario_type_enum NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guidelines_old') THEN
      INSERT INTO guidelines (id, tenant_id, created_by, title, content, optimized_content, scenario_type, is_active, created_at, updated_at)
      SELECT 
        id, tenant_id, created_by, title, content, optimized_content,
        'vollgespraech'::scenario_type_enum, is_active, created_at, updated_at
      FROM guidelines_old;
      
      DROP TABLE guidelines_old CASCADE;
    END IF;
  END IF;

  -- =====================================================
  -- TRAINING_SESSIONS
  -- =====================================================
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_sessions' 
    AND column_name = 'difficulty' 
    AND udt_name = 'skill_level_enum'
  ) THEN
    ALTER TABLE IF EXISTS training_sessions RENAME TO training_sessions_old;
    
    CREATE TABLE training_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      guideline_id uuid NULL REFERENCES guidelines(id) ON DELETE SET NULL,
      scenario_type scenario_type_enum NOT NULL,
      difficulty skill_level_enum NOT NULL,
      customer_type customer_type_enum NOT NULL,
      transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
      duration_seconds int DEFAULT 0,
      success_rating int DEFAULT 0,
      scores jsonb NOT NULL DEFAULT '{}'::jsonb,
      feedback text NULL,
      completed_at timestamptz NULL,
      created_at timestamptz DEFAULT now()
    );
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'training_sessions_old') THEN
      INSERT INTO training_sessions (
        id, user_id, tenant_id, guideline_id, 
        scenario_type, difficulty, customer_type,
        transcript, duration_seconds, success_rating, scores, feedback, completed_at, created_at
      )
      SELECT 
        id, user_id, tenant_id, guideline_id,
        'vollgespraech'::scenario_type_enum,
        'anfaenger'::skill_level_enum,
        'zufall'::customer_type_enum,
        COALESCE(transcript, '[]'::jsonb),
        COALESCE(duration_seconds, 0),
        COALESCE(success_rating, 0),
        COALESCE(scores, '{}'::jsonb),
        feedback, completed_at, created_at
      FROM training_sessions_old;
      
      DROP TABLE training_sessions_old CASCADE;
    END IF;
  END IF;

  -- =====================================================
  -- TRAINING_GUIDES
  -- =====================================================
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_guides' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE training_guides RENAME TO training_guides_old;
    
    CREATE TABLE training_guides (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title text NOT NULL,
      config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'training_guides_old') THEN
      INSERT INTO training_guides (id, tenant_id, user_id, title, config_json, created_at, updated_at)
      SELECT 
        id, default_tenant_id, user_id, title,
        jsonb_build_object('content', content),
        created_at, updated_at
      FROM training_guides_old;
      
      DROP TABLE training_guides_old CASCADE;
    END IF;
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_guides' AND column_name = 'config_json'
  ) THEN
    ALTER TABLE training_guides ADD COLUMN config_json jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Indizes
CREATE INDEX IF NOT EXISTS idx_guidelines_tenant_id ON guidelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guidelines_scenario_type ON guidelines(scenario_type);
CREATE INDEX IF NOT EXISTS idx_training_guides_user_id ON training_guides(user_id);
CREATE INDEX IF NOT EXISTS idx_training_guides_tenant_id ON training_guides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_tenant_id ON training_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at DESC);
