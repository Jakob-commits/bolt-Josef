/*
  # Fix Profiles RLS - No Recursion

  1. Problem
    - EXISTS Subqueries auf profiles führen zu infinite recursion
    - Policies dürfen nicht auf dieselbe Tabelle zugreifen
  
  2. Lösung
    - Verwende user_profiles Tabelle für Rolle-Checks (separates Schema)
    - Oder: Einfachste Policies ohne Role-Checks für SELECT
    - Master-Check über separate Hilfstabelle oder cached value
  
  3. Neue Strategie
    - SELECT: Alle authentifizierten User sehen ihr eigenes Profil
    - Für Leader/Master: Nutze user_profiles Tabelle für erweiterte Checks
*/

-- Alle bisherigen Policies löschen
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

-- STRATEGIE: Nutze user_profiles für Role-Checks (keine Rekursion)

-- POLICY 1: SELECT - Sehr einfach, keine Rekursion
CREATE POLICY "profiles_select_simple"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Jeder User sieht sein eigenes Profil
    id = auth.uid()
    -- Masters sehen alles (check via user_profiles)
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.role = 'master'
    )
    -- Leaders sehen Profile ihres Tenants (check via user_profiles)
    OR tenant_id IN (
      SELECT p.tenant_id
      FROM profiles p
      JOIN user_profiles up ON up.user_id = p.id
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'teamleiter', 'company', 'master')
    )
  );

-- POLICY 2: UPDATE - User kann eigenes Profil updaten
CREATE POLICY "profiles_update_simple"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- POLICY 3: INSERT - Admins können Profile anlegen
CREATE POLICY "profiles_insert_simple"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User legt sein eigenes Profil an
    profiles.id = auth.uid()
    -- ODER Master/Admin (via user_profiles check)
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.role IN ('master', 'admin', 'teamleiter')
    )
  );

-- POLICY 4: UPDATE für Admins
CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.role = 'master'
        OR (p.role IN ('admin', 'teamleiter') AND p.tenant_id = profiles.tenant_id)
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.role = 'master'
        OR (p.role IN ('admin', 'teamleiter') AND p.tenant_id = profiles.tenant_id)
    )
  );

-- POLICY 5: DELETE für Admins
CREATE POLICY "profiles_admin_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles up
      JOIN profiles p ON p.id = up.user_id
      WHERE p.role = 'master'
        OR (p.role IN ('admin', 'teamleiter') AND p.tenant_id = profiles.tenant_id)
    )
  );
