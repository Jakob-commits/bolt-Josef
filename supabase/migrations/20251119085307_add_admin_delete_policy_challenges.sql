/*
  # Add DELETE policy for challenges

  1. Changes
    - Add DELETE policy for Master and Admin roles to delete any challenge
    - Uses get_user_role_level() helper function
    - Master (level 1) and Admin (level 2) can delete challenges

  2. Security
    - Only Master and Admin roles can delete challenges
    - Maintains tenant isolation via tenant_id check
*/

CREATE POLICY "Admins can delete challenges"
  ON challenges
  FOR DELETE
  TO authenticated
  USING (
    get_user_role_level() <= 2 
    AND tenant_id = get_user_tenant_id()
  );
