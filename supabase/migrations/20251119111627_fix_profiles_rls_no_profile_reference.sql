/*
  # Fix Profiles RLS - NO profiles Reference At All

  1. Root Cause
    - Jede Policy die profiles in Subquery referenziert führt zu Rekursion
    - profiles SELECT darf NICHT auf profiles zugreifen
  
  2. Solution
    - Erstelle separate Hilfstabelle/View für current_user_tenant
    - ODER: Nutze nur user_profiles + companies für Tenant-Info
    - ODER: Einfachste Lösung: Jeder sieht alle authenticated Profiles (Tenant-Check im App-Layer)
  
  3. Implementierung
    - CREATE VIEW für current_user_tenant
    - Policy nutzt nur diese View, nie profiles
*/

-- Erstelle Helper-View für aktuellen User (ohne profiles-Referenz)
CREATE OR REPLACE VIEW current_user_info AS
SELECT 
  up.user_id,
  up.company_id as tenant_id,
  up.full_name,
  up.email
FROM user_profiles up
WHERE up.user_id = auth.uid();

-- Grant auf View
GRANT SELECT ON current_user_info TO authenticated;

-- Lösche alte Policy
DROP POLICY IF EXISTS "profiles_select_final" ON profiles;

-- NEUE POLICY: Nutzt NUR current_user_info View (keine profiles-Referenz)
CREATE POLICY "profiles_select_no_recursion"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Eigenes Profil
    id = auth.uid()
    -- ODER: Gleiches Tenant (via View, KEINE profiles-Referenz)
    OR tenant_id IN (SELECT tenant_id FROM current_user_info)
  );

COMMENT ON VIEW current_user_info IS 
  'Helper view for RLS policies - provides current user tenant without referencing profiles table';
COMMENT ON POLICY "profiles_select_no_recursion" ON profiles IS 
  'Uses current_user_info view to avoid recursion on profiles table';
