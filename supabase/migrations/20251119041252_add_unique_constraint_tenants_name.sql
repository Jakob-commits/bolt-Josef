/*
  # Füge UNIQUE Constraint auf tenants.name hinzu
  
  ## Änderungen
  - Bereinigt zuerst eventuelle Duplikate
  - Fügt UNIQUE constraint auf tenants.name hinzu
  - Verhindert zukünftige Dubletten
  
  ## Wichtig
  Falls Duplikate existieren, werden ältere Einträge behalten
*/

-- Duplikate bereinigen (falls vorhanden)
DO $$
DECLARE
  duplicate_name text;
  keep_id uuid;
  delete_ids uuid[];
BEGIN
  FOR duplicate_name IN 
    SELECT name 
    FROM tenants 
    GROUP BY name 
    HAVING COUNT(*) > 1
  LOOP
    -- Ältesten Tenant behalten
    SELECT id INTO keep_id 
    FROM tenants 
    WHERE name = duplicate_name 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- IDs zum Löschen sammeln
    SELECT array_agg(id) INTO delete_ids
    FROM tenants 
    WHERE name = duplicate_name AND id != keep_id;
    
    -- Profile auf den beibehaltenen Tenant umbiegen
    UPDATE profiles 
    SET tenant_id = keep_id 
    WHERE tenant_id = ANY(delete_ids);
    
    -- Duplikate löschen
    DELETE FROM tenants WHERE id = ANY(delete_ids);
    
    RAISE NOTICE 'Duplikate für Firma "%" bereinigt, behalten: %', duplicate_name, keep_id;
  END LOOP;
END $$;

-- UNIQUE Constraint hinzufügen
ALTER TABLE tenants 
ADD CONSTRAINT tenants_name_unique UNIQUE (name);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
