import { useState, useEffect } from 'react';
import { FileText, Upload, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

type GuidelineType = 'objection' | 'sales-conversation' | 'cold-call' | 'follow-up' | 'phone-script' | 'presentation' | 'employee-conversation' | 'employee-motivation';

interface AnalysisResult {
  strengths: string[];
  improvements: string[];
  optimized_version: string[];
  detected_issues: string[];
}

export function GuidelineAnalysis() {
  const { user, profile } = useAuth();
  const { setCurrentPage } = useUI();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<GuidelineType | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userPackage = profile?.package || 'starter';
  const userRole = profile?.role || 'user';
  const isProUser = userPackage === 'pro';
  const isLeadershipRole = ['teamleiter', 'admin', 'master'].includes(userRole);

  useEffect(() => {
    setCurrentPage('training');
    return () => setCurrentPage(null);
  }, [setCurrentPage]);

  const guidelineTypes = [
    { id: 'objection', title: 'Einwandbehandlung', description: 'Umgang mit Kundeneinwänden', requiresLeadership: false },
    { id: 'sales-conversation', title: 'Verkaufsgespräch', description: 'Vollständiger Verkaufsprozess', requiresLeadership: false },
    { id: 'cold-call', title: 'Cold Call', description: 'Erstkontakt und Kaltakquise', requiresLeadership: false },
    { id: 'follow-up', title: 'Follow-Up', description: 'Nachfassen und Nachverfolgung', requiresLeadership: false },
    { id: 'phone-script', title: 'Telefonleitfaden', description: 'Strukturierte Telefonskripte', requiresLeadership: false },
    { id: 'presentation', title: 'Präsentation', description: 'Produktpräsentation', requiresLeadership: false },
    { id: 'employee-conversation', title: 'Mitarbeitergespräch', description: 'Führungsgespräche', requiresLeadership: true },
    { id: 'employee-motivation', title: 'Mitarbeitermotivation', description: 'Motivation und Coaching', requiresLeadership: true },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Bitte nur PDF, TXT oder DOCX Dateien hochladen');
      }
    }
  };

  const startAnalysis = async () => {
    if (!uploadedFile || !selectedType) return;

    setAnalyzing(true);
    setError(null);

    // Simulate API call - replace with actual endpoint later
    setTimeout(() => {
      setResult({
        strengths: [
          'Klare Struktur und logischer Aufbau',
          'Gute Gesprächseröffnung mit Rapport-Aufbau',
          'Starker Abschluss mit klarer Handlungsaufforderung',
          'Professionelle Sprache durchgehend'
        ],
        improvements: [
          'Zu wenig Bedarfsanalyse und Qualifizierungsfragen',
          'Einwände werden nicht ausreichend antizipiert',
          'Kundenemotionen werden kaum berücksichtigt',
          'Fehlende Nutzenargumentation bei Features'
        ],
        optimized_version: [
          '1. Warmstart & Rapport aufbauen (30 Sek.)',
          '2. Situationsanalyse mit offenen Fragen (2 Min.)',
          '3. Qualifizierung & Bedarfsermittlung (3 Min.)',
          '4. Bedarf vertiefen mit emotionalen Triggern (2 Min.)',
          '5. Nutzenargumentation statt Feature-Liste (3 Min.)',
          '6. Einwandvorwegnahme proaktiv ansprechen (1 Min.)',
          '7. Testabschluss & Commitment einholen (1 Min.)',
          '8. Klare nächste Schritte vereinbaren'
        ],
        detected_issues: [
          'Zu produkt-fokussiert statt kunden-fokussiert',
          'Keine emotionale Ebene im Gespräch',
          'Zu schnell zum Abschluss, ohne echte Überzeugung'
        ]
      });
      setAnalyzing(false);
      setStep(4);
    }, 3000);
  };

  const resetAnalysis = () => {
    setStep(1);
    setSelectedType(null);
    setUploadedFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-cyan-600" />
          <h1 className="text-3xl font-bold text-gray-900">Leitfadenanalyse & Optimierung</h1>
        </div>

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Schritt 1: Typ auswählen</h2>
            <p className="text-gray-600 mb-6">Welche Art von Leitfaden möchtest du analysieren lassen?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {guidelineTypes.map(type => {
                const isAvailable = !type.requiresLeadership || isLeadershipRole;
                return (
                  <div
                    key={type.id}
                    onClick={() => isAvailable && setSelectedType(type.id as GuidelineType)}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      !isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      selectedType === type.id
                        ? 'border-[#A855F7] bg-[#F5F3FF] border-2'
                        : 'border-gray-200 hover:border-[#A855F7]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold mb-1 ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                          {type.title}
                        </h3>
                        <p className={`text-sm ${isAvailable ? 'text-gray-600' : 'text-gray-500'}`}>
                          {type.description}
                        </p>
                      </div>
                      {!isAvailable && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full whitespace-nowrap">
                          Nur Führung
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-colors ${
                  selectedType
                    ? 'bg-[#A855F7] hover:bg-[#9333EA] text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 2: File Upload */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Schritt 2: Leitfaden hochladen</h2>
            <p className="text-gray-600 mb-6">Lade deinen bestehenden Leitfaden hoch (PDF, TXT oder DOCX)</p>

            {!isProUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  Upload verfügbar im Pro-Paket. Du kannst trotzdem eine Beispielanalyse durchführen.
                </p>
              </div>
            )}

            <div className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 ${
              isProUser ? 'border-gray-300 hover:border-cyan-400 cursor-pointer' : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            }`}>
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isProUser ? 'text-cyan-600' : 'text-gray-400'}`} />
              <label className={`block ${isProUser ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileUpload}
                  disabled={!isProUser}
                  className="hidden"
                />
                <span className={`text-lg font-medium ${isProUser ? 'text-gray-900' : 'text-gray-500'}`}>
                  {uploadedFile ? uploadedFile.name : 'Datei auswählen oder hierher ziehen'}
                </span>
                <p className="text-sm text-gray-500 mt-2">PDF, TXT oder DOCX (max. 10 MB)</p>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              <button
                onClick={() => setStep(3)}
                disabled={!uploadedFile && isProUser}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-colors ${
                  uploadedFile || !isProUser
                    ? 'bg-[#A855F7] hover:bg-[#9333EA] text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Start Analysis */}
        {step === 3 && !analyzing && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Schritt 3: Analyse starten</h2>
            <p className="text-gray-600 mb-6">Deine Auswahl wird jetzt von unserer KI analysiert</p>

            <div className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Zusammenfassung:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-600">Typ:</div>
                  <div className="font-medium text-gray-900">
                    {guidelineTypes.find(t => t.id === selectedType)?.title}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-600">Datei:</div>
                  <div className="font-medium text-gray-900">
                    {uploadedFile?.name || 'Beispielanalyse'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              <button
                onClick={startAnalysis}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-[#A855F7] hover:bg-[#9333EA] text-white transition-colors"
              >
                Analyse starten
              </button>
            </div>
          </div>
        )}

        {/* Step 3.5: Analyzing */}
        {analyzing && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-[#A855F7] animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyse läuft...</h3>
              <p className="text-gray-600">Dein Leitfaden wird analysiert... Kann ein paar Sekunden dauern.</p>

              <div className="mt-8 max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#A855F7] h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analyse abgeschlossen</h2>
                  <p className="text-gray-600">Hier sind die Ergebnisse deiner Leitfadenanalyse</p>
                </div>
              </div>

              {/* Strengths */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Stärken
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Verbesserungspotenzial
                </h3>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <span className="text-amber-500 mt-1">→</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detected Issues */}
              {result.detected_issues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Kritische Punkte
                  </h3>
                  <ul className="space-y-2">
                    {result.detected_issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-red-500 mt-1">⚠</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimized Version */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#A855F7] rounded-full"></div>
                  Optimierter Leitfaden
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-lg p-4">
                  <ol className="space-y-2">
                    {result.optimized_version.map((step, idx) => (
                      <li key={idx} className="text-gray-800 font-medium">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={resetAnalysis}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-[#A855F7] hover:bg-[#9333EA] text-white transition-colors"
              >
                Neue Analyse starten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
