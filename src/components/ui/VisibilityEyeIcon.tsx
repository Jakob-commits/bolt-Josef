import { Eye, EyeOff, Clock } from 'lucide-react';
import { VisibilityState, useUIVisibility } from '../../contexts/UIVisibilityContext';
import { cycleVisibilityState, getVisibilityColor } from '../../lib/visibilityUtils';

type VisibilityEyeIconPropsWithState = {
  state: VisibilityState;
  onToggle: (newState: VisibilityState) => void;
  elementKey?: never;
};

type VisibilityEyeIconPropsWithKey = {
  elementKey: string;
  state?: never;
  onToggle?: never;
};

type VisibilityEyeIconProps = VisibilityEyeIconPropsWithState | VisibilityEyeIconPropsWithKey;

export function VisibilityEyeIcon(props: VisibilityEyeIconProps) {
  const { visibility, setVisibility } = useUIVisibility();

  const state = props.elementKey ? (visibility[props.elementKey] || 'visible') : props.state;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = cycleVisibilityState(state);

    if (props.elementKey) {
      try {
        await setVisibility(props.elementKey, newState);
      } catch (error) {
        console.error('Failed to update visibility:', error);
      }
    } else if (props.onToggle) {
      props.onToggle(newState);
    }
  };

  const colorClass = getVisibilityColor(state);

  const Icon = state === 'hidden' ? EyeOff : state === 'comingsoon' ? Clock : Eye;

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg hover:bg-white/80 transition-colors ${colorClass}`}
      title={`Status: ${state} (klicken zum Ändern)`}
    >
      <Icon className={`w-5 h-5 ${state === 'hidden' ? 'line-through' : ''}`} />
    </button>
  );
}
