/*
  # Setup RLS Policies for API Keys

  1. Security Rules
    - Enable RLS on api_keys table
    - Only Master (role_level 1) and Admin (role_level 2) can access API keys
    - Users can only see/manage their own API keys
    - All operations (SELECT, INSERT, UPDATE, DELETE) restricted to Master/Admin

  2. Policies
    - SELECT: Master/Admin can view own keys
    - INSERT: Master/Admin can create keys (own user_id)
    - UPDATE: Master/Admin can update own keys
    - DELETE: Master/Admin can delete own keys

  3. Implementation
    - Uses get_user_role_level() helper function
    - Checks role_level <= 2 (Master=1, Admin=2)
    - Always validates user_id = auth.uid()
*/

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master and Admin can view own API keys"
  ON public.api_keys
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND get_user_role_level() <= 2
  );

CREATE POLICY "Master and Admin can create API keys"
  ON public.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND get_user_role_level() <= 2
  );

CREATE POLICY "Master and Admin can update own API keys"
  ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND get_user_role_level() <= 2
  )
  WITH CHECK (
    user_id = auth.uid()
    AND get_user_role_level() <= 2
  );

CREATE POLICY "Master and Admin can delete own API keys"
  ON public.api_keys
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND get_user_role_level() <= 2
  );
