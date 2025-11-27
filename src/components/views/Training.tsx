import { useState, useEffect } from 'react';
import { PlayCircle, Phone, Users, FileText, TrendingUp, Target, ArrowLeft, ArrowRight, Upload, Sparkles, BookOpen, Shuffle, UserCircle } from 'lucide-react';
import { InfoTooltip } from '../ui/InfoTooltip';
import { Badge } from '../ui/Badge';
import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { MODE_DESCRIPTIONS, COLOR_TYPE_DESCRIPTIONS, META_PROGRAM_DESCRIPTIONS, GUIDE_MODE_DESCRIPTIONS } from '../../constants/trainingDescriptions';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUIVisibility } from '../../contexts/UIVisibilityContext';
import { supabase, isAdminOrHigher } from '../../lib/supabase';
import {
  TRAINING_STEP_KEYS,
  TRAINING_MODE_KEYS,
  PERSON_TYPE_KEYS,
  META_CATEGORY_KEYS,
  GUIDELINE_MODE_KEYS,
  calculateStepDisplay,
  shouldUseDefault,
  shouldUseStandardForCategory,
  getNextVisibleStep
} from '../../lib/trainingVisibilityUtils';
import { TrainingModeCard } from '../training/TrainingModeCard';
import { PersonTypeCard } from '../training/PersonTypeCard';
import { MetaCategoryRow } from '../training/MetaCategoryRow';
import { GuidelineModeCard } from '../training/GuidelineModeCard';

interface TrainingProps {
  onNavigate?: (view: string) => void;
}

type TrainingMode = 'full-conversation' | 'cold-call' | 'objection' | 'needs' | 'smalltalk' | 'closing';
type DisgType = 'yellow' | 'blue' | 'green' | 'red';
type GuideMode = 'internal' | 'generated' | 'saved';
type DifficultyLevel = 'leicht' | 'mittel' | 'schwer';

