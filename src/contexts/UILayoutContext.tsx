import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase, UiLayout } from '../lib/supabase';
import { useAuth } from './AuthContext';

type LayoutItem = {
  element_key: string;
  position: number;
  layout?: { column?: string; [key: string]: any };
};

type UILayoutContextType = {
  getLayoutForArea: (area: string) => Promise<LayoutItem[]>;
  setLayoutForArea: (area: string, layout: LayoutItem[]) => Promise<void>;
  loading: boolean;
};

const UILayoutContext = createContext<UILayoutContextType | null>(null);

export function UILayoutProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const getLayoutForArea = useCallback(
    async (area: string): Promise<LayoutItem[]> => {
      if (!profile?.tenant_id || !profile?.id) {
        return [];
      }

      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from('ui_layouts')
          .select('key, position, layout')
          .eq('tenant_id', profile.tenant_id)
          .eq('user_id', profile.id)
          .eq('area', area)
          .order('position', { ascending: true });

        if (fetchError) throw fetchError;

        return (data || []).map((item) => ({
          element_key: item.key,
          position: item.position,
          layout: item.layout || undefined,
        }));
      } catch (err) {
        console.error('Error loading layout for area:', area, err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [profile?.tenant_id, profile?.id]
  );

  const setLayoutForArea = useCallback(
    async (area: string, layout: LayoutItem[]) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No tenant ID or user ID available');
      }

      try {
        setLoading(true);

        const { error: deleteError } = await supabase
          .from('ui_layouts')
          .delete()
          .eq('tenant_id', profile.tenant_id)
          .eq('user_id', profile.id)
          .eq('area', area);

        if (deleteError) throw deleteError;

        if (layout.length > 0) {
          const layoutRecords = layout.map((item) => ({
            tenant_id: profile.tenant_id,
            user_id: profile.id,
            area,
            key: item.element_key,
            position: item.position,
            layout: item.layout || null,
          }));

          const { error: insertError } = await supabase
            .from('ui_layouts')
            .insert(layoutRecords);

          if (insertError) throw insertError;
        }
      } catch (err) {
        console.error('Error setting layout for area:', area, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [profile?.tenant_id, profile?.id]
  );

  const value: UILayoutContextType = {
    getLayoutForArea,
    setLayoutForArea,
    loading,
  };

  return <UILayoutContext.Provider value={value}>{children}</UILayoutContext.Provider>;
}

export function useUILayout() {
  const context = useContext(UILayoutContext);
  if (!context) {
    throw new Error('useUILayout must be used within UILayoutProvider');
  }
  return context;
}
