import { Card, CardTitle, CardContent } from '../ui/Card';

interface Training {
  date: string;
  title: string;
}

interface RecentTrainingsCardProps {
  trainings: Training[];
  onViewAll?: () => void;
  className?: string;
}

export function RecentTrainingsCard({
  trainings,
  onViewAll,
  className = '',
}: RecentTrainingsCardProps) {
  return (
    <Card active={true} className={className}>
      <CardTitle>Letzte Trainings</CardTitle>
      <CardContent>
        <div className="space-y-3 mb-4">
          {trainings.map((training, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-sm font-semibold text-gray-500 w-12">{training.date}</span>
              <span className="text-sm text-gray-900">{training.title}</span>
            </div>
          ))}
        </div>
        {onViewAll && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewAll();
            }}
            className="text-sm text-cyan-500 hover:text-cyan-600 font-medium hover:underline"
          >
            Alle Sessions ansehen →
          </a>
        )}
      </CardContent>
    </Card>
  );
}
