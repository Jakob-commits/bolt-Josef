import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

export function Login({ onSwitchToRegister, onSwitchToReset }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Willkommen zurück</h1>
          <p className="text-gray-600">Melde dich bei Sales Sensei an</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              label="E-Mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
            />

            <Input
              label="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={onSwitchToReset}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium block mx-auto"
            >
              Passwort vergessen?
            </button>
            <div className="text-center text-sm text-gray-600">
              Noch kein Konto?{' '}
              <button onClick={onSwitchToRegister} className="text-cyan-600 hover:text-cyan-700 font-medium">
                Jetzt registrieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
