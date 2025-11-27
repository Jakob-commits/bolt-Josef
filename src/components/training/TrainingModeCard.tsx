import { LucideIcon } from 'lucide-react';
import { InfoTooltip } from '../ui/InfoTooltip';
import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { Badge } from '../ui/Badge';
import { getOptionVisibility } from '../../lib/trainingVisibilityUtils';
import { MODE_DESCRIPTIONS } from '../../constants/trainingDescriptions';

interface TrainingModeCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  visibilityKey: string;
  isSelected: boolean;
  isVisibilityMode: boolean;
  isAdmin: boolean;
  visibility: Record<string, string>;
  onSelect: () => void;
}

export function TrainingModeCard({
  id,
  title,
  description,
  icon: Icon,
  visibilityKey,
  isSelected,
  isVisibilityMode,
  isAdmin,
  visibility,
  onSelect,
}: TrainingModeCardProps) {
  const state = getOptionVisibility(visibilityKey, visibility);
  const isHidden = state === 'hidden';
  const isComingSoon = state === 'comingsoon';
  const isDisabled = isComingSoon || (isHidden && !isVisibilityMode);

  if (isHidden && !isVisibilityMode) {
    return null;
  }

  return (
    <div
      onClick={() => !isDisabled && onSelect()}
      className={`relative p-4 border-2 rounded-xl transition-all ${
        isDisabled
          ? 'opacity-60 cursor-not-allowed bg-gray-50'
          : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-[#A855F7] bg-[#F5F3FF] border-2'
          : 'border-gray-200 hover:border-[#A855F7]'
      }`}
    >
      {isVisibilityMode && isAdmin && (
        <div className="absolute top-2 right-2">
          <VisibilityEyeIcon elementKey={visibilityKey} size="sm" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <Icon className="w-6 h-6 text-[#A855F7] flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {MODE_DESCRIPTIONS[id] && (
            <InfoTooltip content={MODE_DESCRIPTIONS[id]} />
          )}
          {isComingSoon && !isVisibilityMode && (
            <Badge variant="warning" className="mt-2">Coming Soon</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
