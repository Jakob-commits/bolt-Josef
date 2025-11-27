import { Lock } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../ui/Card';
import { UpgradeHint } from '../ui/UpgradeHint';

export interface DisgType {
  id: string;
  title: string;
  description: string;
  color: string;
}

export interface NlpTrait {
  id: string;
  title: string;
}

interface CustomerTypeCardProps {
  disgTypes: DisgType[];
  nlpTraits: NlpTrait[];
  selectedDisgType: string | null;
  selectedNlpTraits: string[];
  onSelectDisgType: (id: string) => void;
  onToggleNlpTrait: (id: string) => void;
  userPlan?: 'basic' | 'pro' | 'enterprise';
  className?: string;
}

export function CustomerTypeCard({
  disgTypes,
  nlpTraits,
  selectedDisgType,
  selectedNlpTraits,
  onSelectDisgType,
  onToggleNlpTrait,
  userPlan = 'basic',
  className = '',
}: CustomerTypeCardProps) {
  const isActive = userPlan === 'pro' || userPlan === 'enterprise';

  return (
    <Card active={isActive} className={`relative ${className}`}>
      {!isActive && <Lock className="absolute top-6 right-6 w-5 h-5 text-gray-400" />}
      <CardTitle>Kundentyp & Avatar</CardTitle>
      <CardContent>
        <p className="text-gray-600 mb-4 text-sm">
          Definiere deinen Gesprächspartner für realistischere Trainings.
        </p>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">DISG-Typ</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {disgTypes.map((type) => {
              const isSelected = selectedDisgType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => !isActive || onSelectDisgType(type.id)}
                  disabled={!isActive}
                  className={`border-2 rounded-lg p-3 text-center transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-cyan-300 bg-white'
                  } ${!isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <div className={`w-8 h-8 ${type.color} rounded-full mx-auto mb-2`}></div>
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isSelected ? 'text-cyan-700' : 'text-gray-900'
                    }`}
                  >
                    {type.title}
                  </p>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">NLP-Merkmale</h3>
          <div className="flex flex-wrap gap-2">
            {nlpTraits.map((trait) => {
              const isSelected = selectedNlpTraits.includes(trait.id);
              return (
                <button
                  key={trait.id}
                  onClick={() => !isActive || onToggleNlpTrait(trait.id)}
                  disabled={!isActive}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${!isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {trait.title}
                </button>
              );
            })}
          </div>
        </div>

        {!isActive && <UpgradeHint />}
      </CardContent>
    </Card>
  );
}
