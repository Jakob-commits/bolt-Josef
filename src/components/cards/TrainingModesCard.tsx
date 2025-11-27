import { LucideIcon } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../ui/Card';

export interface TrainingMode {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface TrainingModesCardProps {
  modes: TrainingMode[];
  selectedMode: string | null;
  onSelectMode: (id: string) => void;
  userPlan?: 'basic' | 'pro' | 'enterprise';
  className?: string;
}

export function TrainingModesCard({
  modes,
  selectedMode,
  onSelectMode,
  userPlan = 'basic',
  className = '',
}: TrainingModesCardProps) {
  const isActive = userPlan !== 'basic' || true;

  return (
    <Card active={isActive} className={className}>
      <CardTitle>Trainingsmodus wählen</CardTitle>
      <CardContent>
        <p className="text-gray-600 mb-4 text-sm">
          Wähle deinen Trainingsmodus, um gezielt zu üben.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`border-2 rounded-xl p-4 transition-all text-left ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-cyan-300 bg-white'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mb-2 ${
                    isSelected ? 'text-cyan-600' : 'text-gray-600'
                  }`}
                />
                <h4
                  className={`font-semibold mb-2 ${
                    isSelected ? 'text-cyan-700' : 'text-gray-900'
                  }`}
                >
                  {mode.title}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{mode.description}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
