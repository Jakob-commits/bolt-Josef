import { VisibilityState } from '../contexts/UIVisibilityContext';

export const TRAINING_STEP_KEYS = {
  mode: 'ts.step1.modus',
  humanType: 'ts.step2.menschentyp',
  meta: 'ts.step3.meta',
  guidelines: 'ts.step4.vorgaben',
  difficulty: 'ts.step5.schwierigkeit',
  summary: 'ts.step6.summary',
} as const;

export const TRAINING_MODE_KEYS = {
  fullConversation: 'ts.mode.gesamtgespraech',
  coldCall: 'ts.mode.kaltakquise',
  objection: 'ts.mode.einwand',
  needs: 'ts.mode.bedarfsanalyse',
  smalltalk: 'ts.mode.smalltalk',
  closing: 'ts.mode.abschluss',
} as const;

export const PERSON_TYPE_KEYS = {
  yellow: 'ts.person.gelb',
  blue: 'ts.person.blau',
  green: 'ts.person.gruen',
  red: 'ts.person.rot',
} as const;

export const META_CATEGORY_KEYS = {
  detailLevel: 'ts.step3.meta.detailLevel',
  decisionSpeed: 'ts.step3.meta.decisionSpeed',
  focusType: 'ts.step3.meta.focusType',
  communicationStyle: 'ts.step3.meta.commStyle',
} as const;

export const GUIDELINE_MODE_KEYS = {
  internal: 'ts.step4.vorgaben.system',
  generated: 'ts.step4.vorgaben.generated',
  saved: 'ts.step4.vorgaben.saved',
} as const;

export type TrainingStepKey = typeof TRAINING_STEP_KEYS[keyof typeof TRAINING_STEP_KEYS];

export interface StepConfig {
  key: TrainingStepKey;
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  canBeHidden: boolean;
}

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: TRAINING_STEP_KEYS.mode,
    stepNumber: 1,
    label: 'Modus',
    canBeHidden: false,
  },
  {
    key: TRAINING_STEP_KEYS.humanType,
    stepNumber: 2,
    label: 'Menschentyp',
    canBeHidden: true,
  },
  {
    key: TRAINING_STEP_KEYS.meta,
    stepNumber: 3,
    label: 'META-Programme',
    canBeHidden: true,
  },
  {
    key: TRAINING_STEP_KEYS.guidelines,
    stepNumber: 4,
    label: 'Vorgaben',
    canBeHidden: true,
  },
  {
    key: TRAINING_STEP_KEYS.difficulty,
    stepNumber: 5,
    label: 'Schwierigkeit',
    canBeHidden: true,
  },
  {
    key: TRAINING_STEP_KEYS.summary,
    stepNumber: 6,
    label: 'Start',
    canBeHidden: false,
  },
];

export interface StepVisibilityInfo {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  displayNumber: number | 'i' | null;
  state: VisibilityState;
  isVisible: boolean;
  isClickable: boolean;
  showInNav: boolean;
}

export function getVisibleSteps(
  visibilityMap: Record<string, VisibilityState>,
  isAdminMode: boolean
): StepConfig[] {
  if (isAdminMode) {
    return STEP_CONFIGS;
  }

  return STEP_CONFIGS.filter((step) => {
    const state = visibilityMap[step.key] || 'visible';
    return state !== 'hidden';
  });
}

