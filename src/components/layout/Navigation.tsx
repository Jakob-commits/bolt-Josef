import { useState, useRef, useEffect } from 'react';
import { User, Settings, FileText, LogOut, Users, Trophy, Swords, BarChart3, SlidersHorizontal, Key, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useUIVisibility } from '../../contexts/UIVisibilityContext';
import { Logo } from '../ui/Logo';
import { VisibilityModeToggle } from '../ui/VisibilityModeToggle';
import { VisibilityEyeIcon } from '../ui/VisibilityEyeIcon';
import { Badge } from '../ui/Badge';
import { isAdminOrHigher } from '../../lib/supabase';
import { NAVIGATION_KEYS, getNavigationItemVisibility } from '../../lib/navigationVisibilityUtils';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleEdit?: () => void;
  isEditing?: boolean;
}

export function Navigation({ currentView, onNavigate }: NavigationProps) {
  const { profile, signOut } = useAuth();
  const { isEditing, setIsEditing, currentPage, isVisibilityMode, setIsVisibilityMode } = useUI();
  const { visibility } = useUIVisibility();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = isAdminOrHigher(profile);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleToggleVisibilityMode = (active: boolean) => {
    setIsVisibilityMode(active);
    if (active) {
      setIsEditing(false);
    }
  };

  const showEditButton = currentPage === 'dashboard';
  const showVisibilityToggle = isAdmin && (currentView === 'dashboard' || currentView === 'training');

  const hallOfFameVisibility = getNavigationItemVisibility(
    NAVIGATION_KEYS.hallOfFame,
    visibility,
    isVisibilityMode && isAdmin
  );

  const challengesVisibility = getNavigationItemVisibility(
    NAVIGATION_KEYS.challenges,
    visibility,
    isVisibilityMode && isAdmin
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  const handleMenuItemClick = (view: string) => {
    setShowProfileMenu(false);
    if (view === 'logout') {
      signOut();
    } else {
      onNavigate(view);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Logo size="md" showText={true} />
          <div className="flex items-center space-x-4">
            <span className="text-sm hidden md:block">{profile?.full_name}</span>

            {hallOfFameVisibility.isVisible && (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => hallOfFameVisibility.isClickable && onNavigate('halloffame')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    hallOfFameVisibility.isClickable
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title="Hall of Fame"
                  disabled={!hallOfFameVisibility.isClickable}
                >
                  <Trophy className="w-4 h-4" />
                  <span className="hidden md:inline">Hall of Fame</span>
                  {hallOfFameVisibility.showComingSoonBadge && (
                    <Badge variant="warning" size="sm" className="ml-1">Coming Soon</Badge>
                  )}
                </button>
                {isVisibilityMode && isAdmin && (
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                    <VisibilityEyeIcon elementKey={NAVIGATION_KEYS.hallOfFame} />
                  </div>
                )}
              </div>
            )}

            {challengesVisibility.isVisible && (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => challengesVisibility.isClickable && onNavigate('challenges')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    challengesVisibility.isClickable
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title="Challenges"
                  disabled={!challengesVisibility.isClickable}
                >
                  <Swords className="w-4 h-4" />
                  <span className="hidden md:inline">Challenges</span>
                  {challengesVisibility.showComingSoonBadge && (
                    <Badge variant="warning" size="sm" className="ml-1">Coming Soon</Badge>
                  )}
                </button>
                {isVisibilityMode && isAdmin && (
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                    <VisibilityEyeIcon elementKey={NAVIGATION_KEYS.challenges} />
                  </div>
                )}
              </div>
            )}

            {currentView !== 'dashboard' && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
                title="Home"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Home</span>
              </button>
            )}
            {showVisibilityToggle && (
              <VisibilityModeToggle
                isActive={isVisibilityMode}
                onToggle={handleToggleVisibilityMode}
              />
            )}

            {showEditButton && !isVisibilityMode && (
              <button
                onClick={handleToggleEdit}
                className={`p-2 rounded-md transition-colors ${
                  isEditing
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-gray-700 hover:text-cyan-600 hover:bg-cyan-50'
                }`}
                aria-label={isEditing ? 'Bearbeiten beenden' : 'Anpassen'}
                title={isEditing ? 'Bearbeiten beenden' : 'Anpassen'}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center text-white transition-colors"
                aria-label="Profil-Menü"
              >
                <User className="w-5 h-5" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleMenuItemClick('settings')}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Einstellungen</span>
                  </button>
                  <button
                    onClick={() => handleMenuItemClick('profile')}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-3"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profil</span>
                  </button>
                  <button
                    onClick={() => handleMenuItemClick('files')}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-3"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Dateien</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  {profile?.role_level && profile.role_level <= 4 && (
                    <button
                      onClick={() => handleMenuItemClick('leaderdashboard')}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-3"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">Führungskräfte</span>
                    </button>
                  )}
                  {(profile?.role === 'Master' || profile?.role === 'Admin') && (
                    <>
                      <button
                        onClick={() => handleMenuItemClick('adminusers')}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-3"
                      >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Benutzerverwaltung</span>
                      </button>
                      <button
                        onClick={() => handleMenuItemClick('apikeys')}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-3"
                      >
                        <Key className="w-5 h-5" />
                        <span className="font-medium">API-Schlüssel</span>
                      </button>
                    </>
                  )}
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => handleMenuItemClick('logout')}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Abmelden</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
