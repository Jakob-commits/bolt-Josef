import { WelcomeCard } from './WelcomeCard';
import { NewsCard } from './NewsCard';
import { SkillProfileCard } from './SkillProfileCard';
import { RecentTrainingsCard } from './RecentTrainingsCard';
import { AchievementsCard } from './AchievementsCard';
import { WeeklyTrainingPlanCard } from './WeeklyTrainingPlanCard';
import { TrainingModesCard } from './TrainingModesCard';
import { DifficultyCard } from './DifficultyCard';
import { QuoteCard } from './QuoteCard';
import { CustomerTypeCard } from './CustomerTypeCard';
import { GuidelineAnalysisCard } from './GuidelineAnalysisCard';
import { TrainingSuiteCard } from './TrainingSuiteCard';
import { LeitfadenanalyseCard } from './LeitfadenanalyseCard';

export const CARD_REGISTRY: Record<string, any> = {
  welcome: WelcomeCard,
  news: NewsCard,
  skillProfile: SkillProfileCard,
  recentTrainings: RecentTrainingsCard,
  achievements: AchievementsCard,
  weeklyTrainingPlan: WeeklyTrainingPlanCard,
  trainingModes: TrainingModesCard,
  difficulty: DifficultyCard,
  quote: QuoteCard,
  customerAvatar: CustomerTypeCard,
  guidelineAnalysis: GuidelineAnalysisCard,
  trainingSuite: TrainingSuiteCard,
  leitfadenanalyse: LeitfadenanalyseCard,
};

export {
  WelcomeCard,
  NewsCard,
  SkillProfileCard,
  RecentTrainingsCard,
  AchievementsCard,
  WeeklyTrainingPlanCard,
  TrainingModesCard,
  DifficultyCard,
  QuoteCard,
  CustomerTypeCard,
  GuidelineAnalysisCard,
  TrainingSuiteCard,
  LeitfadenanalyseCard,
};
