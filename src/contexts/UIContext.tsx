import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface PageLayout {
  left: string[];
  right: string[];
}

interface LayoutState {
  'dashboard-left'?: string[];
  'dashboard-right'?: string[];
  'training-left'?: string[];
  'training-right'?: string[];
}

interface UIContextType {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  layout: LayoutState;
  setLayout: (v: LayoutState) => void;
  saveLayout: () => Promise<void>;
  cancelEditing: () => void;
  currentPage: string | null;
  setCurrentPage: (page: string | null) => void;
  isVisibilityMode: boolean;
  setIsVisibilityMode: (v: boolean) => void;
}

const UIContext = createContext<UIContextType>({
  isEditing: false,
  setIsEditing: () => {},
  layout: {},
  setLayout: () => {},
  saveLayout: async () => {},
  cancelEditing: () => {},
  currentPage: null,
  setCurrentPage: () => {},
  isVisibilityMode: false,
  setIsVisibilityMode: () => {},
});

export function UIProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<LayoutState>({});
  const [savedLayout, setSavedLayout] = useState<LayoutState>({});
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [isVisibilityMode, setIsVisibilityMode] = useState(false);

  useEffect(() => {
    if (user) {
      loadLayout();
    }
  }, [user]);

  async function loadLayout() {
    if (!user) {
      const saved = localStorage.getItem('ui-layout');
      if (saved) {
        const parsedLayout = JSON.parse(saved);
        setLayout(parsedLayout);
        setSavedLayout(parsedLayout);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_layouts')
        .select('layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.layout) {
        const layoutData = data.layout as LayoutState;
        setLayout(layoutData);
        setSavedLayout(layoutData);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
      const saved = localStorage.getItem('ui-layout');
      if (saved) {
        const parsedLayout = JSON.parse(saved);
        setLayout(parsedLayout);
        setSavedLayout(parsedLayout);
      }
    }
  }

  async function saveLayout() {
    if (!user) {
      localStorage.setItem('ui-layout', JSON.stringify(layout));
      setSavedLayout(layout);
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_layouts')
        .upsert({
          user_id: user.id,
          layout: layout,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSavedLayout(layout);
      setIsEditing(false);
      localStorage.setItem('ui-layout', JSON.stringify(layout));
    } catch (error) {
      console.error('Error saving layout:', error);
      localStorage.setItem('ui-layout', JSON.stringify(layout));
      setSavedLayout(layout);
      setIsEditing(false);
    }
  }

  function cancelEditing() {
    setLayout(savedLayout);
    setIsEditing(false);
  }

  return (
    <UIContext.Provider
      value={{ isEditing, setIsEditing, layout, setLayout, saveLayout, cancelEditing, currentPage, setCurrentPage, isVisibilityMode, setIsVisibilityMode }}
    >
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
