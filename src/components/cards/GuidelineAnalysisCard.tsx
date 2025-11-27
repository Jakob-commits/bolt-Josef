import { SearchCheck, Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { UpgradeHint } from '../ui/UpgradeHint';

interface GuidelineAnalysisCardProps {
  onNavigate?: () => void;
  userPlan?: 'basic' | 'pro' | 'enterprise';
  className?: string;
}

export function GuidelineAnalysisCard({
  onNavigate,
  userPlan = 'basic',
  className = ''
}: GuidelineAnalysisCardProps) {
  const isActive = userPlan === 'enterprise';

  return (
    <Card active={isActive} className={`relative transition-colors duration-200 ${className}`}>
      {!isActive && (
        <Lock className="absolute top-6 right-6 w-5 h-5 text-gray-400" />
      )}

      <div
        onClick={isActive ? onNavigate : undefined}
        className={`${isActive ? 'cursor-pointer' : 'cursor-not-allowed'} transition-all`}
      >
        <div className="flex items-start gap-4">
          <SearchCheck className={`w-8 h-8 flex-shrink-0 ${isActive ? 'text-[#A855F7]' : 'text-gray-400'}`} />
          <div>
            <h3 className={`text-2xl font-semibold mb-3 ${isActive ? 'text-slate-900' : 'text-gray-500'}`}>
              Leitfadenanalyse & Optimierung
            </h3>
            <p className={`text-sm mb-3 ${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
              Lass deine bestehenden Verkaufsleitfäden von unserer KI analysieren und optimieren
            </p>
            <p className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
              ✓ Stärken & Schwächen erkennen • ✓ Verbesserungsvorschläge • ✓ Optimierte Version erhalten
            </p>
          </div>
        </div>
      </div>

      {!isActive && <UpgradeHint text="Leitfadenanalyse ist nur im Pro-Paket verfügbar" />}
    </Card>
  );
}
