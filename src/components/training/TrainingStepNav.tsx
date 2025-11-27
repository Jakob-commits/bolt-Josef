import { Info } from 'lucide-react';
import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { Badge } from '../ui/Badge';
import { TRAINING_STEP_KEYS, calculateStepDisplay, STEP_CONFIGS } from '../../lib/trainingVisibilityUtils';
import { useUIVisibility } from '../../contexts/UIVisibilityContext';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminOrHigher } from '../../lib/supabase';

interface TrainingStepNavProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  maxVisitedStep: 1 | 2 | 3 | 4 | 5 | 6;
  onStepClick: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export function TrainingStepNav({ currentStep, maxVisitedStep, onStepClick }: TrainingStepNavProps) {
  const { visibility } = useUIVisibility();
  const { isVisibilityMode } = useUI();
  const { profile } = useAuth();
  const isAdmin = isAdminOrHigher(profile);

  const stepDisplayMap = calculateStepDisplay(visibility, isVisibilityMode && isAdmin);

  const visibleSteps = STEP_CONFIGS.filter(config => {
    const info = stepDisplayMap.get(config.stepNumber);
    return info && info.showInNav;
  });

  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto">
      {visibleSteps.map((config, idx) => {
        const info = stepDisplayMap.get(config.stepNumber)!;
        const isActive = currentStep === config.stepNumber;
        const isCompleted = maxVisitedStep > config.stepNumber;
        const isClickable = (isCompleted || isActive) && info.isClickable;
        const isHidden = info.state === 'hidden';
        const isComingSoon = info.state === 'comingsoon';

        return (
          <div key={config.stepNumber} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1">
              <div
                onClick={() => isClickable && onStepClick(config.stepNumber)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors flex-shrink-0 ${
                  isHidden && isVisibilityMode && isAdmin
                    ? 'bg-gray-300 text-gray-600 cursor-default line-through'
                    : isActive
                    ? 'bg-cyan-600 text-white'
                    : isCompleted && isClickable
                    ? 'border-2 border-cyan-600 text-cyan-600 bg-white cursor-pointer hover:bg-cyan-50'
                    : isComingSoon
                    ? 'border-2 border-orange-400 text-orange-600 bg-orange-50'
                    : 'border border-gray-300 text-gray-400 bg-white'
                } ${!isClickable && !isHidden ? 'cursor-not-allowed opacity-60' : ''}`}
                title={isHidden && isVisibilityMode && isAdmin ? 'Ausgeblendet – wird im Training übersprungen' : ''}
              >
                {info.displayNumber === 'i' ? (
                  <Info className="w-5 h-5" />
                ) : (
                  info.displayNumber
                )}

                {isVisibilityMode && isAdmin && config.canBeHidden && (
                  <div className="absolute -top-1 -right-1">
                    <VisibilityEyeIcon elementKey={config.key} size="xs" />
                  </div>
                )}
              </div>

              <div className="hidden sm:block text-center">
                <p className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-cyan-600' :
                  isHidden ? 'text-gray-400' :
                  isComingSoon ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {config.label}
                </p>
                {isComingSoon && !isVisibilityMode && (
                  <Badge variant="warning" className="text-xs px-1 py-0 mt-0.5">Soon</Badge>
                )}
              </div>
            </div>

            {idx < visibleSteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${
                isCompleted ? 'bg-cyan-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