export function calculateStepDisplay(
  visibilityMap: Record<string, VisibilityState>,
  isAdminMode: boolean
): Map<number, StepVisibilityInfo> {
  const result = new Map<number, StepVisibilityInfo>();

  const visibleSteps = STEP_CONFIGS.filter((step) => {
    const state = visibilityMap[step.key] || 'visible';
    return state !== 'hidden';
  });

  let displayCounter = 1;

  for (const step of STEP_CONFIGS) {
    const state = visibilityMap[step.key] || 'visible';
    const isHidden = state === 'hidden';
    const isComingSoon = state === 'comingsoon';

    let displayNumber: number | 'i' | null;
    let showInNav: boolean;
    let isVisible: boolean;
    let isClickable: boolean;

    if (isAdminMode) {
      showInNav = true;
      isVisible = true;

      if (isHidden) {
        displayNumber = 'i';
        isClickable = false;
      } else {
        displayNumber = displayCounter;
        displayCounter++;
        isClickable = !isComingSoon;
      }
    } else {
      if (isHidden) {
        displayNumber = null;
        showInNav = false;
        isVisible = false;
        isClickable = false;
      } else {
        displayNumber = displayCounter;
        displayCounter++;
        showInNav = true;
        isVisible = true;
        isClickable = !isComingSoon;
      }
    }

    result.set(step.stepNumber, {
      stepNumber: step.stepNumber,
      displayNumber,
      state,
      isVisible,
      isClickable,
      showInNav,
    });
  }

  return result;
}

export interface TrainingDefaults {
  mode: 'standard' | string;
  humanType: 'standard' | string | null;
  metaPrograms: {
    detailLevel: 'standard' | string | null;
    decisionSpeed: 'standard' | string | null;
    focusType: 'standard' | string | null;
    communicationStyle: 'standard' | string | null;
  };
  guideMode: 'standard' | string;
  difficulty: 'mittel' | string;
}

export const DEFAULT_VALUES: TrainingDefaults = {
  mode: 'standard',
  humanType: 'standard',
  metaPrograms: {
    detailLevel: 'standard',
    decisionSpeed: 'standard',
    focusType: 'standard',
    communicationStyle: 'standard',
  },
  guideMode: 'standard',
  difficulty: 'mittel',
};

export function shouldUseDefault(
  stepKey: TrainingStepKey,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const state = visibilityMap[stepKey] || 'visible';
  return state === 'hidden' || state === 'comingsoon';
}

export function getNextVisibleStep(
  currentStep: 1 | 2 | 3 | 4 | 5 | 6,
  visibilityMap: Record<string, VisibilityState>,
  direction: 'forward' | 'backward'
): 1 | 2 | 3 | 4 | 5 | 6 | null {
  const visibleSteps = getVisibleSteps(visibilityMap, false);
  const currentIndex = visibleSteps.findIndex(s => s.stepNumber === currentStep);

  if (currentIndex === -1) return null;

  if (direction === 'forward') {
    const nextStep = visibleSteps[currentIndex + 1];
    return nextStep ? nextStep.stepNumber : null;
  } else {
    const prevStep = visibleSteps[currentIndex - 1];
    return prevStep ? prevStep.stepNumber : null;
  }
}

export function isStepDisabled(
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const step = STEP_CONFIGS.find(s => s.stepNumber === stepNumber);
  if (!step) return true;

  const state = visibilityMap[step.key] || 'visible';
  return state === 'comingsoon' || state === 'hidden';
}

export function getOptionVisibility(
  optionKey: string,
  visibilityMap: Record<string, VisibilityState>
): VisibilityState {
  return visibilityMap[optionKey] || 'visible';
}

export function isOptionAvailable(
  optionKey: string,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const state = getOptionVisibility(optionKey, visibilityMap);
  return state === 'visible';
}

export function isOptionComingSoon(
  optionKey: string,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const state = getOptionVisibility(optionKey, visibilityMap);
  return state === 'comingsoon';
}

export function isOptionHidden(
  optionKey: string,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const state = getOptionVisibility(optionKey, visibilityMap);
  return state === 'hidden';
}

export function getAvailableOptions<T extends string>(
  optionKeys: Record<string, string>,
  visibilityMap: Record<string, VisibilityState>,
  isAdminMode: boolean
): string[] {
  if (isAdminMode) {
    return Object.values(optionKeys);
  }
  return Object.values(optionKeys).filter(key => !isOptionHidden(key, visibilityMap));
}

export function shouldUseStandardForCategory(
  categoryKey: string,
  visibilityMap: Record<string, VisibilityState>
): boolean {
  const state = visibilityMap[categoryKey] || 'visible';
  return state === 'hidden' || state === 'comingsoon';
}