interface TrainingGuide {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface MetaPrograms {
  detailLevel: 'detail' | 'overview' | null;
  decisionSpeed: 'fast' | 'slow' | null;
  focusType: 'facts' | 'relationship' | null;
  communicationStyle: 'direct' | 'indirect' | null;
}

export function Training({ onNavigate }: TrainingProps = {}) {
  const { setCurrentPage, isVisibilityMode } = useUI();
  const { user, profile } = useAuth();
  const { visibility } = useUIVisibility();
  const isAdmin = isAdminOrHigher(profile);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [hasUsedBack, setHasUsedBack] = useState(false);

  const [selectedMode, setSelectedMode] = useState<TrainingMode | null>(null);
  const [selectedDisgType, setSelectedDisgType] = useState<DisgType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('leicht');

  const [metaPrograms, setMetaPrograms] = useState<MetaPrograms>({
    detailLevel: null,
    decisionSpeed: null,
    focusType: null,
    communicationStyle: null,
  });

  const [selectedGuideMode, setSelectedGuideMode] = useState<GuideMode | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [availableGuides, setAvailableGuides] = useState<TrainingGuide[]>([]);

  const userPackage = profile?.package || 'starter';
  const isProUser = userPackage === 'pro';
  const isPremiumOrPro = userPackage === 'premium' || userPackage === 'pro';

  const stepDisplayMap = calculateStepDisplay(visibility, isVisibilityMode && isAdmin);

  const allSteps = [
    { stepNumber: 1, key: TRAINING_STEP_KEYS.mode, label: 'Modus', canBeHidden: false },
    { stepNumber: 2, key: TRAINING_STEP_KEYS.humanType, label: 'Menschentyp', canBeHidden: true },
    { stepNumber: 3, key: TRAINING_STEP_KEYS.meta, label: 'META-Programme', canBeHidden: true },
    { stepNumber: 4, key: TRAINING_STEP_KEYS.guidelines, label: 'Vorgaben', canBeHidden: true },
    { stepNumber: 5, key: TRAINING_STEP_KEYS.difficulty, label: 'Schwierigkeit', canBeHidden: true },
    { stepNumber: 6, key: TRAINING_STEP_KEYS.summary, label: 'Start', canBeHidden: false },
  ] as const;

  const visibleSteps = allSteps.filter(s => {
    const info = stepDisplayMap.get(s.stepNumber as 1 | 2 | 3 | 4 | 5 | 6);
    return info && info.showInNav;
  });

  const trainingModes = [
    { id: 'full-conversation', title: 'Gesamtgespräch', description: 'Vollständiges Verkaufsgespräch von Beginn bis Abschluss', icon: Phone, visibilityKey: TRAINING_MODE_KEYS.fullConversation },
    { id: 'cold-call', title: 'Kaltakquise', description: 'Erstkontakt und Türöffner-Training', icon: Phone, visibilityKey: TRAINING_MODE_KEYS.coldCall },
    { id: 'objection', title: 'Einwandbehandlung', description: 'Umgang mit Vorbehalten und Bedenken', icon: FileText, visibilityKey: TRAINING_MODE_KEYS.objection },
    { id: 'needs', title: 'Bedarfsermittlung', description: 'Fragen stellen und aktiv zuhören', icon: Target, visibilityKey: TRAINING_MODE_KEYS.needs },
    { id: 'smalltalk', title: 'Small Talk', description: 'Beziehungsaufbau und Gesprächseinstieg', icon: Users, visibilityKey: TRAINING_MODE_KEYS.smalltalk },
    { id: 'closing', title: 'Abschluss', description: 'Deal finalisieren und Commitment einholen', icon: TrendingUp, visibilityKey: TRAINING_MODE_KEYS.closing },
  ];

  const disgTypes = [
    { id: 'yellow', title: 'Gelb', description: 'Initiativ', color: 'bg-yellow-400', visibilityKey: PERSON_TYPE_KEYS.yellow },
    { id: 'blue', title: 'Blau', description: 'Gewissenhaft', color: 'bg-blue-400', visibilityKey: PERSON_TYPE_KEYS.blue },
    { id: 'green', title: 'Grün', description: 'Stetig', color: 'bg-green-400', visibilityKey: PERSON_TYPE_KEYS.green },
    { id: 'red', title: 'Rot', description: 'Dominant', color: 'bg-red-400', visibilityKey: PERSON_TYPE_KEYS.red },
  ];

  const difficultyLevels = [
    { id: 'leicht', title: 'Anfänger', description: 'Ideal zum Einstieg oder Aufwärmen', icon: '🌱' },
    { id: 'mittel', title: 'Fortgeschritten', description: 'Realistische Alltagssituationen', icon: '⚡' },
    { id: 'schwer', title: 'Profi', description: 'Herausfordernde Szenarien für Profis', icon: '🔥' },
  ];

  const guideModes = [
    { id: 'internal', title: 'Firmeninterne Vorgaben', description: 'Standard-Verkaufsmethodik vom System', icon: BookOpen, packages: ['pro'], visibilityKey: GUIDELINE_MODE_KEYS.internal },
    { id: 'generated', title: 'Gestalten lassen', description: 'Individuell angepasst auf deine Branche/Produkt', icon: Sparkles, packages: ['starter', 'premium', 'pro'], visibilityKey: GUIDELINE_MODE_KEYS.generated },
    { id: 'saved', title: 'Gespeicherte Leitfäden', description: 'Verwende deine gespeicherten Verkaufsskripte', icon: Upload, packages: ['pro'], visibilityKey: GUIDELINE_MODE_KEYS.saved },
  ];

  useEffect(() => {
    setCurrentPage('training');
    return () => setCurrentPage(null);
  }, [setCurrentPage]);

  useEffect(() => {
    if (user) {
      loadGuides();
    }
  }, [user]);

  // Apply visibility-aware defaults
  useEffect(() => {
    if (shouldUseDefault(TRAINING_STEP_KEYS.humanType, visibility)) {
      setSelectedDisgType(null);
    }
    if (shouldUseDefault(TRAINING_STEP_KEYS.meta, visibility)) {
      setMetaPrograms({
        detailLevel: null,
        decisionSpeed: null,
        focusType: null,
        communicationStyle: null,
      });
    }
    if (shouldUseDefault(TRAINING_STEP_KEYS.guidelines, visibility)) {
      setSelectedGuideMode('generated');
    }
    if (shouldUseDefault(TRAINING_STEP_KEYS.difficulty, visibility)) {
      setSelectedDifficulty('mittel');
    }
  }, [visibility]);

  // Check if selected guideline option is still available
  useEffect(() => {
    if (!selectedGuideMode) return;
    if (isVisibilityMode && isAdmin) return;

    const modeKeyMap: Record<string, string> = {
      'internal': GUIDELINE_MODE_KEYS.internal,
      'generated': GUIDELINE_MODE_KEYS.generated,
      'saved': GUIDELINE_MODE_KEYS.saved,
    };

    const visibilityKey = modeKeyMap[selectedGuideMode];
    if (visibilityKey) {
      const state = visibility[visibilityKey] || 'visible';
      if (state === 'hidden' || state === 'comingsoon') {
        // Reset to null (Standard)
        setSelectedGuideMode(null);
        setSelectedGuideId(null);
      }
    }
  }, [visibility, selectedGuideMode, isVisibilityMode, isAdmin]);

  // Check if META program dimensions are still available
  useEffect(() => {
    if (isVisibilityMode && isAdmin) return;

    setMetaPrograms(prev => {
      const updated = { ...prev };
      let changed = false;

      // Check each dimension
      const dimensions = [
        { key: META_CATEGORY_KEYS.detailLevel, field: 'detailLevel' as const },
        { key: META_CATEGORY_KEYS.decisionSpeed, field: 'decisionSpeed' as const },
        { key: META_CATEGORY_KEYS.focusType, field: 'focusType' as const },
        { key: META_CATEGORY_KEYS.communicationStyle, field: 'communicationStyle' as const },
      ];

      for (const dim of dimensions) {
        const state = visibility[dim.key] || 'visible';
        if (state === 'hidden' || state === 'comingsoon') {
          if (updated[dim.field] !== null) {
            updated[dim.field] = null; // Reset to null (Standard)
            changed = true;
          }
        }
      }

      return changed ? updated : prev;
    });
  }, [visibility, isVisibilityMode, isAdmin]);

  // Redirect if current step becomes hidden
  useEffect(() => {
    if (isVisibilityMode && isAdmin) return;

    const currentStepInfo = stepDisplayMap.get(step);
    if (currentStepInfo && (currentStepInfo.state === 'hidden' || currentStepInfo.state === 'comingsoon')) {
      const nextStep = getNextVisibleStep(step, visibility, 'forward');
      if (nextStep) {
        setStep(nextStep);
      } else {
        const prevStep = getNextVisibleStep(step, visibility, 'backward');
        if (prevStep) {
          setStep(prevStep);
        }
      }
    }
  }, [step, visibility, stepDisplayMap, isVisibilityMode, isAdmin]);

  async function loadGuides() {
    if (!user) return;
    const { data, error } = await supabase
      .from('training_guides')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAvailableGuides(data);
    }
  }

