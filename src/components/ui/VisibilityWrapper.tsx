import { ReactNode } from 'react';
import { VisibilityState } from '../../contexts/UIVisibilityContext';
import { useUIVisibility } from '../../contexts/UIVisibilityContext';
import { VisibilityEyeIcon } from './VisibilityEyeIcon';
import { getVisibilityBgColor } from '../../lib/visibilityUtils';
import { Badge } from './Badge';

type VisibilityWrapperProps = {
  elementKey: string;
  children: ReactNode;
  isAdminMode?: boolean;
  className?: string;
};

export function VisibilityWrapper({
  elementKey,
  children,
  isAdminMode = false,
  className = '',
}: VisibilityWrapperProps) {
  const { visibility, setVisibility } = useUIVisibility();
  const state = visibility[elementKey] || 'visible';

  if (!isAdminMode && state === 'hidden') {
    return null;
  }

  const handleToggle = async (newState: VisibilityState) => {
    try {
      await setVisibility(elementKey, newState);
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const bgClass = isAdminMode && state === 'hidden' ? 'border-dashed' : '';
  const opacityClass = state === 'comingsoon' ? 'opacity-75' : '';

  return (
    <div className={`relative ${className}`}>
      {isAdminMode && (
        <div className="absolute top-2 right-2 z-10">
          <VisibilityEyeIcon state={state} onToggle={handleToggle} />
        </div>
      )}

      {state === 'comingsoon' && !isAdminMode && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="warning">Coming Soon</Badge>
        </div>
      )}

      <div
        className={`${bgClass} ${opacityClass} ${
          isAdminMode && state === 'hidden' ? getVisibilityBgColor(state) : ''
        }`}
      >
        {state === 'comingsoon' ? (
          <div className="pointer-events-none">{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
