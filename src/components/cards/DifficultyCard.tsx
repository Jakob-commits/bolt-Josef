import { Lock } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../ui/Card';

export interface Difficulty {
  id: string;
  title: string;
  description: string;
}

interface DifficultyCardProps {
  difficulties: Difficulty[];
  selectedDifficulty: string;
  onSelectDifficulty: (id: string) => void;
  userPlan?: 'basic' | 'pro' | 'enterprise';
  className?: string;
}

export function DifficultyCard({
  difficulties,
  selectedDifficulty,
  onSelectDifficulty,
  userPlan = 'basic',
  className = '',
}: DifficultyCardProps) {
  const isActive = userPlan !== 'basic' || true;

  return (
    <Card active={isActive} className={`relative ${className}`}>
      {!isActive && <Lock className="absolute top-6 right-6 w-5 h-5 text-gray-400" />}
      <CardTitle>Schwierigkeitsgrad</CardTitle>
      <CardContent>
        <p className="text-gray-600 mb-4 text-sm">
          Wähle den Schwierigkeitsgrad für dein Training.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {difficulties.map((difficulty) => {
            const isSelected = selectedDifficulty === difficulty.id;
            return (
              <button
                key={difficulty.id}
                onClick={() => onSelectDifficulty(difficulty.id)}
                disabled={!isActive}
                className={`border-2 rounded-xl p-4 transition-all text-left ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-cyan-300 bg-white'
                } ${!isActive ? 'cursor-not-allowed' : ''}`}
              >
                <h4
                  className={`font-semibold mb-2 ${
                    isSelected ? 'text-cyan-700' : 'text-gray-900'
                  }`}
                >
                  {difficulty.title}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{difficulty.description}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
