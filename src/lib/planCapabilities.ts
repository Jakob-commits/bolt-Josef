export type UserPackage = 'starter' | 'premium' | 'pro';

export type DifficultyLevel = 'anfaenger' | 'fortgeschritten' | 'profi';

export interface PlanCapabilities {
  name: string;
  price: string;
  maxTrainings: number;
  weeklyPlanEnabled: boolean;
  customGuidelinesEnabled: boolean;
  analyticsEnabled: boolean;
  teamManagementEnabled: boolean;
  companyGuidelinesEnabled: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
  whiteLabelEnabled: boolean;
  features: string[];
  personalityEnabled: boolean;
  metaprogramsEnabled: boolean;
  allowedDifficulties: DifficultyLevel[];
}

export const PLAN_CAPABILITIES: Record<UserPackage, PlanCapabilities> = {
  starter: {
    name: 'Starter',
    price: '0€',
    maxTrainings: 5,
    weeklyPlanEnabled: false,
    customGuidelinesEnabled: false,
    analyticsEnabled: false,
    teamManagementEnabled: false,
    companyGuidelinesEnabled: false,
    prioritySupport: false,
    dedicatedAccountManager: false,
    whiteLabelEnabled: false,
    personalityEnabled: false,
    metaprogramsEnabled: false,
    allowedDifficulties: ['anfaenger'],
    features: [
      '5 Trainings pro Monat',
      'Basis-Trainingsmodi',
      'Community-Support',
    ],
  },
  premium: {
    name: 'Premium',
    price: '49€',
    maxTrainings: 50,
    weeklyPlanEnabled: true,
    customGuidelinesEnabled: true,
    analyticsEnabled: true,
    teamManagementEnabled: false,
    companyGuidelinesEnabled: false,
    prioritySupport: true,
    dedicatedAccountManager: false,
    whiteLabelEnabled: false,
    personalityEnabled: true,
    metaprogramsEnabled: false,
    allowedDifficulties: ['anfaenger', 'fortgeschritten'],
    features: [
      '50 Trainings pro Monat',
      'Alle Trainingsmodi',
      'Eigene Leitfäden',
      'Wochen-Trainingsplan',
      'Priority-Support',
      'Detaillierte Analytics',
    ],
  },
  pro: {
    name: 'Pro',
    price: '149€',
    maxTrainings: Infinity,
    weeklyPlanEnabled: true,
    customGuidelinesEnabled: true,
    analyticsEnabled: true,
    teamManagementEnabled: true,
    companyGuidelinesEnabled: true,
    prioritySupport: true,
    dedicatedAccountManager: true,
    whiteLabelEnabled: true,
    personalityEnabled: true,
    metaprogramsEnabled: true,
    allowedDifficulties: ['anfaenger', 'fortgeschritten', 'profi'],
    features: [
      'Unbegrenzte Trainings',
      'Alle Features',
      'Wochen-Trainingsplan',
      'Team-Verwaltung',
      'Firmenleitfäden',
      'Dedizierter Account Manager',
      'White-Label Option',
    ],
  },
} as const;

export function canAccessFeature(
  userPackage: UserPackage | undefined | null,
  feature: keyof PlanCapabilities
): boolean {
  if (!userPackage) return false;
  const capabilities = PLAN_CAPABILITIES[userPackage];
  if (!capabilities) return false;

  const value = capabilities[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;

  return false;
}

export function getPackageCapabilities(
  userPackage: UserPackage | undefined | null
): PlanCapabilities {
  if (!userPackage || !PLAN_CAPABILITIES[userPackage]) {
    return PLAN_CAPABILITIES.starter;
  }
  return PLAN_CAPABILITIES[userPackage];
}

export function canUsePersonality(userPackage: UserPackage | undefined | null): boolean {
  const caps = getPackageCapabilities(userPackage);
  return caps.personalityEnabled;
}

export function canUseMetaprograms(userPackage: UserPackage | undefined | null): boolean {
  const caps = getPackageCapabilities(userPackage);
  return caps.metaprogramsEnabled;
}

export function getAllowedDifficulties(userPackage: UserPackage | undefined | null): DifficultyLevel[] {
  const caps = getPackageCapabilities(userPackage);
  return caps.allowedDifficulties;
}

export function canUseDifficulty(
  userPackage: UserPackage | undefined | null,
  difficulty: DifficultyLevel
): boolean {
  const allowed = getAllowedDifficulties(userPackage);
  return allowed.includes(difficulty);
}

export function getDefaultDifficulty(userPackage: UserPackage | undefined | null): DifficultyLevel {
  const allowed = getAllowedDifficulties(userPackage);
  return allowed[0] || 'anfaenger';
}
