/*
  # Create UI Layouts Table

  1. New Tables
    - `ui_layouts`
      - `tenant_id` (uuid, references tenants, part of primary key)
      - `user_id` (uuid, references profiles, part of primary key)
      - `area` (text, part of primary key - e.g., 'dashboard')
      - `element_key` (text, part of primary key - e.g., 'welcome-card')
      - `position` (int, sort order)
      - `layout` (jsonb, optional layout configuration)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `ui_layouts` table
    - SELECT policy: users can only view their own layouts
    - INSERT/UPDATE/DELETE policies: users can only modify their own layouts
*/

-- Create ui_layouts table
CREATE TABLE IF NOT EXISTS ui_layouts (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  area text NOT NULL,
  element_key text NOT NULL,
  position int NOT NULL,
  layout jsonb,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id, area, element_key)
);

-- Enable RLS
ALTER TABLE ui_layouts ENABLE ROW LEVEL SECURITY;

-- SELECT policy: users can only view their own layouts
CREATE POLICY "Users can view own layouts"
  ON ui_layouts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_layouts.tenant_id
    )
  );

-- INSERT policy: users can only create their own layouts
CREATE POLICY "Users can create own layouts"
  ON ui_layouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_layouts.tenant_id
    )
  );

-- UPDATE policy: users can only update their own layouts
CREATE POLICY "Users can update own layouts"
  ON ui_layouts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_layouts.tenant_id
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_layouts.tenant_id
    )
  );

-- DELETE policy: users can only delete their own layouts
CREATE POLICY "Users can delete own layouts"
  ON ui_layouts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = ui_layouts.tenant_id
    )
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ui_layouts_user_area 
  ON ui_layouts(tenant_id, user_id, area);

CREATE INDEX IF NOT EXISTS idx_ui_layouts_position 
  ON ui_layouts(tenant_id, user_id, area, position);
