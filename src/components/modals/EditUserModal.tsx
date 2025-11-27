import { useState, useEffect } from 'react';
import { X, Edit, Mail, User as UserIcon, Shield, Package, RefreshCw, Check, AlertCircle, KeyRound, UserCog, Ban } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { PLAN_CAPABILITIES, UserPackage } from '../../lib/planCapabilities';
import { UserRoleDB, getRoleDisplayName } from '../../types/roles';
import { supabase } from '../../lib/supabase';

export interface UserToEdit {
  id: string;
  email: string;
  full_name: string;
  role: string;
  package: UserPackage;
  confirmed_at?: string | null;
  account_status?: string;
  manager_id?: string | null;
  tenant_id?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, updates: {
    email?: string;
    full_name?: string;
    role?: UserRoleDB;
    package?: UserPackage;
    account_status?: string;
    manager_id?: string | null;
  }) => Promise<void>;
  onResendInvite?: (userId: string) => Promise<void>;
  user: UserToEdit | null;
}

const AVAILABLE_ROLES: UserRoleDB[] = ['user', 'coach', 'teamleiter', 'admin', 'master'];

const ACCOUNT_STATUSES = [
  { value: 'active', label: 'Aktiviert', color: 'bg-green-100 text-green-700' },
  { value: 'pending', label: 'Ausstehend', color: 'bg-amber-100 text-amber-700' },
  { value: 'paused', label: 'Pausiert', color: 'bg-blue-100 text-blue-700' },
  { value: 'archived', label: 'Archiviert', color: 'bg-gray-100 text-gray-700' },
];

