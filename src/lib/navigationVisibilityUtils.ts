import { VisibilityState } from '../contexts/UIVisibilityContext';

export const NAVIGATION_KEYS = {
  hallOfFame: 'nav.hallOfFame',
  challenges: 'nav.challenges',
} as const;

export type NavigationKey = typeof NAVIGATION_KEYS[keyof typeof NAVIGATION_KEYS];

export interface NavigationItemConfig {
  key: NavigationKey;
  label: string;
  view: string;
}

export const NAVIGATION_ITEMS: NavigationItemConfig[] = [
  {
    key: NAVIGATION_KEYS.hallOfFame,
    label: 'Hall of Fame',
    view: 'halloffame',
  },
  {
    key: NAVIGATION_KEYS.challenges,
    label: 'Challenges',
    view: 'challenges',
  },
];

export interface NavigationItemVisibility {
  key: NavigationKey;
  state: VisibilityState;
  isVisible: boolean;
  isClickable: boolean;
  showComingSoonBadge: boolean;
}

export function getNavigationItemVisibility(
  key: NavigationKey,
  visibilityMap: Record<string, VisibilityState>,
  isAdminMode: boolean
): NavigationItemVisibility {
  const state = visibilityMap[key] || 'visible';

  if (isAdminMode) {
    return {
      key,
      state,
      isVisible: true,
      isClickable: state === 'visible',
      showComingSoonBadge: state === 'comingsoon',
    };
  }

  return {
    key,
    state,
    isVisible: state !== 'hidden',
    isClickable: state === 'visible',
    showComingSoonBadge: state === 'comingsoon',
  };
}
