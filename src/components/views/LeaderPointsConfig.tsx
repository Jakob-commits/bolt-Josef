import { useState, useEffect } from 'react';
import { Settings, TrendingUp, Award, Users, Star, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface PointsConfig {
  id: string;
  training_mode: string;
  difficulty: string;
  base_points: number;
  challenge_multiplier_win: number;
  challenge_multiplier_loss: number;
}

interface RookieConfig {
  enabled: boolean;
  rookie_period_days: number;
  rookie_bonus_factor: number;
  rookie_bonus_flat: number;
  applies_to_challenges: boolean;
  applies_to_events: boolean;
}

const TRAINING_MODES = [
  { value: 'cold_call', label: 'Cold-Call' },
  { value: 'warm_call', label: 'Warm-Call' },
  { value: 'einwand', label: 'Einwandbehandlung' },
  { value: 'abschluss', label: 'Abschlusstraining' },
  { value: 'smalltalk', label: 'Smalltalk' },
];

export function LeaderDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [rookieConfig, setRookieConfig] = useState<RookieConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'points' | 'rookie' | 'stats'>('points');

  useEffect(() => {
    if (profile && ['MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER'].includes(profile.role)) {
      loadConfig();
    }
  }, [profile]);

  if (authLoading) {
    return <LoadingSpinner message="Führungskräfte-Dashboard wird geladen..." />;
  }

  if (!profile) {
    return <LoadingSpinner message="Profil wird geladen..." />;
  }

  async function loadConfig() {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

      const { data: pointsData, error: pointsError } = await supabase
        .from('points_config')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('training_mode, difficulty');

      if (pointsError) throw pointsError;
      setPointsConfig(pointsData || []);

      const { data: rookieData, error: rookieError } = await supabase
        .from('rookie_config')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      if (rookieError) throw rookieError;
      setRookieConfig(rookieData || {
        enabled: true,
        rookie_period_days: 30,
        rookie_bonus_factor: 1.3,
        rookie_bonus_flat: 20,
        applies_to_challenges: true,
        applies_to_events: false,
      });

    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updatePointsConfig(id: string, field: string, value: number) {
    try {
      const { error } = await supabase
        .from('points_config')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setMessage('Punktekonfiguration aktualisiert');
      loadConfig();
    } catch (error) {
      console.error('Error updating points config:', error);
      setMessage('Fehler beim Aktualisieren der Konfiguration');
    }
  }

  async function updateRookieConfig(updates: Partial<RookieConfig>) {
    if (!profile?.tenant_id) return;

    try {
      const newConfig = { ...rookieConfig, ...updates };

      const { error } = await supabase
        .from('rookie_config')
        .upsert({
          tenant_id: profile.tenant_id,
          ...newConfig,
        });

      if (error) throw error;

      setRookieConfig(newConfig);
      setMessage('Rookie-Konfiguration aktualisiert');
    } catch (error) {
      console.error('Error updating rookie config:', error);
      setMessage('Fehler beim Aktualisieren der Rookie-Konfiguration');
    }
  }

  if (!profile || !['MASTER', 'ADMIN', 'FIRMA', 'TEAMLEITER'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kein Zugriff</h2>
          <p className="text-gray-600">
            Nur Führungskräfte (Firma/Teamleiter) haben Zugriff auf diesen Bereich.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-cyan-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Führungskräfte-Dashboard</h1>
          </div>
          <p className="text-gray-600">Verwalte Punktesystem, Rookie-Bonus und Team-Statistiken</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Fehler') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {message}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('points')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'points'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Punktesystem
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rookie')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'rookie'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Rookie-Bonus
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistiken
            </div>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-gray-600">Lade Konfiguration...</p>
          </div>
        ) : (
          <>
            {activeTab === 'points' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Punktekonfiguration</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Lege fest, wie viele Punkte User für Trainings und Challenges erhalten
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Modus</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Schwierigkeit</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Basispunkte</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Challenge Sieg</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Challenge Verlust</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsConfig.map((config) => (
                        <tr key={config.id} className="border-b border-gray-100">
                          <td className="py-4 px-6 text-gray-900">
                            {TRAINING_MODES.find(m => m.value === config.training_mode)?.label || config.training_mode}
                          </td>
                          <td className="py-4 px-6 text-gray-600 capitalize">{config.difficulty}</td>
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              value={config.base_points}
                              onChange={(e) => updatePointsConfig(config.id, 'base_points', parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              step="0.1"
                              value={config.challenge_multiplier_win}
                              onChange={(e) => updatePointsConfig(config.id, 'challenge_multiplier_win', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                            />
                            <span className="ml-1 text-gray-500 text-sm">x</span>
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              step="0.1"
                              value={config.challenge_multiplier_loss}
                              onChange={(e) => updatePointsConfig(config.id, 'challenge_multiplier_loss', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                            />
                            <span className="ml-1 text-gray-500 text-sm">x</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'rookie' && rookieConfig && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rookie-Bonus Konfiguration</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Der Rookie-Bonus hilft neuen Mitarbeitern, schneller aufzuschließen
                </p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Rookie-Bonus aktiviert</label>
                      <p className="text-xs text-gray-500">Wenn aktiviert, erhalten neue User zusätzliche Punkte</p>
                    </div>
                    <button
                      onClick={() => updateRookieConfig({ enabled: !rookieConfig.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        rookieConfig.enabled ? 'bg-cyan-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rookieConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rookie-Periode (Tage)
                    </label>
                    <input
                      type="number"
                      value={rookieConfig.rookie_period_days}
                      onChange={(e) => updateRookieConfig({ rookie_period_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Anzahl der Tage, in denen ein User als Rookie gilt
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus-Faktor
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={rookieConfig.rookie_bonus_factor}
                      onChange={(e) => updateRookieConfig({ rookie_bonus_factor: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Multiplikator für Basispunkte (z.B. 1.3 = +30%)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fixer Bonus (Punkte)
                    </label>
                    <input
                      type="number"
                      value={rookieConfig.rookie_bonus_flat}
                      onChange={(e) => updateRookieConfig({ rookie_bonus_flat: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Zusätzliche Punkte, die pro Training hinzugefügt werden
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Bonus bei Challenges</label>
                      <p className="text-xs text-gray-500">Gilt der Bonus auch für Challenge-Punkte?</p>
                    </div>
                    <button
                      onClick={() => updateRookieConfig({ applies_to_challenges: !rookieConfig.applies_to_challenges })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        rookieConfig.applies_to_challenges ? 'bg-cyan-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rookieConfig.applies_to_challenges ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Beispiel-Berechnung</h4>
                    <p className="text-sm text-blue-800">
                      Basispunkte: 20<br />
                      Mit Rookie-Bonus: {Math.round(20 * rookieConfig.rookie_bonus_factor + rookieConfig.rookie_bonus_flat)} Punkte
                      <br />
                      <span className="text-xs">
                        (20 × {rookieConfig.rookie_bonus_factor} + {rookieConfig.rookie_bonus_flat})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Team-Statistiken</h2>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Team-Statistiken werden in Kürze verfügbar sein</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
