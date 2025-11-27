import { useState, useEffect } from 'react';
import { useUIVisibility } from '../contexts/UIVisibilityContext';
import {
  TRAINING_STEP_KEYS,
  DEFAULT_VALUES,
  shouldUseDefault
} from '../lib/trainingVisibilityUtils';

type TrainingMode = 'full-conversation' | 'cold-call' | 'objection' | 'needs' | 'smalltalk' | 'closing';
type DisgType = 'yellow' | 'blue' | 'green' | 'red' | 'standard';
type GuideMode = 'internal' | 'generated' | 'saved';
type DifficultyLevel = 'leicht' | 'mittel' | 'schwer';

interface MetaPrograms {
  detailLevel: 'detail' | 'overview' | null;
  decisionSpeed: 'fast' | 'slow' | null;
  focusType: 'facts' | 'relationship' | null;
  communicationStyle: 'direct' | 'indirect' | null;
}

export function useTrainingConfig() {
  const { visibility } = useUIVisibility();

  const [selectedMode, setSelectedMode] = useState<TrainingMode | null>(null);
  const [selectedDisgType, setSelectedDisgType] = useState<DisgType | null>(null);
  const [metaPrograms, setMetaPrograms] = useState<MetaPrograms>({
    detailLevel: null,
    decisionSpeed: null,
    focusType: null,
    communicationStyle: null,
  });
  const [selectedGuideMode, setSelectedGuideMode] = useState<GuideMode | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('leicht');

  // Apply defaults based on visibility
  useEffect(() => {
    // Human Type (Step 2)
    if (shouldUseDefault(TRAINING_STEP_KEYS.humanType, visibility)) {
      setSelectedDisgType('standard');
    }

    // META Programs (Step 3)
    if (shouldUseDefault(TRAINING_STEP_KEYS.meta, visibility)) {
      setMetaPrograms({
        detailLevel: null,
        decisionSpeed: null,
        focusType: null,
        communicationStyle: null,
      });
    }

    // Guidelines (Step 4)
    if (shouldUseDefault(TRAINING_STEP_KEYS.guidelines, visibility)) {
      setSelectedGuideMode('generated');
    }

    // Difficulty (Step 5)
    if (shouldUseDefault(TRAINING_STEP_KEYS.difficulty, visibility)) {
      setSelectedDifficulty('mittel');
    }
  }, [visibility]);

  // Get display value with visibility awareness
  const getDisplayDisgType = () => {
    if (shouldUseDefault(TRAINING_STEP_KEYS.humanType, visibility)) {
      return 'standard';
    }
    return selectedDisgType || 'standard';
  };

  const getDisplayMetaPrograms = () => {
    if (shouldUseDefault(TRAINING_STEP_KEYS.meta, visibility)) {
      return {
        detailLevel: null,
        decisionSpeed: null,
        focusType: null,
        communicationStyle: null,
      };
    }
    return metaPrograms;
  };

  const getDisplayGuideMode = () => {
    if (shouldUseDefault(TRAINING_STEP_KEYS.guidelines, visibility)) {
      return 'generated';
    }
    return selectedGuideMode || 'generated';
  };

  const getDisplayDifficulty = () => {
    if (shouldUseDefault(TRAINING_STEP_KEYS.difficulty, visibility)) {
      return 'mittel';
    }
    return selectedDifficulty;
  };

  // Check if a value is standard (default)
  const isStandard = {
    disgType: getDisplayDisgType() === 'standard',
    meta: !getDisplayMetaPrograms().detailLevel,
    guideMode: getDisplayGuideMode() === 'generated',
    difficulty: getDisplayDifficulty() === 'mittel',
  };

  return {
    // Raw values
    selectedMode,
    selectedDisgType,
    metaPrograms,
    selectedGuideMode,
    selectedDifficulty,

    // Setters
    setSelectedMode,
    setSelectedDisgType,
    setMetaPrograms,
    setSelectedGuideMode,
    setSelectedDifficulty,

    // Display values (visibility-aware)
    getDisplayDisgType,
    getDisplayMetaPrograms,
    getDisplayGuideMode,
    getDisplayDifficulty,

    // Standard checks
    isStandard,

    // Visibility states
    visibility,
  };
}
