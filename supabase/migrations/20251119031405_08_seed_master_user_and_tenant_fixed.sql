/*
  # Sales Sensei - Master-User und Tenant Seed (Fixed)
  
  ## Erstellt
  1. Tenant "KI Sensei GmbH"
  2. Master-User Josef Hauser
  3. Initial Skill-Scores
  4. Initial Point-Config
  5. Hall of Fame Eintrag
*/

DO $$
DECLARE
  ki_sensei_tenant_id uuid;
  master_user_id uuid;
  auth_user_exists boolean;
BEGIN
  -- =====================================================
  -- 1. TENANT ANLEGEN
  -- =====================================================
  INSERT INTO tenants (name)
  VALUES ('KI Sensei GmbH')
  ON CONFLICT DO NOTHING
  RETURNING id INTO ki_sensei_tenant_id;
  
  IF ki_sensei_tenant_id IS NULL THEN
    SELECT id INTO ki_sensei_tenant_id FROM tenants WHERE name = 'KI Sensei GmbH';
  END IF;
  
  -- =====================================================
  -- 2. PRÜFE AUTH.USERS
  -- =====================================================
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'hauser@ki-sensei.de'
  ) INTO auth_user_exists;
  
  IF auth_user_exists THEN
    SELECT id INTO master_user_id FROM auth.users WHERE email = 'hauser@ki-sensei.de';
  ELSE
    master_user_id := gen_random_uuid();
  END IF;
  
  -- =====================================================
  -- 3. MASTER-PROFIL ANLEGEN
  -- =====================================================
  INSERT INTO profiles (
    id,
    tenant_id,
    role,
    full_name,
    email,
    skill_level
  )
  VALUES (
    master_user_id,
    ki_sensei_tenant_id,
    'master'::user_role_enum,
    'Josef Hauser',
    'hauser@ki-sensei.de',
    'fortgeschritten'::skill_level_enum
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = 'master'::user_role_enum,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  
  -- =====================================================
  -- 4. SKILL-SCORES
  -- =====================================================
  INSERT INTO skill_scores (
    user_id,
    rapport_building,
    needs_analysis,
    objection_handling,
    closing,
    communication
  )
  VALUES (
    master_user_id,
    0, 0, 0, 0, 0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- =====================================================
  -- 5. USER LAYOUT
  -- =====================================================
  INSERT INTO user_layouts (
    user_id,
    layout
  )
  VALUES (
    master_user_id,
    '{
      "home-left": ["welcome", "skill-profile", "recent-trainings"],
      "home-right": ["achievements", "quote", "news"]
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- =====================================================
  -- 6. POINT CONFIG
  -- =====================================================
  INSERT INTO point_config (tenant_id)
  VALUES (ki_sensei_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;
  
  -- =====================================================
  -- 7. HALL OF FAME (mit allen benötigten Feldern)
  -- =====================================================
  IF NOT EXISTS (SELECT 1 FROM hall_of_fame WHERE user_id = master_user_id) THEN
    INSERT INTO hall_of_fame (
      user_id,
      tenant_id,
      total_points,
      training_points,
      challenge_points,
      allow_sharing
    )
    VALUES (
      master_user_id,
      ki_sensei_tenant_id,
      0,
      0,
      0,
      false
    );
  END IF;
  
  RAISE NOTICE 'Master-User erfolgreich angelegt: %', master_user_id;
  RAISE NOTICE 'Tenant: %', ki_sensei_tenant_id;
END $$;
