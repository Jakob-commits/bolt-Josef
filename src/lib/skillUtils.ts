import { SkillScores } from './supabase';

export type SkillLevel = 'Anfänger' | 'Fortgeschritten' | 'Profi';

export type SkillLevelResult = {
  percent: number;
  label: SkillLevel;
};

export function calculateSkillLevel(scores: SkillScores | null): SkillLevelResult {
  if (!scores) {
    return {
      percent: 0,
      label: 'Anfänger',
    };
  }

  const total = (
    scores.rapport_building +
    scores.needs_analysis +
    scores.objection_handling +
    scores.closing +
    scores.communication
  ) / 5;

  const percent = Math.round(total);

  let label: SkillLevel;
  if (percent >= 70) {
    label = 'Profi';
  } else if (percent >= 40) {
    label = 'Fortgeschritten';
  } else {
    label = 'Anfänger';
  }

  return { percent, label };
}

export function getSkillLevelColor(label: SkillLevel | string): string {
  const colors: Record<SkillLevel, string> = {
    Anfänger: 'bg-slate-100 text-slate-700',
    Fortgeschritten: 'bg-cyan-100 text-cyan-700',
    Profi: 'bg-purple-100 text-purple-700',
  };

  const normalized = label.toLowerCase();

  if (normalized.includes('profi')) {
    return colors['Profi'];
  }

  if (normalized.includes('fortgeschritten')) {
    return colors['Fortgeschritten'];
  }

  return colors['Anfänger'];
}
