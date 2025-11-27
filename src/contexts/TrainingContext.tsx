import { createContext, useContext, useState, ReactNode } from 'react';

interface MetaPrograms {
  detail: 'detail' | 'big-picture' | null;
  speed: 'fast' | 'slow' | null;
  focus: 'facts' | 'relationship' | null;
  style: 'direct' | 'indirect' | null;
}

interface TrainingConfig {
  mode: string | null;
  difficulty: string | null;
  colorType: 'yellow' | 'blue' | 'green' | 'red' | null;
  metaPrograms: MetaPrograms;
  guideMode: 'company' | 'generated' | 'saved' | null;
  guideRef: string | null;
}

interface TrainingContextType {
  trainingConfig: TrainingConfig;
  setMode: (mode: string) => void;
  setDifficulty: (difficulty: string) => void;
  setColorType: (color: 'yellow' | 'blue' | 'green' | 'red') => void;
  setMetaProgram: (key: 'detail' | 'speed' | 'focus' | 'style', value: string) => void;
  setGuideMode: (mode: 'company' | 'generated' | 'saved') => void;
  setGuideRef: (ref: string | null) => void;
  resetTrainingConfig: () => void;
  isStepValid: (step: number) => boolean;
}

const initialConfig: TrainingConfig = {
  mode: null,
  difficulty: null,
  colorType: null,
  metaPrograms: {
    detail: null,
    speed: null,
    focus: null,
    style: null,
  },
  guideMode: null,
  guideRef: null,
};

const TrainingContext = createContext<TrainingContextType>({
  trainingConfig: initialConfig,
  setMode: () => {},
  setDifficulty: () => {},
  setColorType: () => {},
  setMetaProgram: () => {},
  setGuideMode: () => {},
  setGuideRef: () => {},
  resetTrainingConfig: () => {},
  isStepValid: () => false,
});

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>(initialConfig);

  const setMode = (mode: string) => {
    setTrainingConfig(prev => ({ ...prev, mode }));
  };

  const setDifficulty = (difficulty: string) => {
    setTrainingConfig(prev => ({ ...prev, difficulty }));
  };

  const setColorType = (color: 'yellow' | 'blue' | 'green' | 'red') => {
    setTrainingConfig(prev => ({ ...prev, colorType: color }));
  };

  const setMetaProgram = (key: 'detail' | 'speed' | 'focus' | 'style', value: string) => {
    setTrainingConfig(prev => ({
      ...prev,
      metaPrograms: {
        ...prev.metaPrograms,
        [key]: value,
      },
    }));
  };

  const setGuideMode = (mode: 'company' | 'generated' | 'saved') => {
    setTrainingConfig(prev => ({ ...prev, guideMode: mode }));
  };

  const setGuideRef = (ref: string | null) => {
    setTrainingConfig(prev => ({ ...prev, guideRef: ref }));
  };

  const resetTrainingConfig = () => {
    setTrainingConfig(initialConfig);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return trainingConfig.mode !== null && trainingConfig.difficulty !== null;
      case 2:
        return trainingConfig.colorType !== null;
      case 3:
        return (
          trainingConfig.metaPrograms.detail !== null &&
          trainingConfig.metaPrograms.speed !== null &&
          trainingConfig.metaPrograms.focus !== null &&
          trainingConfig.metaPrograms.style !== null
        );
      case 4:
        if (trainingConfig.guideMode === null) return false;
        if (trainingConfig.guideMode === 'generated') return true;
        return trainingConfig.guideRef !== null;
      case 5:
        return isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);
      default:
        return false;
    }
  };

  return (
    <TrainingContext.Provider
      value={{
        trainingConfig,
        setMode,
        setDifficulty,
        setColorType,
        setMetaProgram,
        setGuideMode,
        setGuideRef,
        resetTrainingConfig,
        isStepValid,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export const useTraining = () => useContext(TrainingContext);
