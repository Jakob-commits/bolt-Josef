import { useState, useEffect } from 'react';
import { User, Mail, Lock, Check, CreditCard, Zap, Crown } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getRoleDisplayName, getRoleBadgeColor, isMasterRole } from '../../types/roles';
import { getSkillLevelColor } from '../../lib/skillUtils';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PLAN_CAPABILITIES, UserPackage } from '../../lib/planCapabilities';

const PLAN_ICONS = {
  starter: Zap,
  premium: CreditCard,
  pro: Crown,
} as const;

const PLAN_COLORS = {
  starter: {
    border: 'border-cyan-500',
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
  },
  premium: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
  },
  pro: {
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
  },
} as const;

export function Profile() {
  const { user, profile, tenant, skillLevel, loading: authLoading, refreshProfile } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [switchingPackage, setSwitchingPackage] = useState(false);

  const currentPlan: UserPackage = profile?.package || 'starter';
  const isMaster = isMasterRole(profile);

  if (authLoading) {
    return <LoadingSpinner message="Profil wird geladen..." />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-500">Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  async function handleUpdatePassword() {
    if (newPassword !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      setMessage('Fehler beim Aktualisieren des Passworts');
      console.error(error);
    } else {
      setMessage('Passwort erfolgreich aktualisiert');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleSwitchPackage(newPackage: UserPackage) {
    if (!isMaster) {
      setMessage('Nur Master-Accounts dürfen das Paket wechseln');
      return;
    }

    if (newPackage === currentPlan) {
      return;
    }

    setSwitchingPackage(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ package: newPackage })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();

      const planName = PLAN_CAPABILITIES[newPackage].name;
      setMessage(`Erfolgreich zu ${planName} gewechselt!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Package switch error:', error);
      setMessage('Fehler beim Paketwechsel');
    } finally {
      setSwitchingPackage(false);
    }
  }

  const currentPlanCap = PLAN_CAPABILITIES[currentPlan];
  const CurrentPlanIcon = PLAN_ICONS[currentPlan];
  const currentColors = PLAN_COLORS[currentPlan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mein Profil</h1>
          <p className="text-gray-600 mt-1">Verwalte deine Kontoinformationen und Einstellungen</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Erfolgreich') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-cyan-600" />
              <h2 className="text-xl font-semibold text-gray-900">Profilinformationen</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <p className="text-lg font-semibold text-gray-900">{profile.full_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rolle</label>
                <Badge className={getRoleBadgeColor(profile.role)}>
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firma</label>
                <p className="text-gray-900">{tenant?.name || 'Kein Tenant zugeordnet'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill-Level</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{skillLevel.percent} Punkte</span>
                      <Badge className={getSkillLevelColor(skillLevel.label)}>
                        {skillLevel.label}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${skillLevel.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Passwort ändern</span>
                </button>
              </div>
            </div>
          </Card>

          <Card className={`p-6 border-2 ${currentColors.border} ${currentColors.bg}`}>
            <div className="flex items-center gap-3 mb-6">
              <CurrentPlanIcon className={`w-6 h-6 ${currentColors.icon}`} />
              <h2 className="text-xl font-semibold text-gray-900">Aktuelles Paket</h2>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{currentPlanCap.name}</h3>
                {isMaster && (
                  <Badge className="bg-rose-100 text-rose-700 text-xs">Master</Badge>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-600">{currentPlanCap.price}/Monat</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Enthaltene Features:</h4>
              {currentPlanCap.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isMaster ? 'Paket wechseln' : 'Upgrade-Optionen'}
          </h2>
          {isMaster ? (
            <p className="text-gray-600">
              Als Master kannst du frei zwischen den Paketen wechseln, um Funktionen zu testen.
            </p>
          ) : (
            <p className="text-gray-600">
              Wähle das passende Paket für deine Anforderungen.
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {(Object.keys(PLAN_CAPABILITIES) as UserPackage[]).map((planKey) => {
            const plan = PLAN_CAPABILITIES[planKey];
            const Icon = PLAN_ICONS[planKey];
            const colors = PLAN_COLORS[planKey];
            const isCurrent = planKey === currentPlan;

            return (
              <Card
                key={planKey}
                className={`p-6 transition-all flex flex-col ${isCurrent ? 'ring-2 ring-cyan-500 shadow-lg' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <p className="text-2xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-600">/Monat</span>
                  </p>
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSwitchPackage(planKey)}
                  disabled={!isMaster || isCurrent || switchingPackage}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isMaster
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  title={
                    !isMaster
                      ? 'Nur Master-Accounts können das Paket wechseln'
                      : isCurrent
                      ? 'Dies ist dein aktuelles Paket'
                      : ''
                  }
                >
                  {switchingPackage
                    ? 'Wechsle...'
                    : isCurrent
                    ? 'Aktuelles Paket'
                    : isMaster
                    ? `Zu ${plan.name} wechseln`
                    : 'Kontaktiere Admin'}
                </button>
              </Card>
            );
          })}
        </div>

        {!isMaster && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Kontaktiere deinen Administrator, um dein Paket zu ändern.
            </p>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Passwort ändern</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Mindestens 6 Zeichen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Passwort wiederholen"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setMessage('');
                    }}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50"
                  >
                    {loading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
