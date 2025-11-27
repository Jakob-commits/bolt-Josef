import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, Profile, Tenant, SkillScores } from '../lib/supabase';
import { calculateSkillLevel, SkillLevelResult } from '../lib/skillUtils';
import { UserPackage } from '../lib/planCapabilities';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  skillScores: SkillScores | null;
  skillLevel: SkillLevelResult;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    tenantName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [skillScores, setSkillScores] = useState<SkillScores | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevelResult>({
    percent: 0,
    label: 'Anfänger',
  });
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    console.log('[AuthContext] Loading profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('[AuthContext] Profile query result:', { data, error });

      if (error) {
        console.error('[AuthContext] Profile query error:', error);
        throw error;
      }

      if (data) {
        console.log('[AuthContext] Profile data loaded:', data);

        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('level')
          .eq('name', data.role)
          .maybeSingle();

        console.log('[AuthContext] Role data:', { roleData, roleError });

        const validPackages: UserPackage[] = ['starter', 'premium', 'pro'];
        const packageValue: UserPackage = validPackages.includes(data.package as UserPackage)
          ? (data.package as UserPackage)
          : 'starter';

        // Convert role from lowercase to capitalized (DB: 'master' -> UI: 'Master')
        const roleStr = String(data.role || '');
        const capitalizedRole = roleStr.charAt(0).toUpperCase() + roleStr.slice(1);

        const completeProfile: Profile = {
          id: data.id,
          user_id: data.id,
          tenant_id: data.tenant_id,
          role: capitalizedRole as any,
          role_level: roleData?.level || 999,
          full_name: data.full_name,
          email: data.email,
          avatar_url: data.avatar_url,
          skill_level: data.skill_level || 'anfaenger',
          package: packageValue,
          allow_sharing: false,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        console.log('[AuthContext] Complete profile created:', completeProfile);
        setProfile(completeProfile);

        await loadSkillScores(userId);

        if (data.tenant_id) {
          await loadTenant(data.tenant_id);
        }

        console.log('[AuthContext] Profile loading complete');
      } else {
        console.warn('[AuthContext] No profile data returned from query');
        setProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading profile:', error);
      setProfile(null);
      setSkillScores(null);
      setSkillLevel({ percent: 0, label: 'Anfänger' });
    } finally {
      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    }
  };

  const loadSkillScores = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('skill_scores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSkillScores(data);
        const calculatedLevel = calculateSkillLevel(data);
        setSkillLevel(calculatedLevel);
      } else {
        setSkillScores(null);
        setSkillLevel({ percent: 0, label: 'Anfänger' });
      }
    } catch (error) {
      console.error('Error loading skill scores:', error);
      setSkillScores(null);
      setSkillLevel({ percent: 0, label: 'Anfänger' });
    }
  };

  const loadTenant = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();

      if (error) throw error;
      setTenant(data);
    } catch (error) {
      console.error('Error loading tenant:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setTenant(null);
          setSkillScores(null);
          setSkillLevel({ percent: 0, label: 'Anfänger' });
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    tenantName?: string
  ) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registrierung fehlgeschlagen');

    if (!tenantName || tenantName.trim() === '') {
      throw new Error('Firmenname ist erforderlich');
    }

    const trimmedName = tenantName.trim();
    let tenantId: string;
    let isFirstUserForTenant = false;

    const { data: existingTenant, error: tenantSelectError } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', trimmedName)
      .maybeSingle();

    if (tenantSelectError) {
      throw tenantSelectError;
    }

    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      const { data: newTenant, error: tenantInsertError } = await supabase
        .from('tenants')
        .insert({ name: trimmedName })
        .select('id')
        .single();

      if (tenantInsertError || !newTenant) {
        throw tenantInsertError ?? new Error('Tenant konnte nicht erstellt werden');
      }

      tenantId = newTenant.id;
      isFirstUserForTenant = true;
    }

    if (!isFirstUserForTenant) {
      const { data: existingProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1);

      if (profilesError) {
        throw profilesError;
      }

      isFirstUserForTenant = !existingProfiles || existingProfiles.length === 0;
    }

    const role = isFirstUserForTenant ? 'master' : 'user';
    const packageValue: UserPackage = role === 'master' ? 'pro' : 'starter';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      tenant_id: tenantId,
      role,
      full_name: fullName,
      email: email,
      skill_level: 'anfaenger',
      package: packageValue,
    });

    if (profileError) throw profileError;

    const { error: skillError } = await supabase.from('skill_scores').insert({
      user_id: authData.user.id,
      rapport_building: 0,
      needs_analysis: 0,
      objection_handling: 0,
      closing: 0,
      communication: 0,
    });

    if (skillError) throw skillError;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setTenant(null);
    setSkillScores(null);
    setSkillLevel({ percent: 0, label: 'Anfänger' });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        tenant,
        skillScores,
        skillLevel,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
