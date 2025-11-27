import { createClient } from '@supabase/supabase-js';
import { UserRole, UserProfileComplete, RoleData } from '../types/roles';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = UserProfileComplete;

export type SkillScores = {
  id: string;
  user_id: string;
  rapport_building: number;
  needs_analysis: number;
  objection_handling: number;
  closing: number;
  communication: number;
  updated_at: string;
};

export type Guideline = {
  id: string;
  tenant_id: string;
  created_by: string | null;
  title: string;
  content: string;
  optimized_content: string | null;
  scenario_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TrainingSession = {
  id: string;
  user_id: string;
  tenant_id: string;
  guideline_id: string | null;
  scenario_type: string;
  difficulty: 'anfaenger' | 'fortgeschritten' | 'profi';
  customer_type: 'gelb' | 'blau' | 'gruen' | 'rot' | 'zufall';
  transcript: Array<{ role: 'user' | 'customer'; message: string; timestamp: string }>;
  duration_seconds: number;
  success_rating: number;
  scores: {
    rapport_building: number;
    needs_analysis: number;
    objection_handling: number;
    closing: number;
    communication: number;
  };
  feedback: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
};

export type Tenant = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Role = RoleData;

export type ApiKey = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  name: string;
  token_hash: string;
  scopes: string[] | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

export const isMaster = (profile: Profile | null): boolean => {
  return profile?.role_level === 1;
};

export const isAdminOrHigher = (profile: Profile | null): boolean => {
  return (profile?.role_level || 999) <= 2;
};

export const isCompanyOrHigher = (profile: Profile | null): boolean => {
  return (profile?.role_level || 999) <= 3;
};

export const isTeamleiterOrHigher = (profile: Profile | null): boolean => {
  return (profile?.role_level || 999) <= 4;
};

export const isCoachOrHigher = (profile: Profile | null): boolean => {
  return (profile?.role_level || 999) <= 5;
};

export type UiVisibility = {
  tenant_id: string;
  key: string;
  state: 'visible' | 'comingsoon' | 'hidden';
  updated_at: string;
};

export type UiLayout = {
  tenant_id: string;
  user_id: string;
  area: string;
  key: string;
  position: number;
  layout: any | null;
  updated_at: string;
};
