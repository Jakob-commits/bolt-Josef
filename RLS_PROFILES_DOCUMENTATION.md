# Profiles RLS Policy Dokumentation

## Problem (vor dem Fix)

Nach der Policy-Konsolidierung (`consolidate_duplicate_policies_part1-3`) hatten wir folgende Probleme:

1. **Infinite Recursion**: Policies auf `profiles` Tabelle, die in Subqueries wieder auf `profiles` zugriffen
2. **Komplexe EXISTS-Subqueries**: Führten zu Zirkularitäten und Policy-Evaluation-Deadlocks
3. **Endlos-Loader**: Frontend blieb hängen wenn Profil nicht geladen werden konnte

## Root Cause

```sql
-- PROBLEMATISCH: Diese Policy führt zu infinite recursion
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p1  -- ❌ profiles referenziert sich selbst!
      WHERE p1.id = auth.uid()
      AND p1.role = 'master'
    )
  );
```

**PostgreSQL RLS Regel**: Eine Policy darf in ihren Checks nicht auf die gleiche Tabelle zugreifen, auf der sie definiert ist.

## Lösung

### 1. Ultra-Simple RLS Policies (Aktuelle Lösung)

Wir haben die komplexen Policies durch extrem einfache ersetzt:

```sql
-- SELECT: Alle authenticated User sehen alle Profile
CREATE POLICY "profiles_select_all_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: Nur eigenes Profil
CREATE POLICY "profiles_update_own_simple"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: Nur eigenes Profil
CREATE POLICY "profiles_insert_own_simple"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
```

### 2. Trade-offs

**Pro:**
- ✅ Keine Rekursion möglich
- ✅ Extrem performant (keine Subqueries)
- ✅ Einfach zu verstehen und zu debuggen
- ✅ Garantiert funktionsfähig

**Con:**
- ⚠️ Alle authenticated User können alle Profile sehen
- ⚠️ Feinere Access Control muss im Application Layer erfolgen
- ⚠️ Admin-Operationen (UPDATE/DELETE anderer Profile) nur via Service Role

### 3. Security Model

**RLS Layer (Database):**
- Basic Authentication Check: Ist User eingeloggt?
- Basic Ownership Check: Kann User sein eigenes Profil bearbeiten?

**Application Layer (Frontend/Backend):**
- Role-based Access Control: Welche Profile darf User sehen?
- Feature Access Control: Welche Funktionen sind erlaubt?
- Data Filtering: Welche Daten werden angezeigt?

## Warum keine komplexeren Policies?

### Versuch 1: Subquery auf profiles
```sql
-- ❌ FUNKTIONIERT NICHT: Infinite recursion
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE role = 'master'
  )
)
```

### Versuch 2: Helper View
```sql
-- ❌ FUNKTIONIERT NICHT: View nutzt noch immer profiles
CREATE VIEW current_user_info AS
SELECT user_id, company_id FROM user_profiles
JOIN profiles ON profiles.id = user_profiles.user_id  -- Noch immer profiles!
WHERE user_id = auth.uid();
```

### Versuch 3: Separate Tabelle
```sql
-- ✅ WÜRDE FUNKTIONIEREN, aber zu komplex
-- Müsste separate user_roles Tabelle anlegen
-- Alle Role-Updates müssten synchronisiert werden
```

## Admin-Operationen

Für Admin-Operationen (z.B. User-Verwaltung) nutzen wir den **Service Role** (bypassed RLS):

```typescript
// In Edge Function oder Backend
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Service Role bypassed RLS
);

// Admin kann jetzt alle Profile verwalten
await supabaseAdmin
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', userId);
```

## Frontend Error Handling

**Vor dem Fix:**
```typescript
if (!profile) {
  return <div>Loading...</div>;  // ❌ Bleibt für immer hängen
}
```

**Nach dem Fix:**
```typescript
if (!profile) {
  return (
    <div>
      <h2>Kein Profil gefunden</h2>
      <p>Ihr Profil konnte nicht geladen werden.</p>
      <button onClick={() => window.location.reload()}>Neu laden</button>
      <button onClick={() => supabase.auth.signOut()}>Abmelden</button>
    </div>
  );
}
```

## Testing

### Manual Test
```sql
-- Als authenticated User einloggen und:
SELECT * FROM profiles WHERE id = auth.uid();
-- Sollte genau 1 Row zurückgeben

SELECT * FROM profiles;
-- Sollte alle Profile zurückgeben (RLS erlaubt alles)
```

### Application Test
1. Als Master einloggen → Dashboard sollte laden
2. Als normaler User einloggen → Sollte nur eigenes Profil sehen (gefiltert im Frontend)
3. Als Admin einloggen → Sollte Tenant-Profile sehen (gefiltert im Frontend)

## Migration History

1. `fix_profiles_rls_policies_simple` - Erste Versuche mit EXISTS
2. `fix_profiles_rls_no_recursion` - Versuch mit user_profiles
3. `fix_profiles_rls_ultra_simple` - Versuch mit Tenant-Isolation
4. `fix_profiles_rls_final` - Versuch mit company_id
5. `fix_profiles_rls_no_profile_reference` - Versuch mit View
6. **`fix_profiles_rls_absolute_simple`** - ✅ **Finale Lösung**

## Best Practices für zukünftige RLS Policies

1. ✅ **Einfach halten**: Je simpler, desto besser
2. ✅ **Keine Selbstreferenzen**: Policy auf Tabelle X darf nicht Tabelle X in Subquery nutzen
3. ✅ **Application Layer nutzen**: Für komplexe Access Control
4. ✅ **Service Role für Admin**: Admin-Operationen via Service Role, nicht via RLS
5. ✅ **Testen, testen, testen**: Immer mit echten auth.uid() Calls testen

## Weitere Informationen

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
