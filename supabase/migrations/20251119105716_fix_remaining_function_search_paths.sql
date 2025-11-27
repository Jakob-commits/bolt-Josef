/*
  # Fix Remaining Function Search Paths

  1. Problem
    - Some functions have overloaded versions with user_uuid parameter
    - These versions don't have search_path set
    - Need to add SECURITY DEFINER and search_path to all versions
  
  2. Functions to Fix
    - can_assign_role(uuid, uuid)
    - get_user_role_level(uuid)
    - get_user_role_name(uuid)
    - has_role_level_or_higher(uuid, integer)
    - is_master(uuid)
*/

-- Drop existing overloaded versions if they exist
DROP FUNCTION IF EXISTS can_assign_role(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_role_level(uuid);
DROP FUNCTION IF EXISTS get_user_role_name(uuid);
DROP FUNCTION IF EXISTS has_role_level_or_higher(uuid, integer);
DROP FUNCTION IF EXISTS is_master(uuid);

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION can_assign_role(actor_uuid uuid, target_role_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actor_level INTEGER;
  target_level INTEGER;
BEGIN
  -- Get actor's role level
  SELECT r.level INTO actor_level
  FROM roles r
  JOIN profiles p ON p.role::text = r.name
  WHERE p.id = actor_uuid;

  -- Get target role level from roles table
  SELECT level INTO target_level
  FROM roles
  WHERE id = target_role_id;

  -- Can only assign roles at same or lower level
  RETURN COALESCE(actor_level <= target_level, false);
END;
$$;

CREATE OR REPLACE FUNCTION get_user_role_level(user_uuid uuid)
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
       WHERE p.id = user_uuid),
      999
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_role_name(user_uuid uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN (
    SELECT role::text FROM profiles WHERE id = user_uuid
  );
END;
$$;

CREATE OR REPLACE FUNCTION has_role_level_or_higher(user_uuid uuid, required_level INTEGER)
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
       WHERE p.id = user_uuid),
      false
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_master(user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid 
    AND role = 'master'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_assign_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_level(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role_level_or_higher(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION is_master(uuid) TO authenticated;
