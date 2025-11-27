import { LucideIcon } from 'lucide-react';
import { InfoTooltip } from '../ui/InfoTooltip';
import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { Badge } from '../ui/Badge';
import { getOptionVisibility } from '../../lib/trainingVisibilityUtils';
import { GUIDE_MODE_DESCRIPTIONS } from '../../constants/trainingDescriptions';

interface GuidelineModeCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  packages: string[];
  visibilityKey: string;
  isSelected: boolean;
  userPackage: string;
  isVisibilityMode: boolean;
  isAdmin: boolean;
  visibility: Record<string, string>;
  onSelect: () => void;
}

export function GuidelineModeCard({
  id,
  title,
  description,
  icon: Icon,
  packages,
  visibilityKey,
  isSelected,
  userPackage,
  isVisibilityMode,
  isAdmin,
  visibility,
  onSelect,
}: GuidelineModeCardProps) {
  const state = getOptionVisibility(visibilityKey, visibility);
  const isHidden = state === 'hidden';
  const isComingSoon = state === 'comingsoon';
  const isPackageAllowed = packages.includes(userPackage);
  const isDisabled = !isPackageAllowed || isComingSoon || (isHidden && !isVisibilityMode);

  if (isHidden && !isVisibilityMode) {
    return null;
  }

  return (
    <div
      onClick={() => !isDisabled && onSelect()}
      className={`relative p-4 border-2 rounded-xl transition-all ${
        isDisabled
          ? 'opacity-40 cursor-not-allowed bg-gray-50'
          : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 hover:border-purple-500'
      }`}
    >
      {isVisibilityMode && isAdmin && (
        <div className="absolute top-2 right-2">
          <VisibilityEyeIcon elementKey={visibilityKey} size="sm" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <Icon className="w-6 h-6 text-purple-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {GUIDE_MODE_DESCRIPTIONS[id] && (
            <InfoTooltip content={GUIDE_MODE_DESCRIPTIONS[id]} />
          )}
          {!isPackageAllowed && !isVisibilityMode && (
            <Badge variant="warning" className="mt-2">Pro Feature</Badge>
          )}
          {isComingSoon && !isVisibilityMode && (
            <Badge variant="warning" className="mt-2">Coming Soon</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
