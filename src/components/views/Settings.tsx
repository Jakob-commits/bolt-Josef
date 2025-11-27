import { useState, useEffect } from 'react';
import { Volume2, Moon, Sun } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type Theme = 'light' | 'dark';

export function Settings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');
  const [voice, setVoice] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [user]);

  async function loadSettings() {
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('theme, voice')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setTheme(data.theme || 'light');
      setVoice(data.voice || 'default');
    }
  }

  async function saveSettings() {
    if (!user) return;

    setLoading(true);
    setSaveMessage('');

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        theme,
        voice,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    setLoading(false);

    if (error) {
      setSaveMessage('Fehler beim Speichern der Einstellungen');
      console.error('Error saving settings:', error);
    } else {
      setSaveMessage('Einstellungen gespeichert');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Einstellungen</h1>
          <p className="text-gray-600">Passe deine Erfahrung an deine Bedürfnisse an</p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Stimme des Gesprächspartners</h2>
                <p className="text-sm text-gray-600">Wähle die Stimme für deine Trainings-Gespräche</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-cyan-500 bg-cyan-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="voice"
                  value="default"
                  checked={voice === 'default'}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Standard Stimme</p>
                  <p className="text-sm text-gray-600">Professionell und klar</p>
                </div>
              </label>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Aktuell ist nur eine Stimme verfügbar. Weitere Stimmen folgen bald.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                {theme === 'light' ? (
                  <Sun className="w-5 h-5 text-purple-600" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Darstellung</h2>
                <p className="text-sm text-gray-600">Wähle zwischen hellem und dunklem Modus</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Sun className={`w-8 h-8 mx-auto mb-2 ${theme === 'light' ? 'text-cyan-600' : 'text-gray-400'}`} />
                <p className={`font-medium ${theme === 'light' ? 'text-cyan-900' : 'text-gray-700'}`}>Hell</p>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Moon className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-cyan-600' : 'text-gray-400'}`} />
                <p className={`font-medium ${theme === 'dark' ? 'text-cyan-900' : 'text-gray-700'}`}>Dunkel</p>
              </button>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Der dunkle Modus wird in Kürze implementiert. Deine Auswahl wird gespeichert.
              </p>
            </div>
          </Card>

          <div className="flex items-center justify-between pt-4">
            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes('Fehler') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </p>
            )}
            <button
              onClick={saveSettings}
              disabled={loading}
              className="ml-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
