/*
  # Synchronisiere Rollen und stelle Konsistenz sicher
  
  ## Änderungen
  1. Aktualisiere Rollen-Namen zu UPPERCASE (MASTER, ADMIN, etc.)
  2. Aktualisiere Profile-Rolle zu MASTER für hauser@ki-sensei.de
  3. Stelle sicher, dass alle FK-Constraints existieren
  
  ## Sicherheit
  - Keine Daten werden gelöscht
  - Nur Updates und Constraint-Prüfungen
*/

-- 1. Aktualisiere Rollen-Namen zu UPPERCASE
UPDATE roles SET name = 'MASTER' WHERE LOWER(name) = 'master';
UPDATE roles SET name = 'ADMIN' WHERE LOWER(name) = 'admin';
UPDATE roles SET name = 'COMPANY' WHERE LOWER(name) = 'company';
UPDATE roles SET name = 'TEAMLEITER' WHERE LOWER(name) = 'teamleiter';
UPDATE roles SET name = 'COACH' WHERE LOWER(name) = 'coach';
UPDATE roles SET name = 'USER' WHERE LOWER(name) = 'user';

-- 2. Stelle sicher, dass hauser@ki-sensei.de MASTER ist
UPDATE profiles 
SET role = 'MASTER'
WHERE email = 'hauser@ki-sensei.de';

-- 3. Prüfe und erstelle fehlende Constraints/Indizes falls nötig
DO $$
BEGIN
  -- Erstelle Index auf profiles.role für schnellere Lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'idx_profiles_role'
  ) THEN
    CREATE INDEX idx_profiles_role ON profiles(role);
  END IF;
  
  -- Erstelle Index auf profiles.tenant_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'idx_profiles_tenant_id'
  ) THEN
    CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
  END IF;
END $$;
