export type DifficultyLevel = 'anfaenger' | 'fortgeschritten' | 'profi';

export interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  level: number;
}

export const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { value: 'anfaenger', label: 'Anfänger', level: 1 },
  { value: 'fortgeschritten', label: 'Fortgeschritten', level: 2 },
  { value: 'profi', label: 'Profi', level: 3 },
];

export function getDifficultyLevel(difficulty: string): number {
  const level = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
  return level?.level || 1;
}

export function getDifficultyLabel(difficulty: string): string {
  const level = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
  return level?.label || difficulty;
}

export function getAllowedDifficulties(userSkillLevel: string): DifficultyOption[] {
  const userLevel = getDifficultyLevel(userSkillLevel);
  return DIFFICULTY_LEVELS.filter(d => d.level <= userLevel + 1);
}

export function canSelectDifficulty(userSkillLevel: string, targetDifficulty: string): boolean {
  const userLevel = getDifficultyLevel(userSkillLevel);
  const targetLevel = getDifficultyLevel(targetDifficulty);
  return targetLevel <= userLevel + 1;
}

export function calculatePointsBonus(userSkillLevel: string, challengeDifficulty: string): number {
  const userLevel = getDifficultyLevel(userSkillLevel);
  const challengeLevel = getDifficultyLevel(challengeDifficulty);

  if (challengeLevel > userLevel) {
    return 20;
  }

  return 0;
}

export function getPointsBonusText(bonus: number): string {
  if (bonus === 0) return '';
  return `+${bonus}% Bonus`;
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'anfaenger':
      return 'text-green-600';
    case 'fortgeschritten':
      return 'text-blue-600';
    case 'profi':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}

export function getDifficultyBadgeColor(difficulty: string): string {
  switch (difficulty) {
    case 'anfaenger':
      return 'bg-green-100 text-green-800';
    case 'fortgeschritten':
      return 'bg-blue-100 text-blue-800';
    case 'profi':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
