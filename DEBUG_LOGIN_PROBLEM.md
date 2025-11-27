# Debug-Anleitung: Login-Problem beheben

## Das Problem bleibt bestehen?

Wenn Sie sich einloggen und die App auf dem Loader hängen bleibt, folgen Sie dieser Schritt-für-Schritt-Anleitung.

## Schritt 1: Browser Console öffnen

1. Öffnen Sie die App im Browser
2. Drücken Sie `F12` oder `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Klicken Sie auf den "Console" Tab

## Schritt 2: Login durchführen

1. Loggen Sie sich mit `hauser@ki-sensei.de` ein
2. Beobachten Sie die Console-Ausgaben

### Was Sie sehen sollten (ERFOLG):

```
[AuthContext] Loading profile for user: 27cffd10-d77d-41d5-9d81-7396077fe073
[AuthContext] Profile query result: { data: {...}, error: null }
[AuthContext] Profile data loaded: { id: "...", role: "master", ... }
[AuthContext] Role data: { roleData: { level: 1 }, roleError: null }
[AuthContext] Complete profile created: { role: "Master", role_level: 1, ... }
[AuthContext] Profile loading complete
[AuthContext] Setting loading to false
```

### Was auf ein Problem hindeutet:

#### Fall A: Keine Profile-Daten
```
[AuthContext] Profile query result: { data: null, error: null }
[AuthContext] No profile data returned from query
```
**Lösung**: Profil existiert nicht → Siehe "Profil manuell anlegen"

#### Fall B: RLS Error
```
[AuthContext] Profile query error: { code: "42501", message: "permission denied..." }
```
**Lösung**: RLS Policy Problem → Siehe "RLS Policies prüfen"

#### Fall C: Role-Lookup Error
```
[AuthContext] Role data: { roleData: null, roleError: {...} }
```
**Lösung**: roles-Tabelle Problem → Siehe "Roles-Tabelle prüfen"

#### Fall D: Network Error
```
[AuthContext] Error loading profile: NetworkError...
```
**Lösung**: Verbindungsproblem → VITE_SUPABASE_URL prüfen

## Schritt 3: Problemlösung

### A) Profil manuell anlegen

Wenn `data: null` zurückkommt:

```sql
-- In Supabase SQL Editor:
INSERT INTO profiles (
  id,
  tenant_id,
  role,
  full_name,
  email,
  package,
  skill_level,
  account_status
) VALUES (
  '27cffd10-d77d-41d5-9d81-7396077fe073',  -- Ihre User-ID aus auth.users
  '4907d6c2-63a8-4240-b6fa-75bfaba098d0',  -- Tenant-ID
  'master',
  'Josef Hauser',
  'hauser@ki-sensei.de',
  'pro',
  'anfaenger',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  package = EXCLUDED.package,
  account_status = EXCLUDED.account_status;
```

### B) RLS Policies prüfen

Wenn RLS Error auftritt:

```sql
-- Prüfe aktuelle Policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Sollte zeigen:
-- profiles_select_all_authenticated | SELECT | true
```

Falls die Policy fehlt:

```sql
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
```

### C) Roles-Tabelle prüfen

Wenn Role-Lookup fehlschlägt:

```sql
-- Prüfe ob roles existieren
SELECT * FROM roles ORDER BY level;

-- Sollte mindestens diese Rollen haben:
-- master (level 1)
-- admin (level 2)
-- user (level 5)
```

Falls roles fehlen:

```sql
INSERT INTO roles (name, level) VALUES
  ('master', 1),
  ('admin', 2),
  ('teamleiter', 3),
  ('company', 4),
  ('user', 5)
ON CONFLICT (name) DO NOTHING;
```

### D) Environment-Variablen prüfen

```bash
# In project root:
cat .env

# Sollte enthalten:
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# Nach Änderung IMMER neu builden:
npm run dev
```

## Schritt 4: Weitere Tests

### Test 1: Direkter SQL-Test

```sql
-- Simuliere Frontend-Query
SELECT
  id,
  role,
  full_name,
  email,
  package,
  tenant_id
FROM profiles
WHERE id = '27cffd10-d77d-41d5-9d81-7396077fe073';

-- Erwartung: 1 Row mit role='master', package='pro'
```

### Test 2: Auth-Status prüfen

Im Browser Console:

```javascript
// Session prüfen
const { data } = await supabase.auth.getSession();
console.log('Session:', data);

// Profil direkt laden
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.session.user.id)
  .maybeSingle();
console.log('Profile:', profile);
```

## Schritt 5: Häufige Ursachen

### 1. Cookies/Storage Problem
- **Lösung**: Browser-Cache leeren, neu einloggen
- **Test**: Private/Incognito-Fenster versuchen

### 2. Alte Build-Artefakte
```bash
rm -rf dist node_modules/.vite
npm run dev
```

### 3. Multiple Browser-Tabs
- **Problem**: Mehrere Tabs mit unterschiedlichen Auth-States
- **Lösung**: Alle Tabs schließen, neu starten

### 4. Service Worker
- **Problem**: Alter Service Worker cached alte Version
- **Lösung**: In DevTools → Application → Service Workers → Unregister

## Schritt 6: Wenn alles fehlschlägt

### Nuclear Option: Kompletter Reset

```bash
# 1. Logout im Browser
# 2. Cache leeren
# 3. Node modules neu installieren
rm -rf node_modules dist
npm install

# 4. Environment-Variablen verifizieren
cat .env

# 5. Fresh build
npm run dev

# 6. Im Browser: Hard Reload (Cmd+Shift+R / Ctrl+Shift+R)
```

### Support-Daten sammeln

Wenn immer noch Probleme:

1. **Console Output**: Alle Logs kopieren (besonders [AuthContext] Zeilen)
2. **Network Tab**: Supabase API Calls prüfen (Filter: `supabase`)
3. **SQL Query Result**:
   ```sql
   SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
   ```
4. **RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

## Erwartetes Verhalten nach Fix

1. **Login-Screen**
   - Email/Password eingeben
   - "Anmelden" klicken

2. **Loading-Screen** (1-3 Sekunden)
   - Sales Sensei Logo
   - Spinner
   - "Sales Sensei lädt..."

3. **Dashboard**
   - Navigation links
   - Dashboard-Karten sichtbar
   - Profil-Icon oben rechts
   - Rolle "Master" angezeigt
   - Package "Pro" Badge sichtbar

## Quick-Checks

✅ **Profil existiert?**
```sql
SELECT COUNT(*) FROM profiles WHERE id = '27cffd10-d77d-41d5-9d81-7396077fe073';
-- Sollte 1 sein
```

✅ **RLS Policy aktiv?**
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'profiles_select_all_authenticated';
-- Sollte 1 sein
```

✅ **Roles existieren?**
```sql
SELECT COUNT(*) FROM roles WHERE name = 'master';
-- Sollte 1 sein
```

✅ **Environment richtig?**
```bash
grep VITE_SUPABASE_URL .env | grep -v '^#'
-- Sollte URL zeigen
```

## Kontakt

Wenn diese Anleitung nicht hilft, bitte bereitstellen:
1. Console-Logs (kompletter Output)
2. SQL Query Results (von oben)
3. Browser & Version
4. Genaue Schritte zum Reproduzieren
