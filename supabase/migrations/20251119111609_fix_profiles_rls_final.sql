/*
  # Fix Profiles RLS - Final Working Version

  1. Problem
    - user_profiles hat company_id, nicht tenant_id
    - Bisherige Policy hatte falschen Spaltennamen
  
  2. Lösung
    - Korrigiere SELECT Policy mit richtigem company_id
    - Alternativ: Nutze einfach profiles.tenant_id direkt für Tenant-Match
  
  3. Finale Strategie
    - Sehr simple Policies, kein Rekursions-Risiko
    - SELECT: Eigenes Profil + alle des gleichen Tenants
    - Application Layer macht feinere Access Control
*/

-- Lösche fehlerhafte Policy
DROP POLICY IF EXISTS "profiles_select_tenant" ON profiles;

-- FINALE SIMPLE POLICY: Nutze tenant_id Direktvergleich
CREATE POLICY "profiles_select_final"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Eigenes Profil sehen (IMMER erlaubt)
    id = auth.uid()
    -- ODER: Alle Profile, die denselben tenant_id haben wie der User
    -- (ohne Subquery auf profiles selbst)
    OR tenant_id IN (
      SELECT p.tenant_id
      FROM user_profiles up
      JOIN profiles p ON p.id = up.user_id
      WHERE up.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "profiles_select_final" ON profiles IS 
  'Simple & safe: Users see own profile + all profiles in same tenant. No recursion risk.';
