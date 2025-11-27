import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getRoleDisplayName, getRoleBadgeColor, UserRole, UserRoleDB, isMasterRole } from '../../types/roles';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { InviteUserModal } from '../modals/InviteUserModal';
import { EditUserModal, UserToEdit } from '../modals/EditUserModal';
import { Users as UsersIcon, Search, UserPlus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { UserPackage, PLAN_CAPABILITIES } from '../../lib/planCapabilities';

type ProfileWithPackage = {
  id: string;
  tenant_id: string | null;
  role: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  skill_level: string;
  package: UserPackage;
  account_status?: string;
  manager_id?: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminUsers() {
  const { profile, tenant, loading: authLoading, refreshProfile } = useAuth();
  const [users, setUsers] = useState<ProfileWithPackage[]>([]);
  const [userAuthDetails, setUserAuthDetails] = useState<Record<string, { confirmed_at: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserToEdit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isMaster = isMasterRole(profile);

  useEffect(() => {
    if (!authLoading && profile && tenant) {
      loadUsers();
    }
  }, [authLoading, profile, tenant]);

  const loadUsers = async () => {
    if (!tenant?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const callAdminFunction = async (payload: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    if (!token) {
      throw new Error('Nicht authentifiziert');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/admin-user-management`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Fehler bei der Serveranfrage');
    }

    return result;
  };

  const handleInviteUser = async (userData: {
    email: string;
    full_name: string;
    role: UserRoleDB;
    package: UserPackage;
  }) => {
    if (!tenant?.id) return;

    setActionLoading(true);

    try {
      await callAdminFunction({
        action: 'invite',
        ...userData,
        tenant_id: tenant.id,
      });

      setSuccessMessage('Einladung erfolgreich gesendet!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadUsers();
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const loadUserAuthDetails = async (userId: string) => {
    if (!tenant?.id) return null;

    try {
      const result = await callAdminFunction({
        action: 'get_user_details',
        user_id: userId,
        tenant_id: tenant.id,
      });

      return result.auth?.confirmed_at || null;
    } catch (err) {
      console.error('Error loading user auth details:', err);
      return null;
    }
  };

  const handleEditUser = async (user: ProfileWithPackage) => {
    // Open modal immediately with available data for better performance
    setUserToEdit({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      package: user.package,
      account_status: user.account_status || 'active',
      manager_id: user.manager_id || null,
      tenant_id: user.tenant_id || undefined,
      confirmed_at: undefined, // Will be loaded async
    });
    setEditModalOpen(true);

    // Load auth details asynchronously (non-blocking)
    const confirmedAt = await loadUserAuthDetails(user.id);
    if (confirmedAt !== null) {
      setUserToEdit(prev => prev ? { ...prev, confirmed_at: confirmedAt } : null);
    }
  };

  const handleUpdateUser = async (userId: string, updates: {
    email?: string;
    full_name?: string;
    role?: UserRoleDB;
    package?: UserPackage;
    account_status?: string;
    manager_id?: string | null;
  }) => {
    if (!tenant?.id) return;

    setActionLoading(true);

    try {
      await callAdminFunction({
        action: 'update',
        user_id: userId,
        ...updates,
        tenant_id: tenant.id,
      });

      setSuccessMessage('Benutzer erfolgreich aktualisiert!');
      setTimeout(() => setSuccessMessage(''), 3000);

      if (userId === profile?.id) {
        await refreshProfile();
      }

      await loadUsers();
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async (userId: string) => {
    if (!tenant?.id) return;

    try {
      await callAdminFunction({
        action: 'resend_invite',
        user_id: userId,
        tenant_id: tenant.id,
      });
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!tenant?.id) return;
    if (userId === profile?.id) {
      setError('Sie können sich nicht selbst löschen');
      return;
    }

    setActionLoading(true);

    try {
      await callAdminFunction({
        action: 'delete',
        user_id: userId,
        tenant_id: tenant.id,
      });

      setSuccessMessage('Benutzer erfolgreich gelöscht!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setDeleteConfirm(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Benutzers');
      setDeleteConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const normalizeRole = (role: string): UserRole => {
    if (!role) return 'User';

    const normalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    const validRoles: UserRole[] = ['Master', 'Admin', 'Company', 'Teamleiter', 'Coach', 'User'];
    if (validRoles.includes(normalized as UserRole)) {
      return normalized as UserRole;
    }

    console.warn(`Unknown role: ${role}, defaulting to User`);
    return 'User';
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (authLoading) {
    return <LoadingSpinner message="Lade Benutzerverwaltung..." />;
  }

  if (!isMaster) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600">
            Nur Master-Benutzer können auf die Benutzerverwaltung zugreifen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-cyan-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
              <p className="text-gray-600">
                {tenant?.name ? `Tenant: ${tenant.name}` : 'Verwalten Sie Benutzer in Ihrem Tenant'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setInviteModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Benutzer einladen</span>
          </Button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Suche nach Name oder E-Mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">Alle Rollen</option>
              <option value="master">Master</option>
              <option value="user">User</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner message="Lade Benutzer..." />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || roleFilter !== 'all'
                  ? 'Keine Benutzer gefunden'
                  : 'Noch keine Benutzer vorhanden'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">E-Mail</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Rolle</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Paket</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Erstellt</th>
                    <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900 font-medium">
                        {user.full_name}
                        {user.id === profile?.id && (
                          <span className="ml-2 text-xs text-gray-500">(Sie)</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <Badge className={getRoleBadgeColor(normalizeRole(user.role))}>
                          {getRoleDisplayName(normalizeRole(user.role))}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-gray-100 text-gray-700">
                          {PLAN_CAPABILITIES[user.package]?.name || user.package}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(user.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            disabled={actionLoading}
                            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deleteConfirm === user.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                              >
                                Bestätigen
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={actionLoading}
                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              disabled={actionLoading || user.id === profile?.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={user.id === profile?.id ? 'Sie können sich nicht selbst löschen' : 'Löschen'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Hinweise zur Benutzerverwaltung</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Eingeladene Benutzer erhalten eine E-Mail mit einem Registrierungslink</li>
            <li>• Admin-Benutzer können andere Benutzer verwalten und Pakete zuweisen</li>
            <li>• Der letzte Admin eines Mandanten kann nicht gelöscht oder herabgestuft werden</li>
            <li>• Änderungen an E-Mail-Adressen erfordern eine Bestätigung durch den jeweiligen Benutzer</li>
            <li>• Wenn ein Benutzer seine Registrierung noch nicht abgeschlossen hat, kann die Einladung über "Bearbeiten" erneut gesendet werden</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700 italic">
              Hinweis: Master ist die höchste interne Rolle (KI Sensei). Für Mandanten und Partner ist "Admin" die höchste verfügbare Rolle.
            </p>
          </div>
        </div>
      </div>

      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteUser}
        tenantId={tenant?.id || ''}
      />

      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setUserToEdit(null);
        }}
        onUpdate={handleUpdateUser}
        onResendInvite={handleResendInvite}
        user={userToEdit}
      />
    </div>
  );
}
