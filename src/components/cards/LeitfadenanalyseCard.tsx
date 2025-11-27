import { FileSearch, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type LeitfadenanalyseCardProps = {
  onAnalyze: () => void;
};

export function LeitfadenanalyseCard({ onAnalyze }: LeitfadenanalyseCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
          <FileSearch className="w-6 h-6 text-cyan-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-slate-900 mb-3">
            Leitfadenanalyse & Optimierung
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Lade deinen Gesprächsleitfaden hoch und erhalte KI-gestützte Optimierungsvorschläge
            für bessere Verkaufsgespräche.
          </p>

          <div className="flex items-center gap-3">
            <Button
              onClick={onAnalyze}
              variant="primary"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Jetzt analysieren
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
