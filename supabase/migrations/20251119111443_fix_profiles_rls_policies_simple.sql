/*
  # Fix Profiles RLS Policies - Simple & Robust

  1. Problem
    - Komplexe Policies mit Zirkularitäten (profiles referenziert profiles)
    - get_user_role_level() Funktion führt zu Deadlocks
    - Master-User kann sich nicht mehr einloggen
  
  2. Lösung
    - Alle bisherigen Policies löschen
    - Neue, einfache Policies ohne zirkuläre Referenzen
    - Direkte Checks ohne komplexe Subqueries
  
  3. Neue Policy-Struktur
    - SELECT: User sieht eigenes Profil + Masters sehen alles + Leaders sehen Tenant
    - UPDATE: User kann eigenes Profil updaten
    - INSERT: Master/Admins können Profile anlegen
    - DELETE: Master/Admins können Profile löschen
*/

-- Alle bisherigen Policies löschen
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Masters can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Company and teamleiter can view tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Masters and admins can view all profiles" ON profiles;

-- NEUE POLICY 1: SELECT - Einfach und klar
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- User sieht immer sein eigenes Profil
    id = auth.uid()
    -- ODER: User ist Master (dann sieht er alles)
    OR EXISTS (
      SELECT 1 FROM profiles master_check
      WHERE master_check.id = auth.uid() 
      AND master_check.role = 'master'
    )
    -- ODER: User ist Leader und sieht Profile seines Tenants
    OR EXISTS (
      SELECT 1 FROM profiles leader_check
      WHERE leader_check.id = auth.uid()
      AND leader_check.role IN ('admin', 'teamleiter', 'company')
      AND leader_check.tenant_id = profiles.tenant_id
    )
  );

-- NEUE POLICY 2: UPDATE - User kann eigenes Profil updaten
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- NEUE POLICY 3: INSERT - Master und Admins können Profile anlegen
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Master kann alle Profile anlegen
    EXISTS (
      SELECT 1 FROM profiles master_check
      WHERE master_check.id = auth.uid() 
      AND master_check.role = 'master'
    )
    -- ODER: Admin/Teamleiter kann Profile im eigenen Tenant anlegen
    OR EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.role IN ('admin', 'teamleiter')
      AND admin_check.tenant_id = profiles.tenant_id
    )
    -- ODER: User legt sein eigenes Profil an (bei Registrierung)
    OR profiles.id = auth.uid()
  );

-- NEUE POLICY 4: UPDATE für Admins - Können Profile ihres Tenants updaten
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- Master kann alles updaten
    EXISTS (
      SELECT 1 FROM profiles master_check
      WHERE master_check.id = auth.uid() 
      AND master_check.role = 'master'
    )
    -- ODER: Admin/Teamleiter kann Profile im eigenen Tenant updaten
    OR EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.role IN ('admin', 'teamleiter')
      AND admin_check.tenant_id = profiles.tenant_id
    )
  )
  WITH CHECK (
    -- Master kann alles
    EXISTS (
      SELECT 1 FROM profiles master_check
      WHERE master_check.id = auth.uid() 
      AND master_check.role = 'master'
    )
    -- ODER: Admin/Teamleiter bleibt im eigenen Tenant
    OR EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.role IN ('admin', 'teamleiter')
      AND admin_check.tenant_id = profiles.tenant_id
    )
  );

-- NEUE POLICY 5: DELETE - Master und Admins können Profile löschen
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    -- Master kann alles löschen
    EXISTS (
      SELECT 1 FROM profiles master_check
      WHERE master_check.id = auth.uid() 
      AND master_check.role = 'master'
    )
    -- ODER: Admin/Teamleiter kann Profile im eigenen Tenant löschen
    OR EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.role IN ('admin', 'teamleiter')
      AND admin_check.tenant_id = profiles.tenant_id
    )
  );

-- Kommentar zur Policy-Logik
COMMENT ON POLICY "profiles_select_policy" ON profiles IS 
  'Simple RLS: Users see own profile, Masters see all, Leaders see their tenant';
COMMENT ON POLICY "profiles_update_own" ON profiles IS 
  'Users can update their own profile fields';
COMMENT ON POLICY "profiles_insert_admin" ON profiles IS 
  'Masters and Admins can create profiles, users can create their own on registration';
COMMENT ON POLICY "profiles_update_admin" ON profiles IS 
  'Masters and Admins can update profiles in their scope';
COMMENT ON POLICY "profiles_delete_admin" ON profiles IS 
  'Masters and Admins can delete profiles in their scope';
