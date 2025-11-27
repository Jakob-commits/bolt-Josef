import { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Users, TrendingUp, Share2, Lock, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';

type TimePeriod = 'all' | 'month' | 'year' | 'quarter';

interface HallOfFameEntry {
  user_id: string;
  full_name: string;
  total_points: number;
  training_points: number;
  challenge_points: number;
  allow_sharing: boolean;
  rank_position: number;
  is_rookie: boolean;
}

interface LeaderboardData {
  user_id: string;
  full_name: string;
  points: number;
  created_at?: string;
}

export function HallOfFame() {
  const { profile, tenant, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<HallOfFameEntry | null>(null);
  const [allowSharing, setAllowSharing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  useEffect(() => {
    if (profile) {
      loadLeaderboard();
    }
  }, [profile, timePeriod]);

  if (authLoading) {
    return <LoadingSpinner message="Hall of Fame wird geladen..." />;
  }

  if (!profile) {
    return <LoadingSpinner message="Profil wird geladen..." />;
  }

  async function loadLeaderboard() {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);

      if (timePeriod === 'all') {
        await loadOverallLeaderboard();
      } else {
        await loadTimeBasedLeaderboard();
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOverallLeaderboard() {
    const { data: hallData, error } = await supabase
      .from('hall_of_fame')
      .select(`
        user_id,
        total_points,
        training_points,
        challenge_points,
        allow_sharing,
        profiles!inner(full_name, created_at)
      `)
      .eq('tenant_id', profile!.tenant_id)
      .order('total_points', { ascending: false });

    if (error) throw error;

    const entries: HallOfFameEntry[] = hallData.map((entry: any, index: number) => {
      const createdAt = new Date(entry.profiles.created_at);
      const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        user_id: entry.user_id,
        full_name: entry.profiles.full_name,
        total_points: entry.total_points,
        training_points: entry.training_points,
        challenge_points: entry.challenge_points,
        allow_sharing: entry.allow_sharing,
        rank_position: index + 1,
        is_rookie: daysSinceCreation <= 30,
      };
    });

    setLeaderboard(entries);

    const myEntry = entries.find(e => e.user_id === profile!.id);
    if (myEntry) {
      setMyRank(myEntry);
      setAllowSharing(myEntry.allow_sharing);
    }
  }

  async function loadTimeBasedLeaderboard() {
    const now = new Date();
    let startDate: string;

    switch (timePeriod) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
        break;
      }
      default:
        startDate = new Date(0).toISOString();
    }

    const { data: achievementsData, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        user_id,
        progress,
        unlocked_at,
        profiles!inner(full_name, created_at, tenant_id)
      `)
      .eq('profiles.tenant_id', profile!.tenant_id)
      .gte('unlocked_at', startDate)
      .not('unlocked_at', 'is', null);

    if (achievementsError) throw achievementsError;

    const { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select(`
        winner_id,
        points_awarded,
        completed_at,
        profiles!challenges_winner_id_fkey(full_name, created_at, tenant_id)
      `)
      .eq('profiles.tenant_id', profile!.tenant_id)
      .eq('status', 'completed')
      .gte('completed_at', startDate)
      .not('winner_id', 'is', null);

    if (challengesError) throw challengesError;

    const userPoints = new Map<string, { name: string; points: number; created_at: string }>();

    (achievementsData || []).forEach((achievement: any) => {
      const userId = achievement.user_id;
      const points = achievement.progress || 10;
      const existing = userPoints.get(userId) || {
        name: achievement.profiles.full_name,
        points: 0,
        created_at: achievement.profiles.created_at,
      };
      existing.points += points;
      userPoints.set(userId, existing);
    });

    (challengesData || []).forEach((challenge: any) => {
      const userId = challenge.winner_id;
      const points = challenge.points_awarded || 50;
      const existing = userPoints.get(userId) || {
        name: challenge.profiles.full_name,
        points: 0,
        created_at: challenge.profiles.created_at,
      };
      existing.points += points;
      userPoints.set(userId, existing);
    });

    const { data: sharingData } = await supabase
      .from('hall_of_fame')
      .select('user_id, allow_sharing')
      .eq('tenant_id', profile!.tenant_id);

    const sharingMap = new Map<string, boolean>();
    (sharingData || []).forEach((s: any) => {
      sharingMap.set(s.user_id, s.allow_sharing);
    });

    const sortedEntries = Array.from(userPoints.entries())
      .map(([userId, data]) => ({
        user_id: userId,
        full_name: data.name,
        total_points: data.points,
        training_points: data.points,
        challenge_points: 0,
        allow_sharing: sharingMap.get(userId) || false,
        rank_position: 0,
        is_rookie: false,
        created_at: data.created_at,
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((entry, index) => ({
        ...entry,
        rank_position: index + 1,
        is_rookie: (() => {
          const createdAt = new Date(entry.created_at);
          const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceCreation <= 30;
        })(),
      }));

    setLeaderboard(sortedEntries);

    const myEntry = sortedEntries.find(e => e.user_id === profile!.id);
    if (myEntry) {
      setMyRank(myEntry);
    } else {
      setMyRank(null);
    }

    const sharingEntry = sharingData?.find((s: any) => s.user_id === profile!.id);
    if (sharingEntry) {
      setAllowSharing(sharingEntry.allow_sharing);
    }
  }

  async function toggleSharing() {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('hall_of_fame')
        .update({ allow_sharing: !allowSharing })
        .eq('user_id', profile.id);

      if (error) throw error;

      setAllowSharing(!allowSharing);
      loadLeaderboard();
    } catch (error) {
      console.error('Error updating sharing settings:', error);
    }
  }

  function getRankIcon(position: number) {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-semibold">#{position}</span>;
    }
  }

  function getRankBadge(position: number) {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (position === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    return 'bg-gray-100 text-gray-700';
  }

  function getPeriodLabel(period: TimePeriod): string {
    switch (period) {
      case 'all':
        return 'Gesamt';
      case 'month':
        return 'Monat';
      case 'year':
        return 'Jahr';
      case 'quarter':
        return 'Quartal';
      default:
        return period;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Hall of Fame</h1>
          </div>
          <p className="text-gray-600">Die besten Trainees von {tenant?.name || 'deinem Team'}</p>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {(['all', 'month', 'year', 'quarter'] as TimePeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                timePeriod === period
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {period !== 'all' && <Calendar className="w-4 h-4" />}
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>

        {myRank && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-cyan-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-cyan-600">#{myRank.rank_position}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Deine Position</h3>
                  <p className="text-gray-600">{myRank.total_points} Punkte</p>
                </div>
                {myRank.is_rookie && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    🌟 Rookie
                  </span>
                )}
              </div>
              {timePeriod === 'all' && (
                <button
                  onClick={toggleSharing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    allowSharing
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {allowSharing ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {allowSharing ? 'Teilen aktiv' : 'Teilen deaktiviert'}
                </button>
              )}
            </div>
          </div>
        )}

        {!myRank && timePeriod !== 'all' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              Du hast in diesem Zeitraum noch keine Punkte gesammelt. Absolviere Trainings oder Challenges, um in
              der Rangliste zu erscheinen!
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <p className="mt-4 text-gray-600">Lade Rangliste...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Noch keine Einträge vorhanden.</p>
              <p className="text-sm text-gray-500 mt-2">
                Absolviere Trainings und Challenges, um Punkte zu sammeln!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Rang</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Punkte</th>
                    {timePeriod === 'all' && (
                      <>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Training</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Challenges</th>
                      </>
                    )}
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(entry => (
                    <tr
                      key={entry.user_id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        entry.user_id === profile?.id ? 'bg-cyan-50' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${getRankBadge(
                            entry.rank_position
                          )}`}
                        >
                          {entry.rank_position <= 3 ? (
                            getRankIcon(entry.rank_position)
                          ) : (
                            <span className="font-bold">#{entry.rank_position}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{entry.full_name}</span>
                          {entry.user_id === profile?.id && (
                            <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded">Du</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-900">{entry.total_points}</span>
                        </div>
                      </td>
                      {timePeriod === 'all' && (
                        <>
                          <td className="py-4 px-6">
                            <span className="text-gray-600">{entry.training_points}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-600">{entry.challenge_points}</span>
                          </td>
                        </>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {entry.is_rookie && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Rookie
                            </span>
                          )}
                          {entry.allow_sharing && timePeriod === 'all' && (
                            <Share2 className="w-4 h-4 text-cyan-500" title="Teilt Best Practices" />
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

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Punkte sammeln
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Trainings:</strong> Sammle Punkte durch regelmäßiges Training (mehr Punkte bei höherer
              Schwierigkeit)
            </p>
            <p>
              <strong>Challenges:</strong> Fordere Kollegen heraus und gewinne Extra-Punkte
            </p>
            <p>
              <strong>Rookie-Bonus:</strong> In deinen ersten 30 Tagen erhältst du einen Bonus auf alle Punkte!
            </p>
            <p>
              <strong>Achievements:</strong> Schalte Erfolge frei und erhalte Bonus-Punkte
            </p>
            <p>
              <strong>Zeiträume:</strong> Wechsle zwischen den Tabs, um verschiedene Zeiträume zu vergleichen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
