/*
  # UI Visibility & Layouts System

  1. New Tables
    - `ui_visibility`
      - Tenant-basierte Sichtbarkeitseinstellungen für UI-Elemente
      - Jedes Element kann visible/comingsoon/hidden sein
      - Nur Master/Admin können ändern
    
    - `ui_layouts` (erweitert)
      - User-spezifische Layout-Positionen
      - Getrennt von Visibility
      - Nur für Dashboard, nicht für Training Suite

  2. Security
    - RLS auf ui_visibility: Nur eigener Tenant
    - RLS auf ui_layouts: Nur eigener User
    - INSERT/UPDATE/DELETE nur für Master/Admin (ui_visibility)

  3. Keys Definition
    Dashboard Cards:
    - home.card.trainingSuite
    - home.card.leitfadenanalyse
    - home.card.challenges
    - home.card.halloffame
    - home.card.files
    - home.card.analytics
    - home.card.guidelines
    
    Training Suite Steps:
    - ts.step1.modus
    - ts.step2.menschentyp
    - ts.step3.meta
    - ts.step4.vorgaben
    - ts.step5.schwierigkeit
    - ts.step6.summary
*/

-- ui_visibility table
CREATE TABLE IF NOT EXISTS ui_visibility (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  state text NOT NULL CHECK (state IN ('visible', 'comingsoon', 'hidden')) DEFAULT 'visible',
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);

-- ui_layouts table (ensure it exists with correct schema)
CREATE TABLE IF NOT EXISTS ui_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area text NOT NULL,
  key text NOT NULL,
  position int NOT NULL,
  layout jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, user_id, area, key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ui_visibility_tenant ON ui_visibility(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ui_layouts_user ON ui_layouts(tenant_id, user_id, area);

-- RLS Policies for ui_visibility
ALTER TABLE ui_visibility ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can read their tenant's visibility settings
CREATE POLICY "ui_visibility_select_tenant"
  ON ui_visibility FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: Only Master/Admin can modify
CREATE POLICY "ui_visibility_modify_admin"
  ON ui_visibility FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('master', 'admin')
    )
  );

-- RLS Policies for ui_layouts
ALTER TABLE ui_layouts ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read their own layouts
CREATE POLICY "ui_layouts_select_own"
  ON ui_layouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: Users can modify their own layouts
CREATE POLICY "ui_layouts_modify_own"
  ON ui_layouts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seed default visibility settings for existing tenants
INSERT INTO ui_visibility (tenant_id, key, state)
SELECT DISTINCT 
  t.id,
  k.key,
  'visible'
FROM tenants t
CROSS JOIN (
  VALUES 
    ('home.card.trainingSuite'),
    ('home.card.leitfadenanalyse'),
    ('home.card.challenges'),
    ('home.card.halloffame'),
    ('home.card.files'),
    ('home.card.analytics'),
    ('home.card.guidelines'),
    ('ts.step1.modus'),
    ('ts.step2.menschentyp'),
    ('ts.step3.meta'),
    ('ts.step4.vorgaben'),
    ('ts.step5.schwierigkeit'),
    ('ts.step6.summary')
) AS k(key)
ON CONFLICT (tenant_id, key) DO NOTHING;

COMMENT ON TABLE ui_visibility IS 'Tenant-level UI element visibility settings (visible/comingsoon/hidden)';
COMMENT ON TABLE ui_layouts IS 'User-level UI layout positions and configurations';
