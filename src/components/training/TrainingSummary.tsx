import { PlayCircle, ArrowLeft, Info } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { InfoTooltip } from '../ui/InfoTooltip';
import { TRAINING_STEP_KEYS, shouldUseDefault } from '../../lib/trainingVisibilityUtils';
import { useUIVisibility } from '../../contexts/UIVisibilityContext';
import { getVisibilityState } from '../../lib/visibilityUtils';
import { MODE_DESCRIPTIONS, COLOR_TYPE_DESCRIPTIONS, META_PROGRAM_DESCRIPTIONS, GUIDE_MODE_DESCRIPTIONS } from '../../constants/trainingDescriptions';

interface TrainingSummaryProps {
  selectedMode: string | null;
  displayDisgType: string;
  displayMetaPrograms: any;
  displayGuideMode: string;
  displayDifficulty: string;
  isProUser: boolean;
  isStandard: {
    disgType: boolean;
    meta: boolean;
    guideMode: boolean;
    difficulty: boolean;
  };
  trainingModes: Array<{ id: string; title: string }>;
  disgTypes: Array<{ id: string; title: string; color: string }>;
  difficultyLevels: Array<{ id: string; title: string }>;
  onBack: () => void;
  onStart: () => void;
}

export function TrainingSummary({
  selectedMode,
  displayDisgType,
  displayMetaPrograms,
  displayGuideMode,
  displayDifficulty,
  isProUser,
  isStandard,
  trainingModes,
  disgTypes,
  difficultyLevels,
  onBack,
  onStart,
}: TrainingSummaryProps) {
  const { visibility } = useUIVisibility();

  const stepStates = {
    humanType: getVisibilityState(TRAINING_STEP_KEYS.humanType, visibility),
    meta: getVisibilityState(TRAINING_STEP_KEYS.meta, visibility),
    guidelines: getVisibilityState(TRAINING_STEP_KEYS.guidelines, visibility),
    difficulty: getVisibilityState(TRAINING_STEP_KEYS.difficulty, visibility),
  };

  const showSection = {
    humanType: stepStates.humanType !== 'hidden',
    meta: stepStates.meta !== 'hidden',
    guidelines: stepStates.guidelines !== 'hidden',
    difficulty: stepStates.difficulty !== 'hidden',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Schritt 6: Zusammenfassung & Start</h2>
      <p className="text-gray-600 mb-6">Deine Trainingskonfiguration ist bereit!</p>

      {/* Avatar Image */}
      {showSection.humanType && (
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayDisgType === 'standard' ? 'default' : displayDisgType}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
              alt="Kunden-Avatar"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
            {displayDisgType !== 'standard' && (
              <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border-4 border-white ${
                disgTypes.find(t => t.id === displayDisgType)?.color
              }`}></div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Ausgewählte Parameter:</h3>
        <div className="space-y-3">
          {/* Mode - always visible */}
          <div className="flex items-center gap-3">
            <div className="w-32 text-sm text-gray-600">Modus:</div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {trainingModes.find(m => m.id === selectedMode)?.title || '-'}
              {selectedMode && MODE_DESCRIPTIONS[selectedMode as keyof typeof MODE_DESCRIPTIONS] && (
                <InfoTooltip content={MODE_DESCRIPTIONS[selectedMode as keyof typeof MODE_DESCRIPTIONS]} />
              )}
            </div>
          </div>

          {/* Human Type */}
          {showSection.humanType && (
            <div className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">Menschentyp:</div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {displayDisgType === 'standard' ? (
                  'Standard'
                ) : (
                  <>
                    {disgTypes.find(t => t.id === displayDisgType)?.title || 'Standard'}
                    {!isStandard.disgType && COLOR_TYPE_DESCRIPTIONS[displayDisgType as keyof typeof COLOR_TYPE_DESCRIPTIONS] && (
                      <InfoTooltip content={COLOR_TYPE_DESCRIPTIONS[displayDisgType as keyof typeof COLOR_TYPE_DESCRIPTIONS]} />
                    )}
                  </>
                )}
                {stepStates.humanType === 'comingsoon' && (
                  <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                )}
              </div>
            </div>
          )}

          {/* META Programs */}
          {showSection.meta && (
            <div className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">META-Programme:</div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {isProUser ? (
                  displayMetaPrograms.detailLevel ? (
                    <>
                      Konfiguriert
                      <InfoTooltip content="Individuelle META-Programme wurden ausgewählt" />
                    </>
                  ) : (
                    'Standardprofil'
                  )
                ) : (
                  'Standardprofil'
                )}
                {stepStates.meta === 'comingsoon' && (
                  <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                )}
              </div>
            </div>
          )}

          {/* Guidelines */}
          {showSection.guidelines && (
            <div className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">Vorgaben:</div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {displayGuideMode === 'internal' && (
                  <>
                    Interne Leitfäden
                    {GUIDE_MODE_DESCRIPTIONS.internal && (
                      <InfoTooltip content={GUIDE_MODE_DESCRIPTIONS.internal} />
                    )}
                  </>
                )}
                {displayGuideMode === 'generated' && 'KI-gestützt'}
                {displayGuideMode === 'saved' && 'Gespeicherter Leitfaden'}
                {stepStates.guidelines === 'comingsoon' && (
                  <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                )}
              </div>
            </div>
          )}

          {/* Difficulty */}
          {showSection.difficulty && (
            <div className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">Schwierigkeit:</div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {difficultyLevels.find(l => l.id === displayDifficulty)?.title || '-'}
                {!isStandard.difficulty && (
                  <InfoTooltip content={`Schwierigkeitsgrad: ${difficultyLevels.find(l => l.id === displayDifficulty)?.description}`} />
                )}
                {stepStates.difficulty === 'comingsoon' && (
                  <Badge variant="warning" className="ml-2">Coming Soon</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-[#A855F7] hover:bg-[#9333EA] text-white transition-colors"
        >
          <PlayCircle className="w-5 h-5" />
          Training starten
        </button>
      </div>
    </div>
  );
}
