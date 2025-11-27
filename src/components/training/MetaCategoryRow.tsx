import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { Badge } from '../ui/Badge';
import { InfoTooltip } from '../ui/InfoTooltip';
import { getOptionVisibility } from '../../lib/trainingVisibilityUtils';
import { META_PROGRAM_DESCRIPTIONS } from '../../constants/trainingDescriptions';

interface MetaOption {
  value: string;
  label: string;
  descriptionKey: string;
}

interface MetaCategoryRowProps {
  title: string;
  visibilityKey: string;
  selectedValue: string | null;
  options: MetaOption[];
  isProUser: boolean;
  isVisibilityMode: boolean;
  isAdmin: boolean;
  visibility: Record<string, string>;
  onChange: (value: string) => void;
}

export function MetaCategoryRow({
  title,
  visibilityKey,
  selectedValue,
  options,
  isProUser,
  isVisibilityMode,
  isAdmin,
  visibility,
  onChange,
}: MetaCategoryRowProps) {
  const state = getOptionVisibility(visibilityKey, visibility);
  const isHidden = state === 'hidden';
  const isComingSoon = state === 'comingsoon';
  const isDisabled = !isProUser || isComingSoon;

  if (isHidden && !isVisibilityMode) {
    return null;
  }

  return (
    <div className={!isProUser ? 'bg-gray-50 rounded-lg p-4' : ''}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {isComingSoon && !isVisibilityMode && (
            <Badge variant="warning">Coming Soon</Badge>
          )}
          {isVisibilityMode && isAdmin && (
            <VisibilityEyeIcon elementKey={visibilityKey} size="sm" />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            className={`p-4 border-2 rounded-xl transition-all ${
              selectedValue === option.value
                ? 'border-[#A855F7] bg-[#F5F3FF]'
                : 'border-gray-200 hover:border-[#A855F7]'
            } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <span className="font-medium">{option.label}</span>
            {META_PROGRAM_DESCRIPTIONS[option.descriptionKey] && (
              <InfoTooltip content={META_PROGRAM_DESCRIPTIONS[option.descriptionKey]} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
