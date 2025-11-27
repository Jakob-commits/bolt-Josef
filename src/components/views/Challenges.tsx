import { useState, useEffect } from 'react';
import { Swords, Plus, Clock, CheckCircle, XCircle, Trophy, AlertCircle, ArrowRight, TrendingUp, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import {
  Challenge,
  ChallengeWithDirection,
  enrichChallengeWithDirection,
  getChallengeStatusColor,
  getChallengeStatusLabel,
  getDirectionBadgeColor,
  getDirectionLabel,
  getChallengeDescription,
  calculateRemainingTime,
} from '../../lib/challengeUtils';
import {
  getAllowedDifficulties,
  calculatePointsBonus,
  getPointsBonusText,
  getDifficultyLevel,
  getDifficultyLabel,
} from '../../lib/difficultyUtils';

type ViewFilter = 'all' | 'incoming' | 'outgoing';

interface UserOption {
  id: string;
  full_name: string;
  skill_level?: string;
}

const TRAINING_MODES = [
  { value: 'cold_call', label: 'Cold-Call' },
  { value: 'warm_call', label: 'Warm-Call' },
  { value: 'einwand', label: 'Einwandbehandlung' },
  { value: 'abschluss', label: 'Abschlusstraining' },
  { value: 'smalltalk', label: 'Smalltalk' },
];

export function Challenges() {
  const { profile, loading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithDirection[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedMode, setSelectedMode] = useState('cold_call');
  const [selectedDifficulty, setSelectedDifficulty] = useState('anfaenger');
  const [message, setMessage] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  useEffect(() => {
    if (profile) {
      loadChallenges();
      loadUsers();
    }
  }, [profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChallenges(prev =>
        prev.map(c => ({
          ...c,
          remainingTime: calculateRemainingTime(c.expires_at),
          isExpired: c.expires_at ? new Date(c.expires_at).getTime() <= Date.now() : false,
        }))
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (authLoading) {
    return <LoadingSpinner message="Challenges werden geladen..." />;
  }

  if (!profile) {
    return <LoadingSpinner message="Profil wird geladen..." />;
  }

  async function loadChallenges() {
    if (!profile) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          tenant_id,
          challenger_id,
          opponent_id,
          status,
          training_mode,
          difficulty,
          winner_id,
          loser_id,
          revenge_parent_id,
          points_awarded,
          created_at,
          start_at,
          accepted_at,
          expires_at,
          completed_at,
          challenger:profiles!challenges_challenger_id_fkey(full_name, email),
          opponent:profiles!challenges_opponent_id_fkey(full_name, email)
        `)
        .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched: ChallengeWithDirection[] = (data || []).map((c: any) =>
        enrichChallengeWithDirection(
          {
            id: c.id,
            tenant_id: c.tenant_id,
            challenger_id: c.challenger_id,
            opponent_id: c.opponent_id,
            status: c.status,
            training_mode: c.training_mode,
            difficulty: c.difficulty,
            winner_id: c.winner_id,
            loser_id: c.loser_id,
            revenge_parent_id: c.revenge_parent_id,
            points_awarded: c.points_awarded,
            created_at: c.created_at,
            start_at: c.start_at,
            accepted_at: c.accepted_at,
            expires_at: c.expires_at,
            completed_at: c.completed_at,
            challenger: c.challenger,
            opponent: c.opponent,
          },
          profile.id
        )
      );

      setChallenges(enriched);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, skill_level')
        .eq('tenant_id', profile.tenant_id)
        .neq('id', profile.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function createChallenge() {
    if (!profile || !selectedUser) {
      setMessage('Bitte wähle einen Gegner aus');
      return;
    }

    try {
      const activeChallenges = challenges.filter(
        c => c.status === 'pending' || c.status === 'accepted' || c.status === 'active'
      );

      if (activeChallenges.length >= 3) {
        setMessage('Du hast bereits 3 aktive Challenges. Bitte schließe eine ab, bevor du eine neue erstellst.');
        return;
      }

      const existingChallenge = activeChallenges.find(
        c =>
          (c.challenger_id === profile.id && c.opponent_id === selectedUser) ||
          (c.opponent_id === profile.id && c.challenger_id === selectedUser)
      );

      if (existingChallenge) {
        setMessage('Es gibt bereits eine aktive Challenge mit diesem Gegner');
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('challenges').insert({
        tenant_id: profile.tenant_id,
        challenger_id: profile.id,
        opponent_id: selectedUser,
        training_mode: selectedMode,
        difficulty: selectedDifficulty,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      setMessage('Challenge erfolgreich erstellt!');
      setShowCreateModal(false);
      setSelectedUser('');
      loadChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      setMessage('Fehler beim Erstellen der Challenge');
    }
  }

  async function acceptChallenge(challengeId: string) {
    try {
      const now = new Date();
      const startAt = now;
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'active',
          accepted_at: startAt.toISOString(),
          start_at: startAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', challengeId);

      if (error) throw error;

      setMessage('Challenge angenommen! Viel Erfolg!');
      loadChallenges();
    } catch (error) {
      console.error('Error accepting challenge:', error);
      setMessage('Fehler beim Annehmen der Challenge');
    }
  }

  async function declineChallenge(challengeId: string) {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (error) throw error;

      setMessage('Challenge abgelehnt');
      loadChallenges();
    } catch (error) {
      console.error('Error declining challenge:', error);
      setMessage('Fehler beim Ablehnen der Challenge');
    }
  }

  function confirmDeleteChallenge(challengeId: string) {
    setChallengeToDelete(challengeId);
    setShowDeleteConfirm(true);
  }

  async function deleteChallenge() {
    if (!challengeToDelete) return;

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeToDelete);

      if (error) throw error;

      setMessage('Challenge erfolgreich gelöscht');
      setShowDeleteConfirm(false);
      setChallengeToDelete(null);
      loadChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      setMessage('Fehler beim Löschen der Challenge');
      setShowDeleteConfirm(false);
      setChallengeToDelete(null);
    }
  }

  const isAdminOrMaster = profile?.role === 'Master' || profile?.role === 'Admin';

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case 'anfaenger':
        return 'text-green-600';
      case 'fortgeschritten':
        return 'text-blue-600';
      case 'profi':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }

  const allowedDifficulties = getAllowedDifficulties(profile?.skill_level || 'anfaenger');
  const pointsBonus = calculatePointsBonus(profile?.skill_level || 'anfaenger', selectedDifficulty);
  const bonusText = getPointsBonusText(pointsBonus);

  const filteredChallenges = challenges.filter(c => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'incoming') return c.direction === 'incoming';
    if (viewFilter === 'outgoing') return c.direction === 'outgoing';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Swords className="w-8 h-8 text-cyan-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Challenges</h1>
            </div>
            <p className="text-gray-600">Fordere deine Kollegen heraus und vergleicht eure Sales-Performance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Neue Challenge</span>
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes('Fehler') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setViewFilter('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewFilter === 'all'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Alle ({challenges.length})
          </button>
          <button
            onClick={() => setViewFilter('incoming')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewFilter === 'incoming'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Eingehend ({challenges.filter(c => c.direction === 'incoming').length})
          </button>
          <button
            onClick={() => setViewFilter('outgoing')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewFilter === 'outgoing'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Ausgehend ({challenges.filter(c => c.direction === 'outgoing').length})
          </button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <p className="mt-4 text-gray-600">Lade Challenges...</p>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Noch keine Challenges vorhanden</p>
              <p className="text-sm text-gray-500">Fordere jemanden heraus, um zu beginnen!</p>
            </div>
          ) : (
            filteredChallenges.map(challenge => (
              <div
                key={challenge.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    <Badge className={getDirectionBadgeColor(challenge.direction)}>
                      {getDirectionLabel(challenge.direction)}
                    </Badge>
                    <Badge className={getChallengeStatusColor(challenge.status)}>
                      {getChallengeStatusLabel(challenge.status)}
                    </Badge>
                    {challenge.revenge_parent_id && (
                      <Badge className="bg-orange-100 text-orange-800">Revanche</Badge>
                    )}
                  </div>
                  {challenge.remainingTime && !challenge.isExpired && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{challenge.remainingTime.displayText}</span>
                    </div>
                  )}
                  {challenge.isExpired && challenge.status === 'pending' && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Abgelaufen</span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {getChallengeDescription(challenge, profile.id)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {TRAINING_MODES.find(m => m.value === challenge.training_mode)?.label ||
                        challenge.training_mode}
                    </span>
                    <span className={`font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {getDifficultyLabel(challenge.difficulty)}
                    </span>
                    {challenge.direction === 'outgoing' && profile?.skill_level &&
                     calculatePointsBonus(profile.skill_level, challenge.difficulty) > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                        <TrendingUp className="w-3 h-3" />
                        +{calculatePointsBonus(profile.skill_level, challenge.difficulty)}% Bonus
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {challenge.direction === 'incoming' && challenge.status === 'pending' && (
                    <>
                      <button
                        onClick={() => acceptChallenge(challenge.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Annehmen
                      </button>
                      <button
                        onClick={() => declineChallenge(challenge.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Ablehnen
                      </button>
                    </>
                  )}
                  {challenge.status === 'active' && (
                    <button
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2 text-sm"
                      onClick={() => alert('Training wird in Kürze verfügbar sein')}
                    >
                      Details anzeigen
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {isAdminOrMaster && (
                    <button
                      onClick={() => confirmDeleteChallenge(challenge.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
                      title="Challenge löschen (Admin)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Challenge-Regeln
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Limits:</strong> Maximal 3 aktive Challenges gleichzeitig
            </p>
            <p>
              <strong>Punkte:</strong> Gewinner erhält 1.5x Basispunkte, Verlierer -0.5x
            </p>
            <p>
              <strong>Schwierigkeit:</strong> Du kannst maximal eine Stufe über deinem Level herausfordern und erhältst dann +20% Bonus-Punkte
            </p>
            <p>
              <strong>Ablauf:</strong> Challenges laufen nach 7 Tagen ab
            </p>
            <p>
              <strong>Revanche:</strong> Nach einer Challenge kann der Verlierer eine Revanche starten
            </p>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Neue Challenge erstellen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gegner wählen</label>
                  <select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">-- Gegner wählen --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainingsmodus</label>
                  <select
                    value={selectedMode}
                    onChange={e => setSelectedMode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {TRAINING_MODES.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schwierigkeit
                    {bonusText && (
                      <span className="ml-2 text-xs font-semibold text-orange-600">
                        {bonusText}
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {allowedDifficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>
                        {diff.label}
                        {calculatePointsBonus(profile?.skill_level || 'anfaenger', diff.value) > 0 &&
                          ` (+${calculatePointsBonus(profile?.skill_level || 'anfaenger', diff.value)}%)`
                        }
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Dein Level: {getDifficultyLabel(profile?.skill_level || 'anfaenger')} •
                    Du kannst bis zu einer Stufe höher herausfordern
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setMessage('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={createChallenge}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                  >
                    Challenge starten
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Challenge löschen?</h3>
              <p className="text-gray-600 mb-6">
                Möchtest du diese Challenge wirklich löschen?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setChallengeToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={deleteChallenge}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
