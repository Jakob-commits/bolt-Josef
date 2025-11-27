import { useEffect } from 'react';
import { TrendingUp, Award, CheckCircle } from 'lucide-react';
import { DashboardGrid } from '../layout/DashboardGrid';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { isEditing, cancelEditing, setCurrentPage, setIsEditing } = useUI();
  const { profile, skillScores, skillLevel } = useAuth();

  useEffect(() => {
    setCurrentPage('dashboard');
    return () => setCurrentPage(null);
  }, [setCurrentPage]);

  const mapPackageToPlan = (pkg: string | undefined): 'basic' | 'pro' | 'enterprise' => {
    if (pkg === 'pro') return 'enterprise';
    if (pkg === 'premium') return 'pro';
    return 'basic';
  };

  const userPlan = mapPackageToPlan(profile?.package);
  const userName = profile?.full_name?.split(' ')[0] || 'Trainee';

  const skills = [
    { name: 'Beziehungsaufbau', value: Math.round(skillScores?.rapport_building || 0) },
    { name: 'Bedarfsanalyse', value: Math.round(skillScores?.needs_analysis || 0) },
    { name: 'Einwandbehandlung', value: Math.round(skillScores?.objection_handling || 0) },
    { name: 'Abschlussstärke', value: Math.round(skillScores?.closing || 0) },
    { name: 'Gesprächsfluss', value: Math.round(skillScores?.communication || 0) },
  ];

  const weeklyPlan = [
    { title: 'Einwandtraining "Zu teuer"', level: 'Fortgeschritten', description: 'Preiseinwände souverän meistern' },
    { title: 'Smalltalk-Training', level: 'Anfänger', description: 'Beziehung aufbauen und Vertrauen schaffen' },
    { title: 'Abschlusstraining', level: 'Fortgeschritten', description: 'Sicher zum Abschluss führen' },
  ];

  const recentTrainings = [
    { date: '14.11', title: 'Einwandtraining' },
    { date: '13.11', title: 'Cold-Call' },
    { date: '12.11', title: 'Abschluss' },
  ];

  const achievements = [
    { title: 'Erster Abschluss', icon: CheckCircle },
    { title: 'Trainings-Woche 10', icon: TrendingUp },
    { title: 'Einwand-Profi', icon: Award },
    { title: 'Teamplayer', icon: Award },
  ];

  const cardProps = {
    trainingSuite: {
      onStartTraining: isEditing ? undefined : () => onNavigate?.('training'),
    },
    leitfadenanalyse: {
      onAnalyze: isEditing ? undefined : () => onNavigate?.('guidelineanalysis'),
    },
    news: {},
    skillProfile: { skills },
    recentTrainings: {
      trainings: recentTrainings,
      onViewAll: isEditing ? undefined : () => console.log('View all'),
    },
    achievements: { achievements },
    weeklyTrainingPlan: { userPlan, weeklyPlan },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <DashboardGrid cardProps={cardProps} />
      </div>

      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center gap-4 py-4 shadow-lg z-50">
          <button
            onClick={() => {
              cancelEditing();
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors"
          >
            Fertig
          </button>
        </div>
      )}
    </div>
  );
}
