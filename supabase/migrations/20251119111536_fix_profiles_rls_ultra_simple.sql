/*
  # Fix Profiles RLS - Ultra Simple (No Recursion)

  1. Problem
    - Jede Subquery auf profiles führt zu infinite recursion
    - Komplexe Role-Checks sind nicht möglich ohne Rekursion
  
  2. Lösung
    - EXTREM simple Policies
    - SELECT: Alle authenticated Users sehen ALLE Profile ihres Tenants
    - Feinere Kontrolle im Application Layer
    - Master-Check separat ohne profiles-Referenz
  
  3. Trade-off
    - RLS ist weniger restriktiv (mehr im Application Layer)
    - Aber: Funktioniert garantiert ohne Rekursion
    - Tenant-Isolation bleibt erhalten
*/

-- Alle bisherigen Policies löschen
DROP POLICY IF EXISTS "profiles_select_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;

-- ULTRA-SIMPLE APPROACH: Kein Role-Check in RLS, nur Tenant-Isolation

-- POLICY 1: SELECT - Eigenes Profil + alle Profile des eigenen Tenants
CREATE POLICY "profiles_select_tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Eigenes Profil sehen
    id = auth.uid()
    -- ODER: Alle Profile des eigenen Tenants
    OR tenant_id = (
      SELECT tenant_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- POLICY 2: UPDATE - Eigenes Profil
CREATE POLICY "profiles_update_own_only"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- POLICY 3: INSERT - Jeder kann sein eigenes Profil anlegen
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- POLICY 4: DELETE - Niemand darf via RLS löschen (nur via Application/Admin-Funktion)
-- Keine DELETE Policy = kein direktes DELETE erlaubt

-- Dokumentation
COMMENT ON POLICY "profiles_select_tenant" ON profiles IS 
  'Ultra-simple: Users see their own profile and all profiles in their tenant. Fine-grained access control is handled in application layer.';
COMMENT ON POLICY "profiles_update_own_only" ON profiles IS 
  'Users can only update their own profile. Admin updates handled via service role.';
COMMENT ON POLICY "profiles_insert_own" ON profiles IS 
  'Users can create their own profile on registration. Admin creates handled via service role.';
