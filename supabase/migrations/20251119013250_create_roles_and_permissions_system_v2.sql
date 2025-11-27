/*
  # Rollen- und Rechtesystem für Sales Sensei

  ## Neue Tabellen
    - `companies` - Firmen/Organisationen
    - `permissions` - Rollenbasierte Berechtigungen
    - `team_members` - Zuordnung User zu Firmen mit Rollen
    - `user_documents` - Persönliche Dokumente der User
    - `company_documents` - Firmendokumente
    - `folders` - Ordnerstruktur für Dateien
    - `user_settings` - User-Einstellungen

  ## Rollen-Hierarchie (höchste zuerst)
    1. MASTER (100) - Vollzugriff, kann alle Rollen verwalten
    2. ADMIN (90) - Fast Vollzugriff, kann keine Master löschen
    3. FIRMA (70) - Kann Teamleiter, Coaches & User erstellen
    4. TEAMLEITER (50) - Kann User verwalten, Statistiken einsehen
    5. COACH (30) - Kann Statistiken einsehen (falls freigegeben), keine Löschrechte
    6. USER (10) - Kann Trainings nutzen, eigene Dokumente hochladen

  ## Sicherheit
    - RLS auf allen Tabellen aktiviert
    - Hierarchische Zugriffskontrolle
    - Niedrigere Rolle kann nie höhere löschen
    - Rolle wird in user_meta_data gespeichert
*/

-- Companies Tabelle
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master and Admin can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role') IN ('master', 'admin')
    OR
    id::text = (auth.jwt()->>'company_id')
  );

CREATE POLICY "Admin and above can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role') IN ('master', 'admin')
  );

CREATE POLICY "Admin and above can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role') IN ('master', 'admin')
  )
  WITH CHECK (
    (auth.jwt()->>'role') IN ('master', 'admin')
  );

-- Permissions Tabelle
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text UNIQUE NOT NULL,
  role_level integer NOT NULL,
  can_delete_users boolean DEFAULT false,
  can_upload_files boolean DEFAULT false,
  can_view_stats boolean DEFAULT false,
  can_edit_company boolean DEFAULT false,
  can_create_users boolean DEFAULT false,
  can_manage_roles boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Basis-Berechtigungen einfügen
INSERT INTO permissions (role, role_level, can_delete_users, can_upload_files, can_view_stats, can_edit_company, can_create_users, can_manage_roles)
VALUES
  ('master', 100, true, true, true, true, true, true),
  ('admin', 90, true, true, true, true, true, true),
  ('firma', 70, true, true, true, false, true, false),
  ('teamleiter', 50, true, true, true, false, true, false),
  ('coach', 30, false, false, true, false, false, false),
  ('user', 10, false, true, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- Team Members Tabelle
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members of their company"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    company_id::text = (auth.jwt()->>'company_id')
    OR
    (auth.jwt()->>'role') IN ('master', 'admin')
  );

CREATE POLICY "Authorized users can create team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role') IN ('master', 'admin', 'firma', 'teamleiter')
  );

-- User Documents Tabelle
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  folder text,
  file_size integer,
  file_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
  ON user_documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Company Documents Tabelle
CREATE TABLE IF NOT EXISTS company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  file_size integer,
  file_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view company documents"
  ON company_documents FOR SELECT
  TO authenticated
  USING (
    company_id::text = (auth.jwt()->>'company_id')
    OR
    (auth.jwt()->>'role') IN ('master', 'admin')
  );

CREATE POLICY "Teamleiter and above can upload company documents"
  ON company_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'role') IN ('master', 'admin', 'firma', 'teamleiter')
  );

-- Folders Tabelle (für hierarchische Ordnerstruktur)
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_type text NOT NULL CHECK (owner_type IN ('company', 'user')),
  owner_id uuid NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders"
  ON folders FOR ALL
  TO authenticated
  USING (
    (owner_type = 'user' AND owner_id = auth.uid())
    OR
    (owner_type = 'company' AND owner_id::text = (auth.jwt()->>'company_id'))
    OR
    (auth.jwt()->>'role') IN ('master', 'admin')
  )
  WITH CHECK (
    (owner_type = 'user' AND owner_id = auth.uid())
    OR
    (owner_type = 'company' AND owner_id::text = (auth.jwt()->>'company_id'))
    OR
    (auth.jwt()->>'role') IN ('master', 'admin')
  );

-- User Settings Tabelle
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme text DEFAULT 'light',
  voice text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
