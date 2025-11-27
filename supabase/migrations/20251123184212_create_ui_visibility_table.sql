/*
  # Create UI Visibility Table

  1. New Tables
    - `ui_visibility`
      - `tenant_id` (uuid, references tenants, part of primary key)
      - `element_key` (text, part of primary key)
      - `state` (text, enum: visible/comingsoon/hidden)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `ui_visibility` table
    - SELECT policy: users can view visibility settings for their tenant
    - INSERT/UPDATE/DELETE policies: only master/admin roles in same tenant
*/

-- Create ui_visibility table
CREATE TABLE IF NOT EXISTS ui_visibility (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  element_key text NOT NULL,
  state text CHECK (state IN ('visible', 'comingsoon', 'hidden')) NOT NULL DEFAULT 'visible',
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, element_key)
);

-- Enable RLS
ALTER TABLE ui_visibility ENABLE ROW LEVEL SECURITY;

-- SELECT policy: users can view their tenant's visibility settings
CREATE POLICY "Users can view tenant visibility settings"
  ON ui_visibility
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_visibility.tenant_id
    )
  );

-- INSERT policy: only master/admin can create visibility settings
CREATE POLICY "Master and admin can create visibility settings"
  ON ui_visibility
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_visibility.tenant_id
      AND profiles.role IN ('master', 'admin')
    )
  );

-- UPDATE policy: only master/admin can update visibility settings
CREATE POLICY "Master and admin can update visibility settings"
  ON ui_visibility
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_visibility.tenant_id
      AND profiles.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_visibility.tenant_id
      AND profiles.role IN ('master', 'admin')
    )
  );

-- DELETE policy: only master/admin can delete visibility settings
CREATE POLICY "Master and admin can delete visibility settings"
  ON ui_visibility
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_visibility.tenant_id
      AND profiles.role IN ('master', 'admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ui_visibility_tenant 
  ON ui_visibility(tenant_id);
