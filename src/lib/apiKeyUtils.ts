export function generateApiKeySecret(): string {
  const random = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(random)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashApiKey(secret: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatApiKey(secret: string): string {
  return `sk_${secret}`;
}

export function extractApiKey(formattedKey: string): string {
  if (formattedKey.startsWith('sk_')) {
    return formattedKey.substring(3);
  }
  return formattedKey;
}

export const AVAILABLE_SCOPES = [
  { value: 'training:read', label: 'Training lesen' },
  { value: 'training:write', label: 'Training schreiben' },
  { value: 'challenges:read', label: 'Challenges lesen' },
  { value: 'profile:read', label: 'Profil lesen' },
] as const;

export function formatScopesDisplay(scopes: string[] | null): string {
  if (!scopes || scopes.length === 0) return 'Keine';
  return scopes.join(', ');
}

export function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return 'Noch nie';
  const date = new Date(lastUsedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
  if (diffDays < 30) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
