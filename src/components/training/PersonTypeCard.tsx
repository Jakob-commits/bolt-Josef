import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { Badge } from '../ui/Badge';
import { InfoTooltip } from '../ui/InfoTooltip';
import { getOptionVisibility } from '../../lib/trainingVisibilityUtils';
import { COLOR_TYPE_DESCRIPTIONS } from '../../constants/trainingDescriptions';

interface PersonTypeCardProps {
  id: string;
  title: string;
  description: string;
  color: string;
  visibilityKey: string;
  isSelected: boolean;
  isVisibilityMode: boolean;
  isAdmin: boolean;
  visibility: Record<string, string>;
  onSelect: () => void;
}

export function PersonTypeCard({
  id,
  title,
  description,
  color,
  visibilityKey,
  isSelected,
  isVisibilityMode,
  isAdmin,
  visibility,
  onSelect,
}: PersonTypeCardProps) {
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
          ? 'border-cyan-500 bg-cyan-50 border-2'
          : 'border-gray-200 hover:border-cyan-500'
      }`}
    >
      {isVisibilityMode && isAdmin && (
        <div className="absolute top-2 right-2">
          <VisibilityEyeIcon elementKey={visibilityKey} size="sm" />
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className={`w-16 h-16 ${color} rounded-full`}></div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 text-center">{description}</p>
        {COLOR_TYPE_DESCRIPTIONS[id] && (
          <InfoTooltip content={COLOR_TYPE_DESCRIPTIONS[id]} />
        )}
        {isComingSoon && !isVisibilityMode && (
          <Badge variant="warning" className="mt-2">Coming Soon</Badge>
        )}
      </div>
    </div>
  );
}
