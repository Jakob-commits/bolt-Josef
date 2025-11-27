import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { UpgradeHint } from '../ui/UpgradeHint';
import {
  Users,
  Clock,
  TrendingUp,
  Award,
  Search,
  ArrowRight,
  X,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { getRoleDisplayName, getRoleBadgeColor } from '../../types/roles';
import { UserPackage, PLAN_CAPABILITIES } from '../../lib/planCapabilities';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  package: UserPackage;
  account_status: string;
  weekly_duration: number;
  weekly_sessions: number;
  last_activity: string | null;
}

interface TrainingSession {
  id: string;
  created_at: string;
  training_mode: string;
  duration_minutes: number;
  total_score: number | null;
  status: string;
}

type TimeRange = 'current_week' | 'last_week' | 'last_30_days';

const TIME_RANGES = [
  { value: 'current_week', label: 'Aktuelle Woche' },
  { value: 'last_week', label: 'Letzte Woche' },
  { value: 'last_30_days', label: 'Letzte 30 Tage' },
];

const TRAINING_MODE_LABELS: Record<string, string> = {
  'cold_call': 'Cold-Call',
  'objection': 'Einwandbehandlung',
  'needs': 'Bedarfsanalyse',
  'closing': 'Abschluss',
  'smalltalk': 'Smalltalk',
  'full_conversation': 'Vollgespräch',
};

