export type ChallengeStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'expired' | 'declined';

export type ChallengeDirection = 'incoming' | 'outgoing';

export interface Challenge {
  id: string;
  tenant_id: string;
  challenger_id: string;
  opponent_id: string;
  status: ChallengeStatus;
  training_mode: string;
  difficulty: string;
  winner_id?: string;
  loser_id?: string;
  revenge_parent_id?: string;
  points_awarded?: number;
  created_at: string;
  start_at?: string;
  accepted_at?: string;
  expires_at?: string;
  completed_at?: string;
  challenger?: {
    full_name: string;
    email: string;
  };
  opponent?: {
    full_name: string;
    email: string;
  };
}

export interface ChallengeWithDirection extends Challenge {
  direction: ChallengeDirection;
  remainingTime?: RemainingTime;
  isExpired: boolean;
}

export interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  displayText: string;
}

export function getChallengeDirection(
  challenge: Challenge,
  currentUserId: string
): ChallengeDirection {
  return challenge.challenger_id === currentUserId ? 'outgoing' : 'incoming';
}

export function calculateRemainingTime(expiresAt: string | undefined): RemainingTime | undefined {
  if (!expiresAt) return undefined;

  const now = new Date();
  const end = new Date(expiresAt);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
      displayText: 'Abgelaufen',
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  let displayText: string;

  if (days >= 1) {
    displayText = `${days} Tag${days > 1 ? 'e' : ''}, ${hours} Std.`;
  } else if (totalHours > 1) {
    displayText = `${totalHours} Stunde${totalHours > 1 ? 'n' : ''}`;
  } else {
    displayText = `${totalMinutes} Minute${totalMinutes !== 1 ? 'n' : ''}`;
  }

  return {
    days,
    hours,
    minutes,
    totalMinutes,
    displayText,
  };
}

export function isChallengExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function enrichChallengeWithDirection(
  challenge: Challenge,
  currentUserId: string
): ChallengeWithDirection {
  const direction = getChallengeDirection(challenge, currentUserId);
  const remainingTime = calculateRemainingTime(challenge.expires_at);
  const isExpired = isChallengExpired(challenge.expires_at);

  return {
    ...challenge,
    direction,
    remainingTime,
    isExpired,
  };
}

export function getChallengeStatusColor(status: ChallengeStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'expired':
      return 'bg-red-100 text-red-800';
    case 'declined':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getChallengeStatusLabel(status: ChallengeStatus): string {
  switch (status) {
    case 'pending':
      return 'Ausstehend';
    case 'accepted':
      return 'Angenommen';
    case 'active':
      return 'Aktiv';
    case 'completed':
      return 'Abgeschlossen';
    case 'expired':
      return 'Abgelaufen';
    case 'declined':
      return 'Abgelehnt';
    default:
      return status;
  }
}

export function getDirectionBadgeColor(direction: ChallengeDirection): string {
  return direction === 'incoming'
    ? 'bg-purple-100 text-purple-800'
    : 'bg-cyan-100 text-cyan-800';
}

export function getDirectionLabel(direction: ChallengeDirection): string {
  return direction === 'incoming' ? 'Eingehend' : 'Ausgehend';
}

export function getChallengeDescription(
  challenge: ChallengeWithDirection,
  currentUserId: string
): string {
  const opponentName = challenge.direction === 'outgoing'
    ? challenge.opponent?.full_name || 'Unbekannt'
    : challenge.challenger?.full_name || 'Unbekannt';

  if (challenge.direction === 'outgoing') {
    return `Du gegen ${opponentName}`;
  } else {
    return `${opponentName} gegen dich`;
  }
}