  function goToStep(target: 1 | 2 | 3 | 4 | 5 | 6) {
    if (!isVisibilityMode || !isAdmin) {
      const targetInfo = stepDisplayMap.get(target);
      if (targetInfo && (targetInfo.state === 'hidden' || targetInfo.state === 'comingsoon')) {
        return;
      }
    }
    setStep(target);
    setMaxVisitedStep(prev => (target > prev ? target : prev));
  }

  function handleStepBack() {
    if (step === 1) return;
    setHasUsedBack(true);
    const prevStep = getNextVisibleStep(step, visibility, 'backward');
    if (prevStep) setStep(prevStep);
  }

  function handleStepForward() {
    if (!hasUsedBack) return;
    if (step >= maxVisitedStep) return;
    setStep(prev => (prev + 1) as 1 | 2 | 3 | 4 | 5 | 6);
  }

  function handleStep1Next() {
    if (!selectedMode) return;
    const nextStep = getNextVisibleStep(1, visibility, 'forward');
    if (nextStep) goToStep(nextStep);
  }

  function handleStep2Next() {
    if (userPackage === 'starter' && !selectedDisgType) {
      const types: DisgType[] = ['yellow', 'blue', 'green', 'red'];
      setSelectedDisgType(types[Math.floor(Math.random() * types.length)]);
    }
    const nextStep = getNextVisibleStep(2, visibility, 'forward');
    if (nextStep) goToStep(nextStep);
  }

  function handleStep3Next() {
    const nextStep = getNextVisibleStep(3, visibility, 'forward');
    if (nextStep) goToStep(nextStep);
  }

