import { useState, useEffect } from 'react';
import { FileText, Folder, Upload, ArrowLeft, Plus, Trash2, Building, User as UserIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type TabType = 'company' | 'personal';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  owner_type: 'company' | 'user';
  owner_id: string;
  parent_id: string | null;
}

export function Files() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, [activeTab, currentFolder]);

  async function loadFolders() {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('owner_type', activeTab === 'company' ? 'company' : 'user')
      .eq('parent_id', currentFolder || 'null');

    if (data) {
      const folderItems: FileItem[] = data.map(f => ({
        id: f.id,
        name: f.name,
        type: 'folder' as const,
        created_at: f.created_at,
      }));
      setFiles(folderItems);
    }

    setLoading(false);
  }

  async function handleCreateFolder() {
    if (!user || !newFolderName.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('folders')
      .insert({
        name: newFolderName.trim(),
        owner_type: activeTab === 'company' ? 'company' : 'user',
        owner_id: user.id,
        parent_id: currentFolder,
      });

    if (!error) {
      setNewFolderName('');
      setShowNewFolderModal(false);
      loadFolders();
    } else {
      console.error('Error creating folder:', error);
    }

    setLoading(false);
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm('Ordner wirklich löschen?')) return;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (!error) {
      loadFolders();
    }
  }

  function handleFileUpload() {
    alert('Datei-Upload wird in Kürze implementiert. Integration mit Supabase Storage folgt.');
  }

  function openFolder(folderId: string) {
    setCurrentFolder(folderId);
  }

  function goBack() {
    setCurrentFolder(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dateien</h1>
          <p className="text-gray-600">Verwalte Leitfäden und Dokumente für deine Trainings</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('company')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'company'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Building className="w-4 h-4" />
              Firmendokumente
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'personal'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Eigene Dokumente
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neuer Ordner
            </button>
            <button
              onClick={handleFileUpload}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Datei hochladen
            </button>
          </div>
        </div>

        <Card className="p-6">
          {currentFolder && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </button>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Lädt...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Noch keine Ordner vorhanden</p>
              <p className="text-sm text-gray-500">Erstelle einen neuen Ordner oder lade eine Datei hoch</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all cursor-pointer relative"
                  onClick={() => item.type === 'folder' && openFolder(item.id)}
                >
                  <div className="flex items-start gap-3">
                    {item.type === 'folder' ? (
                      <Folder className="w-8 h-8 text-cyan-600 flex-shrink-0" />
                    ) : (
                      <FileText className="w-8 h-8 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleDateString('de-DE')}
                      </p>
                      {item.size && <p className="text-xs text-gray-500">{item.size}</p>}
                    </div>
                  </div>
                  {item.type === 'folder' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(item.id);
                      }}
                      className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Die Datei-Upload-Funktionalität wird derzeit entwickelt.
            Die Integration mit Supabase Storage für sichere Dateiverwaltung folgt in Kürze.
          </p>
        </div>

        {showNewFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Neuen Ordner erstellen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordnername</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="z.B. Leitfäden, Skripte..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowNewFolderModal(false);
                      setNewFolderName('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={loading || !newFolderName.trim()}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Erstelle...' : 'Erstellen'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
