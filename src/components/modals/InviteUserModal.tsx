import { useState } from 'react';
import { X, UserPlus, Mail, User as UserIcon, Shield, Package } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PLAN_CAPABILITIES, UserPackage } from '../../lib/planCapabilities';
import { UserRoleDB, getRoleDisplayName } from '../../types/roles';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userData: {
    email: string;
    full_name: string;
    role: UserRoleDB;
    package: UserPackage;
  }) => Promise<void>;
  tenantId: string;
}

const AVAILABLE_ROLES: UserRoleDB[] = ['user', 'coach', 'teamleiter', 'admin', 'master'];

export function InviteUserModal({ isOpen, onClose, onInvite, tenantId }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRoleDB>('user');
  const [selectedPackage, setSelectedPackage] = useState<UserPackage>('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
      await onInvite({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        package: selectedPackage,
      });

      setEmail('');
      setFullName('');
      setRole('user');
      setSelectedPackage('starter');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Einladen des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setFullName('');
      setRole('user');
      setSelectedPackage('starter');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-900">Neuen Benutzer einladen</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Der eingeladene Benutzer erhält eine E-Mail mit einem Link zur Registrierung.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max.mustermann@beispiel.de"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rolle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRoleDB)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {getRoleDisplayName(r.charAt(0).toUpperCase() + r.slice(1))}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Master und Admin können andere Benutzer verwalten
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paket <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value as UserPackage)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {(Object.keys(PLAN_CAPABILITIES) as UserPackage[]).map((pkg) => (
                    <option key={pkg} value={pkg}>
                      {PLAN_CAPABILITIES[pkg].name} - {PLAN_CAPABILITIES[pkg].price}/Monat
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Bestimmt die verfügbaren Features für diesen Benutzer
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {loading ? 'Lädt...' : 'Einladung senden'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