export default function LeaderDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('current_week');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberSessions, setMemberSessions] = useState<TrainingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [activeMembers, setActiveMembers] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    if (!authLoading && profile) {
      loadTeamData();
    }
  }, [authLoading, profile, timeRange]);

  // Check permissions
  const hasAccess = profile &&
    ['Teamleiter', 'Admin', 'Master'].includes(profile.role) &&
    profile.package === 'pro';

  if (authLoading) {
    return <LoadingSpinner message="Führungskräfte-Dashboard wird geladen..." />;
  }

  if (!profile) {
    return <LoadingSpinner message="Profil wird geladen..." />;
  }

  // Show upgrade hint if no access
  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Führungskräfte-Dashboard</h1>
          <p className="text-gray-600 mt-2">Überblick über dein Team, Trainingsaktivitäten und Analysen</p>
        </div>

        <UpgradeHint
          requiredPlan="pro"
          feature="Führungskräfte-Dashboard"
          description="Das Führungskräfte-Dashboard ist nur im Pro-Paket verfügbar und ermöglicht dir einen detaillierten Überblick über die Trainingsaktivitäten deines Teams."
        />
      </div>
    );
  }

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'current_week':
        // Start of current week (Monday)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last_week':
        // Start of last week
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() - 6);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        return { start: startDate.toISOString(), end: endDate.toISOString() };
      case 'last_30_days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { start: startDate.toISOString(), end: now.toISOString() };
  };

  const loadTeamData = async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, package, account_status')
        .eq('tenant_id', profile.tenant_id)
        .neq('account_status', 'archived')
        .order('full_name');

      if (membersError) throw membersError;

      // Load training sessions for time range
      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('user_id, duration_minutes, total_score, created_at')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('status', 'completed');

      if (sessionsError) throw sessionsError;

      // Aggregate data per member
      const teamData: TeamMember[] = (members || []).map(member => {
        const memberSessions = sessions?.filter(s => s.user_id === member.id) || [];
        const weeklyDuration = memberSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const lastSession = memberSessions.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          id: member.id,
          full_name: member.full_name,
          email: member.email,
          role: member.role,
          package: member.package,
          account_status: member.account_status,
          weekly_duration: weeklyDuration,
          weekly_sessions: memberSessions.length,
          last_activity: lastSession?.created_at || null,
        };
      });

      setTeamMembers(teamData);

      // Calculate KPIs
      const active = teamData.filter(m => m.weekly_sessions > 0).length;
      const hours = teamData.reduce((sum, m) => sum + m.weekly_duration, 0) / 60;
      const sessionsCount = teamData.reduce((sum, m) => sum + m.weekly_sessions, 0);

      const scoresWithValues = sessions?.filter(s => s.total_score !== null) || [];
      const average = scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + (s.total_score || 0), 0) / scoresWithValues.length
        : 0;

      setActiveMembers(active);
      setTotalHours(hours);
      setTotalSessions(sessionsCount);
      setAvgScore(average);

    } catch (err) {
      console.error('Error loading team data:', err);
      setError('Fehler beim Laden der Team-Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadMemberSessions = async (memberId: string) => {
    if (!profile?.tenant_id) return;

    try {
      setLoadingSessions(true);
      const { start, end } = getDateRange();

      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, created_at, training_mode, duration_minutes, total_score, status')
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', memberId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMemberSessions(data || []);
    } catch (err) {
      console.error('Error loading member sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleViewSessions = (member: TeamMember) => {
    setSelectedMember(member);
    loadMemberSessions(member.id);
  };

  const handleCloseDrawer = () => {
    setSelectedMember(null);
    setMemberSessions([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const filteredMembers = teamMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Team-Daten werden geladen..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-cyan-600" />
          Führungskräfte-Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Überblick über dein Team, Trainingsaktivitäten und Analysen</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-cyan-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{activeMembers}</div>
            <div className="text-sm text-gray-600 mt-1">Aktive Mitarbeiter</div>
            <div className="text-xs text-gray-500 mt-1">Mit laufenden Trainings</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Clock className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-600 mt-1">Trainingsstunden</div>
            <div className="text-xs text-gray-500 mt-1">
              {TIME_RANGES.find(r => r.value === timeRange)?.label}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalSessions}</div>
            <div className="text-sm text-gray-600 mt-1">Trainingseinheiten</div>
            <div className="text-xs text-gray-500 mt-1">
              {TIME_RANGES.find(r => r.value === timeRange)?.label}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {avgScore > 0 ? avgScore.toFixed(0) : '-'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Ø Score</div>
            <div className="text-xs text-gray-500 mt-1">Durchschnittliche Bewertung</div>
          </div>
        </Card>
      </div>

      {/* Team Table */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Team-Übersicht</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Mitarbeiter suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {TIME_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Keine Mitarbeiter gefunden' : 'Noch keine Team-Mitglieder vorhanden'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Mitarbeiter</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Paket</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Trainingszeit</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Einheiten</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Letzte Aktivität</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-semibold">
                            {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.full_name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                            <Badge className={`mt-1 ${getRoleBadgeColor(member.role)}`}>
                              {getRoleDisplayName(member.role)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={
                          member.package === 'pro' ? 'bg-purple-100 text-purple-700' :
                          member.package === 'premium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {PLAN_CAPABILITIES[member.package].name}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-medium text-gray-900">
                          {formatDuration(member.weekly_duration)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-semibold text-gray-900 text-lg">
                          {member.weekly_sessions}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {member.last_activity
                            ? formatDate(member.last_activity)
                            : <span className="text-gray-400">Keine Aktivität</span>
                          }
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          onClick={() => handleViewSessions(member)}
                          disabled={member.weekly_sessions === 0}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm px-3 py-1.5 flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trainingseinheiten
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Drawer: Member Sessions */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-lg">
                    {selectedMember.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMember.full_name}</h2>
                    <p className="text-sm text-gray-600">{selectedMember.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getRoleBadgeColor(selectedMember.role)}>
                        {getRoleDisplayName(selectedMember.role)}
                      </Badge>
                      <Badge className={
                        selectedMember.package === 'pro' ? 'bg-purple-100 text-purple-700' :
                        selectedMember.package === 'premium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {PLAN_CAPABILITIES[selectedMember.package].name}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-cyan-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-cyan-900">
                    {formatDuration(selectedMember.weekly_duration)}
                  </div>
                  <div className="text-xs text-cyan-700 mt-1">Trainingszeit</div>
                </div>
                <div className="bg-violet-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-violet-900">
                    {selectedMember.weekly_sessions}
                  </div>
                  <div className="text-xs text-violet-700 mt-1">Einheiten</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-900">
                    {TIME_RANGES.find(r => r.value === timeRange)?.label.split(' ')[0]}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Zeitraum</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                Trainingseinheiten
              </h3>

              {loadingSessions ? (
                <div className="text-center py-12">
                  <LoadingSpinner message="Lade Trainingseinheiten..." />
                </div>
              ) : memberSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Keine Trainingseinheiten im ausgewählten Zeitraum</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberSessions.map(session => (
                    <Card key={session.id} className="hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-cyan-100 text-cyan-700">
                                {TRAINING_MODE_LABELS[session.training_mode] || session.training_mode}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(session.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDuration(session.duration_minutes)}
                              </div>
                              {session.total_score !== null && (
                                <div className="flex items-center gap-1">
                                  <Award className="w-4 h-4" />
                                  {session.total_score} / 100
                                </div>
                              )}
                              <Badge className={
                                session.status === 'completed' ? 'bg-green-100 text-green-700' :
                                session.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {session.status === 'completed' ? 'Abgeschlossen' :
                                 session.status === 'in_progress' ? 'In Bearbeitung' :
                                 'Abgebrochen'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => {/* TODO: Open analysis */}}
                            className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-3 py-2 flex items-center gap-2"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Analyse
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
