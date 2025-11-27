import { PlayCircle } from 'lucide-react';
import { Card } from '../ui/Card';

interface WelcomeCardProps {
  userName: string;
  skillLevel: number;
  onStartTraining?: () => void;
  className?: string;
}

export function WelcomeCard({
  userName,
  skillLevel,
  onStartTraining,
  className = '',
}: WelcomeCardProps) {
  return (
    <Card active={true} className={className}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            Willkommen zurück, {userName}
          </h2>
          <p className="text-sm text-gray-600">
            Aktuelles Skill-Level: <span className="font-semibold text-gray-900">Fortgeschritten</span> ({skillLevel} Punkte)
          </p>
        </div>
        {onStartTraining && (
          <button
            onClick={onStartTraining}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-colors duration-200 whitespace-nowrap"
          >
            Training Suite
          </button>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${skillLevel}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-gray-500">
        <span>0</span>
        <span>100</span>
      </div>
      {onStartTraining && (
        <button
          onClick={onStartTraining}
          className="sm:hidden mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-colors duration-200"
        >
          <PlayCircle className="w-5 h-5" />
          Training Suite
        </button>
      )}
    </Card>
  );
}
