/*
  # Update Roles Constraint

  1. Updates
    - Drop old role constraint
    - Add new role constraint with updated role values: MASTER, ADMIN, FIRMA, TEAMLEITER, COACH, USER
    
  2. Notes
    - This allows the new role hierarchy to work properly
    - Existing data will not be affected
*/

-- Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with updated roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER', 'COACH', 'USER'));
