import { GraduationCap, PlayCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type TrainingSuiteCardProps = {
  onStartTraining: () => void;
};

export function TrainingSuiteCard({ onStartTraining }: TrainingSuiteCardProps) {
  return (
    <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-none shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-white mb-3">
            Training Suite
          </h3>
          <p className="text-sm text-purple-100 mb-4">
            Starte dein individuelles Training – das Herzstück deiner Sales-Weiterentwicklung.
          </p>

          <div className="flex items-center gap-3">
            <Button
              onClick={onStartTraining}
              className="bg-white text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Training starten
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
