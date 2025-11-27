import { LucideIcon } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../ui/Card';

interface Achievement {
  title: string;
  icon: LucideIcon;
}

interface AchievementsCardProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementsCard({ achievements, className = '' }: AchievementsCardProps) {
  return (
    <Card active={true} className={className}>
      <CardTitle>Erfolge</CardTitle>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-cyan-50 to-purple-50 rounded-lg border-2 border-cyan-200 hover:border-cyan-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-center font-medium text-gray-700 leading-tight">
                  {achievement.title}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
