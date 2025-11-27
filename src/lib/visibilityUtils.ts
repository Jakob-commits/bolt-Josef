import { VisibilityState } from '../contexts/UIVisibilityContext';

export const UI_KEYS = {
  home: {
    trainingSuite: 'home.trainingSuite',
    leitfadenanalyse: 'home.leitfadenanalyse',
    news: 'home.news',
    skillProfile: 'home.skillProfile',
    lastTrainings: 'home.lastTrainings',
    achievements: 'home.achievements',
    weeklyPlan: 'home.weeklyPlan',
    hallOfFame: 'home.hallOfFame',
    challenges: 'home.challenges',
    analytics: 'home.analytics',
    files: 'home.files',
  },
  ts: {
    step1: 'ts.step1.modus',
    step2: 'ts.step2.menschentyp',
    step3: 'ts.step3.meta',
    step4: 'ts.step4.vorgaben',
    step5: 'ts.step5.schwierigkeit',
    step6: 'ts.step6.summary',
  },
} as const;

export const ALL_STEPS = [
  'ts.step1.modus',
  'ts.step2.menschentyp',
  'ts.step3.meta',
  'ts.step4.vorgaben',
  'ts.step5.schwierigkeit',
  'ts.step6.summary',
] as const;

export type UserPackage = 'starter' | 'premium' | 'pro';

export type StepConfig = {
  key: string;
  label: string;
  availableForPackages: UserPackage[];
  isOptional: boolean;
  defaultValue: string | null;
};

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'ts.step1.modus',
    label: 'Modus',
    availableForPackages: ['starter', 'premium', 'pro'],
    isOptional: false,
    defaultValue: null,
  },
  {
    key: 'ts.step2.menschentyp',
    label: 'Menschentyp',
    availableForPackages: ['starter', 'premium', 'pro'],
    isOptional: true,
    defaultValue: 'Standard',
  },
  {
    key: 'ts.step3.meta',
    label: 'Meta',
    availableForPackages: ['pro'],
    isOptional: false,
    defaultValue: 'Standardprofil',
  },
  {
    key: 'ts.step4.vorgaben',
    label: 'Vorgaben',
    availableForPackages: ['starter', 'premium', 'pro'],
    isOptional: false,
    defaultValue: 'Gestalten lassen',
  },
  {
    key: 'ts.step5.schwierigkeit',
    label: 'Schwierigkeit',
    availableForPackages: ['starter', 'premium', 'pro'],
    isOptional: false,
    defaultValue: 'Mittel',
  },
  {
    key: 'ts.step6.summary',
    label: 'Zusammenfassung',
    availableForPackages: ['starter', 'premium', 'pro'],
    isOptional: false,
    defaultValue: null,
  },
];

export type StepDisplayInfo = {
  isVisible: boolean;
  displayNumber: number | 'i' | null;
  isDisabled: boolean;
  state: VisibilityState;
  isBypassedByPackage: boolean;
};

export function getVisibilityState(
  key: string,
  visibilityMap: Record<string, VisibilityState>
): VisibilityState {
  return visibilityMap[key] || 'visible';
}

export function getEffectiveStepsForUser(
  userPackage: UserPackage,
  visibilityMap: Record<string, VisibilityState>,
  isAdminMode: boolean
): StepConfig[] {
  return STEP_CONFIGS.filter((step) => {
    const state = getVisibilityState(step.key, visibilityMap);

    if (isAdminMode) {
      return true;
    }

    if (state === 'hidden') {
      return false;
    }

    return true;
  });
}

export function getStepDisplayInfo(
  stepKey: string,
  userPackage: UserPackage,
  visibilityMap: Record<string, VisibilityState>,
  isAdminMode: boolean
): StepDisplayInfo {
  const stepConfig = STEP_CONFIGS.find((s) => s.key === stepKey);
  if (!stepConfig) {
    return {
      isVisible: false,
      displayNumber: null,
      isDisabled: true,
      state: 'hidden',
      isBypassedByPackage: false,
    };
  }

  const state = getVisibilityState(stepKey, visibilityMap);

  const isBypassedByPackage = !stepConfig.availableForPackages.includes(userPackage);

  if (isAdminMode) {
    const visibleSteps = STEP_CONFIGS.filter(
      (s) => getVisibilityState(s.key, visibilityMap) !== 'hidden'
    );
    const stepIndex = visibleSteps.findIndex((s) => s.key === stepKey);

    const displayNumber = state === 'hidden' ? 'i' : stepIndex + 1;

    return {
      isVisible: true,
      displayNumber,
      isDisabled: state === 'comingsoon' || isBypassedByPackage,
      state,
      isBypassedByPackage,
    };
  }

  if (state === 'hidden') {
    return {
      isVisible: false,
      displayNumber: null,
      isDisabled: true,
      state,
      isBypassedByPackage,
    };
  }

  const visibleSteps = STEP_CONFIGS.filter(
    (s) => getVisibilityState(s.key, visibilityMap) !== 'hidden'
  );
  const stepIndex = visibleSteps.findIndex((s) => s.key === stepKey);

  return {
    isVisible: true,
    displayNumber: stepIndex + 1,
    isDisabled: state === 'comingsoon' || isBypassedByPackage,
    state,
    isBypassedByPackage,
  };
}

export function shouldUseDefaultValue(
  stepKey: string,
  userPackage: UserPackage,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const stepConfig = STEP_CONFIGS.find((s) => s.key === stepKey);
  if (!stepConfig) return false;

  const state = getVisibilityState(stepKey, visibilityMap);

  if (state === 'hidden' || state === 'comingsoon') {
    return true;
  }

  const isBypassedByPackage = !stepConfig.availableForPackages.includes(userPackage);
  return isBypassedByPackage;
}

export function getDefaultValue(stepKey: string): string | null {
  const stepConfig = STEP_CONFIGS.find((s) => s.key === stepKey);
  return stepConfig?.defaultValue || null;
}

export function cycleVisibilityState(currentState: VisibilityState): VisibilityState {
  const cycle: VisibilityState[] = ['visible', 'comingsoon', 'hidden'];
  const currentIndex = cycle.indexOf(currentState);
  const nextIndex = (currentIndex + 1) % cycle.length;
  return cycle[nextIndex];
}

export function getVisibilityColor(state: VisibilityState): string {
  switch (state) {
    case 'visible':
      return 'text-green-600';
    case 'comingsoon':
      return 'text-orange-500';
    case 'hidden':
      return 'text-gray-400';
  }
}

export function getVisibilityBgColor(state: VisibilityState): string {
  switch (state) {
    case 'visible':
      return 'bg-green-50 border-green-200';
    case 'comingsoon':
      return 'bg-orange-50 border-orange-200';
    case 'hidden':
      return 'bg-gray-50 border-gray-300 opacity-60';
  }
}
