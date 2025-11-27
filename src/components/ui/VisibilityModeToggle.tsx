import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type VisibilityModeToggleProps = {
  isActive: boolean;
  onToggle: (active: boolean) => void;
};

export function VisibilityModeToggle({ isActive, onToggle }: VisibilityModeToggleProps) {
  return (
    <button
      onClick={() => onToggle(!isActive)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-cyan-600 text-white shadow-lg'
          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
      }`}
      title={isActive ? 'Freigabe-Modus deaktivieren' : 'Freigabe-Modus aktivieren'}
    >
      {isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      <span className="hidden sm:inline">Freigabe-Modus</span>
    </button>
  );
}
