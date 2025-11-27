/*
  # Fix Profiles RLS - Absolute Simplest Approach

  1. Analysis
    - Problem ist: Jede Subquery führt zu Komplexität
    - View funktioniert nicht mit auth.uid() im SQL Editor
  
  2. Solution
    - Absolut einfachste Policy: Alle authenticated sehen alle profiles
    - Oder: Nur eigenes Profil sehen (extrem restriktiv)
    - Feinere Kontrolle komplett im Application Layer
  
  3. Trade-off
    - RLS ist minimal (nur Authentication-Check)
    - Alle Access Control im Application Code
    - Aber: GARANTIERT keine Rekursion, garantiert funktionsfähig
*/

-- Lösche ALLE bisherigen Policies
DROP POLICY IF EXISTS "profiles_select_no_recursion" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_only" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- ABSOLUTE EINFACHSTE POLICIES

-- 1. SELECT: Alle authenticated User sehen alle profiles
-- (Access Control komplett im App-Layer)
CREATE POLICY "profiles_select_all_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. UPDATE: Nur eigenes Profil (oder via Service Role für Admins)
CREATE POLICY "profiles_update_own_simple"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. INSERT: Nur eigenes Profil anlegen (oder via Service Role)
CREATE POLICY "profiles_insert_own_simple"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 4. DELETE: Nur via Service Role (keine Policy für authenticated)
-- Keine DELETE Policy = sicherer

-- Dokumentation
COMMENT ON POLICY "profiles_select_all_authenticated" ON profiles IS 
  'Ultra-simple: All authenticated users can read all profiles. Fine-grained access control in application layer. Prevents RLS recursion issues.';
  
COMMENT ON POLICY "profiles_update_own_simple" ON profiles IS 
  'Users can only update their own profile. Admin operations use service role.';
  
COMMENT ON POLICY "profiles_insert_own_simple" ON profiles IS 
  'Users can create their own profile. Admin operations use service role.';
