import { Lock, PlayCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { UpgradeHint } from '../ui/UpgradeHint';

export interface WeeklyTrainingPlanCardProps {
  userPlan: 'basic' | 'pro' | 'enterprise';
  weeklyPlan: { title: string; level: string; description?: string }[];
  className?: string;
}

export function WeeklyTrainingPlanCard({
  userPlan,
  weeklyPlan,
  className = '',
}: WeeklyTrainingPlanCardProps) {
  const isActive = userPlan !== 'basic';

  return (
    <Card active={isActive} className={`relative transition-colors duration-200 ${className}`}>
      {!isActive && (
        <Lock className="absolute top-6 right-6 w-5 h-5 text-gray-400" />
      )}
      <h2 className="text-2xl font-semibold text-slate-900 mb-3">Wochen-Trainingsplan</h2>
      <p className="text-gray-600 mb-6 text-sm">Starte direkt mit deinen empfohlenen Trainings.</p>

      <div className="space-y-3">
        {weeklyPlan.map((training, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
              !isActive
                ? 'bg-gray-100 cursor-not-allowed'
                : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
            }`}
            onClick={() => {
              if (isActive) {
                console.log('Weekly plan training clicked:', training.title);
              }
            }}
          >
            <div className="flex-1">
              <h3
                className={`font-semibold mb-1 ${
                  !isActive ? 'text-gray-500' : 'text-gray-900'
                }`}
              >
                {training.title}
              </h3>
              <p className="text-xs text-gray-600 mb-1">{training.level}</p>
              {training.description && (
                <p className="text-xs text-gray-500">{training.description}</p>
              )}
            </div>
            <PlayCircle
              className={`w-10 h-10 flex-shrink-0 ml-4 ${
                !isActive ? 'text-gray-300' : 'text-cyan-500'
              }`}
            />
          </div>
        ))}
      </div>

      {!isActive && <UpgradeHint />}
    </Card>
  );
}