  function handleStep4Next() {
    if (!selectedGuideMode || (selectedGuideMode === 'saved' && !selectedGuideId)) return;
    const nextStep = getNextVisibleStep(4, visibility, 'forward');
    if (nextStep) goToStep(nextStep);
  }

  function handleStep5Next() {
    const nextStep = getNextVisibleStep(5, visibility, 'forward');
    if (nextStep) goToStep(nextStep);
  }

  function randomizeStep2() {
    const types: DisgType[] = ['yellow', 'blue', 'green', 'red'];
    setSelectedDisgType(types[Math.floor(Math.random() * types.length)]);
  }

  function randomizeStep3() {
    if (!isProUser) return;
    setMetaPrograms({
      detailLevel: Math.random() > 0.5 ? 'detail' : 'overview',
      decisionSpeed: Math.random() > 0.5 ? 'fast' : 'slow',
      focusType: Math.random() > 0.5 ? 'facts' : 'relationship',
      communicationStyle: Math.random() > 0.5 ? 'direct' : 'indirect',
    });
  }

  function startTraining() {
    const config = {
      mode: selectedMode,
      disgType: selectedDisgType,
      metaPrograms: isProUser ? metaPrograms : null,
      guideMode: selectedGuideMode,
      guideId: selectedGuideId,
      difficulty: selectedDifficulty,
    };
    console.log('Starting training with config:', config);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <PlayCircle className="w-8 h-8 text-cyan-600" />
          <h1 className="text-3xl font-bold text-gray-900">Training Suite</h1>
        </div>

        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {visibleSteps.map((s, idx) => {
            const info = stepDisplayMap.get(s.stepNumber as 1 | 2 | 3 | 4 | 5 | 6)!;
            const isActive = step === s.stepNumber;
            const isCompleted = maxVisitedStep > s.stepNumber;
            const isClickable = (isCompleted || isActive) && info.isClickable;
            const isHidden = info.state === 'hidden';
            const isComingSoon = info.state === 'comingsoon';

            return (
              <div key={s.stepNumber} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1">
                  <div
                    onClick={() => isClickable && goToStep(s.stepNumber as 1 | 2 | 3 | 4 | 5 | 6)}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors flex-shrink-0 ${
                      isHidden && isVisibilityMode && isAdmin
                        ? 'bg-gray-300 text-gray-600 cursor-default line-through'
                        : isActive
                        ? 'bg-cyan-600 text-white'
                        : isCompleted && isClickable
                        ? 'border-2 border-cyan-600 text-cyan-600 bg-white cursor-pointer hover:bg-cyan-50'
                        : isComingSoon
                        ? 'border-2 border-orange-400 text-orange-600 bg-orange-50'
                        : 'border border-gray-300 text-gray-400 bg-white'
                    } ${!isClickable && !isHidden ? 'cursor-not-allowed opacity-60' : ''}`}
                    title={isHidden && isVisibilityMode && isAdmin ? 'Ausgeblendet – wird im Training übersprungen' : ''}
                  >
                    {info.displayNumber === 'i' ? 'i' : info.displayNumber}
                    {isVisibilityMode && isAdmin && s.canBeHidden && (
                      <div className="absolute -top-1 -right-1">
                        <VisibilityEyeIcon elementKey={s.key} size="xs" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-center">
                    <p className={`text-xs font-medium whitespace-nowrap ${
                      isActive ? 'text-cyan-600' :
                      isHidden ? 'text-gray-400' :
                      isComingSoon ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {s.label}
                    </p>
                    {isComingSoon && !isVisibilityMode && (
                      <Badge variant="warning" className="text-xs px-1 py-0 mt-0.5">Soon</Badge>
                    )}
                  </div>
                </div>
                {idx < visibleSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${
                    isCompleted ? 'bg-cyan-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Trainingsmodus wählen</h2>
            <p className="text-gray-600 mb-6">Wähle aus, welchen Bereich du heute trainieren möchtest.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {trainingModes.map(mode => (
                <TrainingModeCard
                  key={mode.id}
                  id={mode.id}
                  title={mode.title}
                  description={mode.description}
                  icon={mode.icon}
                  visibilityKey={mode.visibilityKey}
                  isSelected={selectedMode === mode.id}
                  isVisibilityMode={isVisibilityMode}
                  isAdmin={isAdmin}
                  visibility={visibility}
                  onSelect={() => setSelectedMode(mode.id as TrainingMode)}
                />
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={handleStep1Next}
                disabled={!selectedMode}
                className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                  selectedMode
                    ? 'bg-[#A855F7] hover:bg-[#9333EA] text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Menschentyp auswählen</h2>
              {isVisibilityMode && isAdmin && (
                <VisibilityEyeIcon elementKey={TRAINING_STEP_KEYS.humanType} />
              )}
            </div>
            {stepDisplayMap.get(2)?.state === 'comingsoon' && !isVisibilityMode && (
              <Badge variant="warning" className="mb-4">Coming Soon</Badge>
            )}
            <p className="text-gray-600 mb-2">Welcher Kundentyp soll im Training simuliert werden?</p>
            {isPremiumOrPro ? (
              <p className="text-sm text-gray-500 mb-6">Optional: Ohne Auswahl bleibt der Typ flexibel</p>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  Menschentypen sind im Starter-Paket nicht individualisierbar. Wir wählen automatisch einen passenden Typ für dich.
                </p>
              </div>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 ${!isPremiumOrPro ? 'opacity-50 pointer-events-none' : ''}`}>
              {disgTypes.map(type => (
                <PersonTypeCard
                  key={type.id}
                  id={type.id}
                  title={type.title}
                  description={type.description}
                  color={type.color}
                  visibilityKey={type.visibilityKey}
                  isSelected={selectedDisgType === type.id}
                  isVisibilityMode={isVisibilityMode}
                  isAdmin={isAdmin}
                  visibility={visibility}
                  onSelect={() => isPremiumOrPro && setSelectedDisgType(type.id as DisgType)}
                />
              ))}
            </div>

            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handleStepBack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              {isPremiumOrPro && (
                <button
                  onClick={randomizeStep2}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 bg-transparent hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  Zufällig
                </button>
              )}

              <button
                onClick={handleStep2Next}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#A855F7] hover:bg-[#9333EA] text-white transition-colors"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">META-Programme</h2>
            <p className="text-gray-600 mb-2">Feintuning der Kundenpsychologie</p>

            {!isProUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  {userPackage === 'starter'
                    ? 'META-Programme stehen im Starter-Paket nicht zur Verfügung. Es wird ein Standard-Profil verwendet.'
                    : 'META-Programme sind nur im Pro-Paket verfügbar. In deinem Paket wird ein Standard-Profil verwendet.'}
                </p>
              </div>
            )}

            <div className={`space-y-6 mb-8 ${!isProUser ? 'opacity-40 pointer-events-none' : ''}`}>
              <MetaCategoryRow
                title="Detail-Level"
                visibilityKey={META_CATEGORY_KEYS.detailLevel}
                selectedValue={metaPrograms.detailLevel}
                options={[
                  { value: 'detail', label: 'Detail-orientiert', descriptionKey: 'detail' },
                  { value: 'overview', label: 'Überblick', descriptionKey: 'overview' },
                ]}
                isProUser={isProUser}
                isVisibilityMode={isVisibilityMode}
                isAdmin={isAdmin}
                visibility={visibility}
                onChange={(value) => setMetaPrograms(prev => ({ ...prev, detailLevel: value }))}
              />

              <MetaCategoryRow
                title="Entscheidungsgeschwindigkeit"
                visibilityKey={META_CATEGORY_KEYS.decisionSpeed}
                selectedValue={metaPrograms.decisionSpeed}
                options={[
                  { value: 'fast', label: 'Schnell', descriptionKey: 'fast' },
                  { value: 'slow', label: 'Bedächtig', descriptionKey: 'slow' },
                ]}
                isProUser={isProUser}
                isVisibilityMode={isVisibilityMode}
                isAdmin={isAdmin}
                visibility={visibility}
                onChange={(value) => setMetaPrograms(prev => ({ ...prev, decisionSpeed: value }))}
              />

              <MetaCategoryRow
                title="Fokus-Typ"
                visibilityKey={META_CATEGORY_KEYS.focusType}
                selectedValue={metaPrograms.focusType}
                options={[
                  { value: 'facts', label: 'Fakten', descriptionKey: 'facts' },
                  { value: 'relationship', label: 'Beziehung', descriptionKey: 'relationship' },
                ]}
                isProUser={isProUser}
                isVisibilityMode={isVisibilityMode}
                isAdmin={isAdmin}
                visibility={visibility}
                onChange={(value) => setMetaPrograms(prev => ({ ...prev, focusType: value }))}
              />

              <MetaCategoryRow
                title="Kommunikationsstil"
                visibilityKey={META_CATEGORY_KEYS.communicationStyle}
                selectedValue={metaPrograms.communicationStyle}
                options={[
                  { value: 'direct', label: 'Direkt', descriptionKey: 'direct' },
                  { value: 'indirect', label: 'Indirekt', descriptionKey: 'indirect' },
                ]}
                isProUser={isProUser}
                isVisibilityMode={isVisibilityMode}
                isAdmin={isAdmin}
                visibility={visibility}
                onChange={(value) => setMetaPrograms(prev => ({ ...prev, communicationStyle: value }))}
              />
            </div>

            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handleStepBack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              {isProUser && (
                <button
                  onClick={randomizeStep3}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 bg-transparent hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  Zufällig
                </button>
              )}

              <button
                onClick={handleStep3Next}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#A855F7] hover:bg-[#9333EA] text-white transition-colors"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Vorgaben wählen</h2>
            <p className="text-gray-600 mb-6">Woher sollen die Gesprächsleitfäden kommen?</p>

            <div className="space-y-4 mb-8">
              {guideModes.map(mode => (
                <div key={mode.id} className="relative">
                  <GuidelineModeCard
                    id={mode.id}
                    title={mode.title}
                    description={mode.description}
                    icon={mode.icon}
                    packages={mode.packages}
                    visibilityKey={mode.visibilityKey}
                    isSelected={selectedGuideMode === mode.id}
                    userPackage={userPackage}
                    isVisibilityMode={isVisibilityMode}
                    isAdmin={isAdmin}
                    visibility={visibility}
                    onSelect={() => setSelectedGuideMode(mode.id as GuideMode)}
                  />
                  {mode.id === 'saved' && selectedGuideMode === mode.id && mode.packages.includes(userPackage) && (
                    <select
                      value={selectedGuideId || ''}
                      onChange={(e) => setSelectedGuideId(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A855F7] focus:border-[#A855F7]"
                    >
                      <option value="">Leitfaden auswählen...</option>
                      {availableGuides.map((guide) => (
                        <option key={guide.id} value={guide.id}>
                          {guide.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handleStepBack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              <button
                onClick={handleStep4Next}
                disabled={!selectedGuideMode || (selectedGuideMode === 'saved' && !selectedGuideId)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  selectedGuideMode && (selectedGuideMode !== 'saved' || selectedGuideId)
                    ? 'bg-[#A855F7] hover:bg-[#9333EA] text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Schwierigkeitsgrad wählen</h2>
              {isVisibilityMode && isAdmin && (
                <VisibilityEyeIcon elementKey={TRAINING_STEP_KEYS.difficulty} />
              )}
            </div>
            {stepDisplayMap.get(5)?.state === 'comingsoon' && !isVisibilityMode && (
              <Badge variant="warning" className="mb-4">Coming Soon</Badge>
            )}
            <p className="text-gray-600 mb-6">Wie anspruchsvoll soll dein heutiges Training sein?</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {difficultyLevels.map(level => (
                <div
                  key={level.id}
                  onClick={() => setSelectedDifficulty(level.id as DifficultyLevel)}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all text-center ${
                    selectedDifficulty === level.id
                      ? 'border-[#A855F7] bg-[#F5F3FF] border-2 shadow-md'
                      : 'border-gray-200 hover:border-[#A855F7] hover:shadow-sm'
                  }`}
                >
                  <div className="text-4xl mb-3">{level.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{level.title}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                  <div className="mt-2">
                    <InfoTooltip content={`${level.title}: ${level.description}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handleStepBack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              <button
                onClick={handleStep5Next}
                disabled={!selectedDifficulty}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  selectedDifficulty
                    ? 'bg-[#A855F7] hover:bg-[#9333EA] text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 6 && (() => {
          const step2Info = stepDisplayMap.get(2);
          const step3Info = stepDisplayMap.get(3);
          const step4Info = stepDisplayMap.get(4);
          const step5Info = stepDisplayMap.get(5);

          const displayDisgType = shouldUseDefault(TRAINING_STEP_KEYS.humanType, visibility) || !selectedDisgType ? 'standard' : selectedDisgType;
          const displayMeta = shouldUseDefault(TRAINING_STEP_KEYS.meta, visibility) ? null : metaPrograms;

          // Check if selected guide mode is still available
          let displayGuideMode = selectedGuideMode;
          if (selectedGuideMode) {
            const modeKeyMap: Record<string, string> = {
              'internal': GUIDELINE_MODE_KEYS.internal,
              'generated': GUIDELINE_MODE_KEYS.generated,
              'saved': GUIDELINE_MODE_KEYS.saved,
            };
            const visibilityKey = modeKeyMap[selectedGuideMode];
            if (visibilityKey) {
              const state = visibility[visibilityKey] || 'visible';
              if (state === 'hidden' || state === 'comingsoon') {
                displayGuideMode = null; // Use Standard
              }
            }
          }

          const displayDifficulty = shouldUseDefault(TRAINING_STEP_KEYS.difficulty, visibility) ? 'mittel' : selectedDifficulty;

          const showHumanType = step2Info?.state !== 'hidden';
          const showMeta = step3Info?.state !== 'hidden';
          const showGuidelines = step4Info?.state !== 'hidden';
          const showDifficulty = step5Info?.state !== 'hidden';

          return (
            <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Zusammenfassung & Start</h2>
              <p className="text-gray-600 mb-6">Deine Trainingskonfiguration ist bereit!</p>

              {showHumanType && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayDisgType === 'standard' ? 'default' : displayDisgType}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                      alt="Kunden-Avatar"
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                    />
                    {displayDisgType !== 'standard' && (
                      <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border-4 border-white ${disgTypes.find(t => t.id === displayDisgType)?.color}`}></div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Ausgewählte Parameter:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-600">Modus:</div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {trainingModes.find(m => m.id === selectedMode)?.title || '-'}
                      {selectedMode && MODE_DESCRIPTIONS[selectedMode] && (
                        <InfoTooltip content={MODE_DESCRIPTIONS[selectedMode]} />
                      )}
                    </div>
                  </div>

                  {showHumanType && (
                    <div className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600">Menschentyp:</div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {displayDisgType === 'standard' ? 'Standard' : disgTypes.find(t => t.id === displayDisgType)?.title}
                        {displayDisgType !== 'standard' && COLOR_TYPE_DESCRIPTIONS[displayDisgType as keyof typeof COLOR_TYPE_DESCRIPTIONS] && (
                          <InfoTooltip content={COLOR_TYPE_DESCRIPTIONS[displayDisgType as keyof typeof COLOR_TYPE_DESCRIPTIONS]} />
                        )}
                        {step2Info?.state === 'comingsoon' && (
                          <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {showMeta && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-32 text-sm text-gray-600 font-semibold">META-Programme:</div>
                      </div>

                      <div className="pl-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-40 text-sm text-gray-600">Detail-Level:</div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {(() => {
                              const state = visibility[META_CATEGORY_KEYS.detailLevel] || 'visible';
                              if (!isProUser || state === 'hidden' || state === 'comingsoon' || !displayMeta?.detailLevel) {
                                return (
                                  <>
                                    Standard
                                    <InfoTooltip content="Standard Detail-Level wird verwendet" />
                                  </>
                                );
                              }
                              const label = displayMeta.detailLevel === 'detail' ? 'Detail-orientiert' : 'Überblick';
                              const descKey = displayMeta.detailLevel === 'detail' ? 'detail' : 'overview';
                              return (
                                <>
                                  {label}
                                  {META_PROGRAM_DESCRIPTIONS[descKey] && (
                                    <InfoTooltip content={META_PROGRAM_DESCRIPTIONS[descKey]} />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-40 text-sm text-gray-600">Entscheidungsgeschw.:</div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {(() => {
                              const state = visibility[META_CATEGORY_KEYS.decisionSpeed] || 'visible';
                              if (!isProUser || state === 'hidden' || state === 'comingsoon' || !displayMeta?.decisionSpeed) {
                                return (
                                  <>
                                    Standard
                                    <InfoTooltip content="Standard Entscheidungsgeschwindigkeit wird verwendet" />
                                  </>
                                );
                              }
                              const label = displayMeta.decisionSpeed === 'fast' ? 'Schnell' : 'Bedächtig';
                              const descKey = displayMeta.decisionSpeed === 'fast' ? 'fast' : 'slow';
                              return (
                                <>
                                  {label}
                                  {META_PROGRAM_DESCRIPTIONS[descKey] && (
                                    <InfoTooltip content={META_PROGRAM_DESCRIPTIONS[descKey]} />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-40 text-sm text-gray-600">Fokus-Typ:</div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {(() => {
                              const state = visibility[META_CATEGORY_KEYS.focusType] || 'visible';
                              if (!isProUser || state === 'hidden' || state === 'comingsoon' || !displayMeta?.focusType) {
                                return (
                                  <>
                                    Standard
                                    <InfoTooltip content="Standard Fokus-Typ wird verwendet" />
                                  </>
                                );
                              }
                              const label = displayMeta.focusType === 'facts' ? 'Fakten' : 'Beziehung';
                              const descKey = displayMeta.focusType === 'facts' ? 'facts' : 'relationship';
                              return (
                                <>
                                  {label}
                                  {META_PROGRAM_DESCRIPTIONS[descKey] && (
                                    <InfoTooltip content={META_PROGRAM_DESCRIPTIONS[descKey]} />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-40 text-sm text-gray-600">Kommunikationsstil:</div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {(() => {
                              const state = visibility[META_CATEGORY_KEYS.communicationStyle] || 'visible';
                              if (!isProUser || state === 'hidden' || state === 'comingsoon' || !displayMeta?.communicationStyle) {
                                return (
                                  <>
                                    Standard
                                    <InfoTooltip content="Standard Kommunikationsstil wird verwendet" />
                                  </>
                                );
                              }
                              const label = displayMeta.communicationStyle === 'direct' ? 'Direkt' : 'Indirekt';
                              const descKey = displayMeta.communicationStyle === 'direct' ? 'direct' : 'indirect';
                              return (
                                <>
                                  {label}
                                  {META_PROGRAM_DESCRIPTIONS[descKey] && (
                                    <InfoTooltip content={META_PROGRAM_DESCRIPTIONS[descKey]} />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {showGuidelines && (
                    <div className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600">Vorgaben:</div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {!displayGuideMode && (
                          <>
                            Standard
                            <InfoTooltip content="Standard-Verkaufsmethodik vom System" />
                          </>
                        )}
                        {displayGuideMode === 'internal' && (
                          <>
                            Interne Leitfäden
                            {GUIDE_MODE_DESCRIPTIONS.internal && (
                              <InfoTooltip content={GUIDE_MODE_DESCRIPTIONS.internal} />
                            )}
                          </>
                        )}
                        {displayGuideMode === 'generated' && (
                          <>
                            KI-gestützt
                            {GUIDE_MODE_DESCRIPTIONS.generated && (
                              <InfoTooltip content={GUIDE_MODE_DESCRIPTIONS.generated} />
                            )}
                          </>
                        )}
                        {displayGuideMode === 'saved' && (
                          <>
                            {availableGuides.find(g => g.id === selectedGuideId)?.title || 'Gespeichert'}
                            {GUIDE_MODE_DESCRIPTIONS.saved && (
                              <InfoTooltip content={GUIDE_MODE_DESCRIPTIONS.saved} />
                            )}
                          </>
                        )}
                        {step4Info?.state === 'comingsoon' && (
                          <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {showDifficulty && (
                    <div className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600">Schwierigkeit:</div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {difficultyLevels.find(l => l.id === displayDifficulty)?.title || '-'}
                        {displayDifficulty !== 'mittel' && (
                          <InfoTooltip content={`Schwierigkeitsgrad: ${difficultyLevels.find(l => l.id === displayDifficulty)?.description}`} />
                        )}
                        {step5Info?.state === 'comingsoon' && (
                          <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={handleStepBack}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Zurück
                </button>

                <button
                  onClick={startTraining}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-[#A855F7] hover:bg-[#9333EA] text-white transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  Training starten
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
