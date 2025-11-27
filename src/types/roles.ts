export type UserRole = 'Master' | 'Admin' | 'Company' | 'Teamleiter' | 'Coach' | 'User';

export type UserRoleDB = 'master' | 'admin' | 'company' | 'teamleiter' | 'coach' | 'user';

export type RoleData = {
  id: string;
  name: UserRole;
  level: number;
  created_at: string;
};

export type UserProfile = {
  id?: string;
  user_id: string;
  role_id: string;
  company_id: string | null;
  skill_level: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  profile_image_url: string | null;
  allow_sharing: boolean;
  created_at: string;
  updated_at?: string;
};

export type UserPackage = 'starter' | 'premium' | 'pro';

export type UserProfileComplete = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  role: UserRole;
  role_level: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  skill_level: string;
  package: UserPackage;
  allow_sharing: boolean;
  created_at: string;
  updated_at: string;
};

export function isMasterRole(profile: UserProfileComplete | null): boolean {
  return profile?.role === 'Master' || profile?.role_level === 1;
}

export function canManageRole(managerLevel: number, targetLevel: number): boolean {
  return managerLevel <= targetLevel;
}

export function getRoleDisplayName(role: UserRole | string): string {
  const displayNames: Record<UserRole, string> = {
    Master: 'Master',
    Admin: 'Administrator',
    Company: 'Firma',
    Teamleiter: 'Teamleiter',
    Coach: 'Coach',
    User: 'User',
  };

  if (!role) return 'User';

  const safeRole = role as UserRole;
  return displayNames[safeRole] || 'User';
}

export function getRoleBadgeColor(role: UserRole | string): string {
  const colors: Record<UserRole, string> = {
    Master: 'bg-rose-100 text-rose-700',
    Admin: 'bg-blue-100 text-blue-700',
    Company: 'bg-green-100 text-green-700',
    Teamleiter: 'bg-yellow-100 text-yellow-700',
    Coach: 'bg-orange-100 text-orange-700',
    User: 'bg-gray-100 text-gray-700',
  };

  if (!role) return colors['User'];

  const safeRole = role as UserRole;
  return colors[safeRole] || colors['User'];
}
