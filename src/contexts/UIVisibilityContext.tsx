import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UiVisibility } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type VisibilityState = 'visible' | 'comingsoon' | 'hidden';

type UIVisibilityContextType = {
  visibility: Record<string, VisibilityState>;
  loading: boolean;
  error?: string;
  refreshVisibility: () => Promise<void>;
  setVisibility: (key: string, state: VisibilityState) => Promise<void>;
};

const UIVisibilityContext = createContext<UIVisibilityContextType | null>(null);

export function UIVisibilityProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [visibility, setVisibilityState] = useState<Record<string, VisibilityState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const loadVisibility = async () => {
    if (!profile?.tenant_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const { data, error: fetchError } = await supabase
        .from('ui_visibility')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

      if (fetchError) throw fetchError;

      const visibilityMap: Record<string, VisibilityState> = {};
      data?.forEach((item: UiVisibility) => {
        visibilityMap[item.key] = item.state;
      });

      setVisibilityState(visibilityMap);
    } catch (err) {
      console.error('Error loading UI visibility:', err);
      setError(err instanceof Error ? err.message : 'Failed to load visibility settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisibility();
  }, [profile?.tenant_id]);

  const refreshVisibility = async () => {
    await loadVisibility();
  };

  const setVisibility = async (key: string, state: VisibilityState) => {
    if (!profile?.tenant_id) {
      throw new Error('No tenant ID available');
    }

    setVisibilityState((prev) => ({
      ...prev,
      [key]: state,
    }));

    try {
      const { error: upsertError } = await supabase
        .from('ui_visibility')
        .upsert(
          {
            tenant_id: profile.tenant_id,
            key,
            state,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'tenant_id,key',
          }
        );

      if (upsertError) throw upsertError;
    } catch (err) {
      console.error('Error setting UI visibility:', err);
      await loadVisibility();
      throw err;
    }
  };

  const value: UIVisibilityContextType = {
    visibility,
    loading,
    error,
    refreshVisibility,
    setVisibility,
  };

  return (
    <UIVisibilityContext.Provider value={value}>
      {children}
    </UIVisibilityContext.Provider>
  );
}

export function useUIVisibility() {
  const context = useContext(UIVisibilityContext);
  if (!context) {
    throw new Error('useUIVisibility must be used within UIVisibilityProvider');
  }
  return context;
}
