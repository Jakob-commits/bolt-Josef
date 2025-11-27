import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, ApiKey, isAdminOrHigher } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  generateApiKeySecret,
  hashApiKey,
  formatApiKey,
  AVAILABLE_SCOPES,
  formatScopesDisplay,
  formatLastUsed,
} from '../../lib/apiKeyUtils';

export function ApiKeys() {
  const { profile, loading: authLoading } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['training:read', 'training:write']);
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasAccess = isAdminOrHigher(profile);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    if (profile && hasAccess) {
      loadApiKeys();
    } else if (profile && !hasAccess) {
      setLoading(false);
    }
  }, [profile, hasAccess]);

  async function loadApiKeys() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      showMessage('Fehler beim Laden der API-Schlüssel', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function createApiKey() {
    if (!newKeyName.trim()) {
      showMessage('Bitte gib einen Namen ein', 'error');
      return;
    }

    if (selectedScopes.length === 0) {
      showMessage('Bitte wähle mindestens einen Scope aus', 'error');
      return;
    }

    try {
      const secret = generateApiKeySecret();
      const tokenHash = await hashApiKey(secret);
      const formattedSecret = formatApiKey(secret);

      const { error } = await supabase.from('api_keys').insert({
        user_id: profile!.user_id,
        tenant_id: profile!.tenant_id,
        name: newKeyName,
        token_hash: tokenHash,
        scopes: selectedScopes,
        is_active: true,
      });

      if (error) throw error;

      setGeneratedSecret(formattedSecret);
      setShowCreateModal(false);
      setShowSecretModal(true);
      setNewKeyName('');
      setSelectedScopes(['training:read', 'training:write']);
      loadApiKeys();
      showMessage('API-Schlüssel erfolgreich erstellt', 'success');
    } catch (error) {
      console.error('Error creating API key:', error);
      showMessage('Fehler beim Erstellen des API-Schlüssels', 'error');
    }
  }

  async function deleteApiKey(id: string) {
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);

      if (error) throw error;

      loadApiKeys();
      showMessage('API-Schlüssel gelöscht', 'success');
    } catch (error) {
      console.error('Error deleting API key:', error);
      showMessage('Fehler beim Löschen des API-Schlüssels', 'error');
    }
  }

  function showMessage(msg: string, type: 'success' | 'error') {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }

  function toggleScope(scope: string) {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  }

  async function copyToClipboard(text: string, id?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
      showMessage('In Zwischenablage kopiert', 'success');
    } catch (error) {
      showMessage('Fehler beim Kopieren', 'error');
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner message="API-Schlüssel werden geladen..." />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Keine Berechtigung</h2>
              <p className="text-gray-600">
                Du hast keine Berechtigung, API-Schlüssel zu verwalten.
                <br />
                Nur Master und Admin haben Zugriff auf diese Funktion.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-8 h-8 text-cyan-600" />
            <h1 className="text-3xl font-bold text-gray-900">API-Schlüssel</h1>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message}
          </div>
        )}

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Deine API-Schlüssel</h2>
            <p className="text-sm text-gray-600 mt-1">
              Verwalte API-Schlüssel für die Integration mit n8n, make.com und anderen Tools
            </p>
          </div>

          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Noch keine API-Schlüssel</h3>
              <p className="text-gray-600 mb-4">
                Erstelle deinen ersten API-Schlüssel, um mit externen Tools zu integrieren
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neuer API-Schlüssel
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berechtigungen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erstellt am
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zuletzt verwendet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map(key => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{key.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatScopesDisplay(key.scopes)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(key.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatLastUsed(key.last_used_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            key.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {key.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => deleteApiKey(key.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Verwendung in n8n / make.com
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Endpoint:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {supabaseUrl}/functions/v1/sensei-webhook
                </code>
              </p>
              <p>
                <strong>Header:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  x-api-key: DEIN_API_KEY
                </code>
              </p>
              <p>
                <strong>Method:</strong> POST
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Der API-Schlüssel wird nur einmal bei der Erstellung angezeigt. Bitte bewahre ihn sicher auf.
              </p>
            </div>
          </div>
        </Card>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Neuen API-Schlüssel erstellen
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Pflicht)
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="z.B. n8n – Trainingssync"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Berechtigungen
                  </label>
                  <div className="space-y-2">
                    {AVAILABLE_SCOPES.map(scope => (
                      <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="text-sm text-gray-700">{scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName('');
                    setSelectedScopes(['training:read', 'training:write']);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={createApiKey}
                  className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        )}

        {showSecretModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">API-Schlüssel erstellt!</h3>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Wichtig: Dieser Schlüssel wird nur einmal angezeigt!
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Bitte kopiere ihn jetzt und bewahre ihn sicher auf.
                </p>
              </div>

              <div className="relative">
                <code className="block bg-gray-900 text-green-400 p-4 rounded-lg text-sm break-all font-mono">
                  {generatedSecret}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedSecret, 'secret')}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                  title="Kopieren"
                >
                  {copiedId === 'secret' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSecretModal(false);
                  setGeneratedSecret('');
                }}
                className="w-full mt-6 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                Verstanden, Schlüssel wurde kopiert
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