interface Manager {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

export function EditUserModal({ isOpen, onClose, onUpdate, onResendInvite, user }: EditUserModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRoleDB>('user');
  const [selectedPackage, setSelectedPackage] = useState<UserPackage>('starter');
  const [accountStatus, setAccountStatus] = useState('active');
  const [managerId, setManagerId] = useState<string | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFullName(user.full_name);
      setRole(user.role.toLowerCase() as UserRoleDB);
      setSelectedPackage(user.package);
      setAccountStatus(user.account_status || 'active');
      setManagerId(user.manager_id || null);
      setInviteSuccess(false);
      setPasswordResetSuccess(false);

      // Load managers asynchronously
      loadManagers(user.tenant_id);
    }
  }, [user]);

  const loadManagers = async (tenantId?: string) => {
    if (!tenantId) return;

    setLoadingManagers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .eq('tenant_id', tenantId)
        .in('role', ['Teamleiter', 'Admin', 'Master'])
        .neq('id', user?.id || '') // Don't allow user to be their own manager
        .order('full_name');

      if (error) throw error;
      setManagers(data || []);
    } catch (err) {
      console.error('Error loading managers:', err);
    } finally {
      setLoadingManagers(false);
    }
  };

  if (!isOpen || !user) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Bitte geben Sie einen Namen ein');
      return;
    }

    if (!email.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    if (!validateEmail(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    setLoading(true);

    try {
      const updates: any = {};

      if (email.trim() !== user.email) {
        updates.email = email.trim();
      }

      if (fullName.trim() !== user.full_name) {
        updates.full_name = fullName.trim();
      }

      if (role !== user.role.toLowerCase()) {
        updates.role = role;
      }

      if (selectedPackage !== user.package) {
        updates.package = selectedPackage;
      }

      if (accountStatus !== (user.account_status || 'active')) {
        updates.account_status = accountStatus;
      }

      if (managerId !== (user.manager_id || null)) {
        updates.manager_id = managerId;
      }

      if (Object.keys(updates).length === 0) {
        setError('Keine Änderungen vorgenommen');
        setLoading(false);
        return;
      }

      await onUpdate(user.id, updates);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !resendingInvite && !resettingPassword) {
      setError('');
      setInviteSuccess(false);
      setPasswordResetSuccess(false);
      onClose();
    }
  };

  const handleResendInvite = async () => {
    if (!onResendInvite || !user) return;

    setResendingInvite(true);
    setError('');
    setInviteSuccess(false);

    try {
      await onResendInvite(user.id);
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden der Einladung');
    } finally {
      setResendingInvite(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setResettingPassword(true);
    setError('');
    setPasswordResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setPasswordResetSuccess(true);
      setTimeout(() => setPasswordResetSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Zurücksetzen des Passworts');
    } finally {
      setResettingPassword(false);
    }
  };

  const isConfirmed = !!user?.confirmed_at;
  const isPending = accountStatus === 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Edit className="w-6 h-6 text-cyan-600" />
                <h2 className="text-2xl font-bold text-gray-900">Benutzer bearbeiten</h2>
              </div>
              <p className="text-sm text-gray-600">Profil- und Zugriffsrechte verwalten</p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading || resendingInvite || resettingPassword}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Einladungsmail wurde erneut an {user.email} gesendet
            </div>
          )}

          {passwordResetSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Passwort-Reset-E-Mail wurde an {user.email} gesendet
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basisdaten Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Basisdaten
              </h3>
              <div className="space-y-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Max Mustermann"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="max.mustermann@beispiel.de"
                    disabled={loading}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Änderungen der E-Mail-Adresse erfordern eine Bestätigung durch den Benutzer
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rolle <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRoleDB)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {getRoleDisplayName(r.charAt(0).toUpperCase() + r.slice(1))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paket <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value as UserPackage)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {(Object.keys(PLAN_CAPABILITIES) as UserPackage[]).map((pkg) => (
                      <option key={pkg} value={pkg}>
                        {PLAN_CAPABILITIES[pkg].name} - {PLAN_CAPABILITIES[pkg].price}/Monat
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Zugriff & Status Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Zugriff & Status
              </h3>
              <div className="space-y-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accountstatus <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {ACCOUNT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {accountStatus === 'archived' && (
                    <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Archivierte Accounts können sich nicht mehr einloggen
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Führungskraft
                  </label>
                  {loadingManagers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Lade Führungskräfte...
                    </div>
                  ) : (
                    <>
                      <select
                        value={managerId || ''}
                        onChange={(e) => setManagerId(e.target.value || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <option value="">Keine Führungskraft</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name} ({getRoleDisplayName(manager.role)})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Optional: ordne diesem Benutzer eine Führungskraft zu. Sichtbar in Auswertungen & Reports
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sicherheit & Einladungen Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Sicherheit & Einladungen
              </h3>
              <div className="space-y-3 pl-6">
                {/* Password Reset Button */}
                <div className="flex items-start gap-3">
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resettingPassword || loading || !email}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <KeyRound className={`w-4 h-4 ${resettingPassword ? 'animate-spin' : ''}`} />
                    {resettingPassword ? 'Sendet...' : 'Passwort zurücksetzen'}
                  </Button>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">
                      Sendet eine Passwort-Reset-E-Mail an den Benutzer
                    </p>
                  </div>
                </div>

                {/* Resend Invite Button */}
                {onResendInvite && (
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      onClick={handleResendInvite}
                      disabled={resendingInvite || loading || !isPending}
                      className={`text-sm px-4 py-2 flex items-center gap-2 ${
                        isPending
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${resendingInvite ? 'animate-spin' : ''}`} />
                      {resendingInvite ? 'Sendet...' : 'Einladungsmail erneut senden'}
                    </Button>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">
                        {isPending
                          ? 'Sendet die Einladungsmail erneut an den Benutzer'
                          : 'Nur für ausstehende Einladungen verfügbar'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-2 pt-2">
                  {isConfirmed ? (
                    <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Account aktiviert
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Einladung ausstehend
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleClose}
                disabled={loading || resendingInvite || resettingPassword}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading || resendingInvite || resettingPassword}
                className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {loading ? 'Speichert...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
