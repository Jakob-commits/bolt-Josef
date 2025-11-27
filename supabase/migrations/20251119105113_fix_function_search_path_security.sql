/*
  # Fix Function Search Path Security

  1. Security Issue
    - Functions with mutable search_path are vulnerable to schema-based attacks
    - Attacker could create malicious functions in user-accessible schemas
    - Fix by setting SECURITY DEFINER and explicit search_path
  
  2. Functions to Fix
    - get_user_role_level
    - get_user_tenant_id
    - is_master
    - check_max_challenges
    - check_unique_active_challenge
    - get_user_role_name
    - has_role_level_or_higher
    - can_assign_role
  
  3. Solution
    - Set explicit search_path to pg_catalog, public
    - Use SECURITY DEFINER where appropriate
    - Prevents search_path manipulation attacks
*/

-- get_user_role_level
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (SELECT level FROM roles r 
       JOIN profiles p ON p.role::text = r.name 
       WHERE p.id = auth.uid()),
      999
    )
  );
END;
$$;

-- get_user_tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  );
END;
$$;

-- is_master
CREATE OR REPLACE FUNCTION is_master()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'master'
  );
END;
$$;

-- get_user_role_name
CREATE OR REPLACE FUNCTION get_user_role_name()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN (
    SELECT role::text FROM profiles WHERE id = auth.uid()
  );
END;
$$;

-- has_role_level_or_higher
CREATE OR REPLACE FUNCTION has_role_level_or_higher(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (SELECT level <= required_level 
       FROM roles r 
       JOIN profiles p ON p.role::text = r.name 
       WHERE p.id = auth.uid()),
      false
    )
  );
END;
$$;

-- can_assign_role
CREATE OR REPLACE FUNCTION can_assign_role(target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  user_level INTEGER;
  target_level INTEGER;
BEGIN
  -- Get current user's role level
  SELECT level INTO user_level
  FROM roles r
  JOIN profiles p ON p.role::text = r.name
  WHERE p.id = auth.uid();

  -- Get target role level
  SELECT level INTO target_level
  FROM roles
  WHERE name = target_role;

  -- Can only assign roles at same or lower level
  RETURN COALESCE(user_level <= target_level, false);
END;
$$;

-- check_max_challenges (trigger function)
CREATE OR REPLACE FUNCTION check_max_challenges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  active_challenges INTEGER;
  max_allowed INTEGER := 3;
BEGIN
  -- Count active challenges for user
  SELECT COUNT(*) INTO active_challenges
  FROM challenges
  WHERE (challenger_id = NEW.challenger_id OR opponent_id = NEW.challenger_id)
  AND status IN ('pending', 'accepted', 'in_progress');

  IF active_challenges >= max_allowed THEN
    RAISE EXCEPTION 'Maximum number of active challenges (%) reached', max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

-- check_unique_active_challenge (trigger function)
CREATE OR REPLACE FUNCTION check_unique_active_challenge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Check if there's already an active challenge between these users
  IF EXISTS (
    SELECT 1 FROM challenges
    WHERE (
      (challenger_id = NEW.challenger_id AND opponent_id = NEW.opponent_id)
      OR
      (challenger_id = NEW.opponent_id AND opponent_id = NEW.challenger_id)
    )
    AND status IN ('pending', 'accepted', 'in_progress')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'An active challenge already exists between these users';
  END IF;

  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_role_level() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_master() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_name() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_level_or_higher(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION can_assign_role(TEXT) TO authenticated;
