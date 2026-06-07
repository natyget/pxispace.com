/** Mirrors `pxi-mobile-app/src/utils/inviteNotificationCopy.ts`. */

export function senderDisplayForInvite(user) {
  if (!user) return 'Someone';
  const n = String(user.name || '').trim();
  if (n) return n;
  const un = String(user.username || '').trim().replace(/^@/, '');
  if (un) return `@${un}`;
  return 'Someone';
}

export const INVITE_ROLE_COLORS = {
  member: '#6EC8FF',
  cohost: '#FF9F43',
  bouncer: '#FF4D4D',
  lineup: '#3DDC84',
};

function lineUpPhrase(data) {
  const sub = String(data?.lineupSubrole || data?.role || '').trim();
  return sub ? `line-up (${sub})` : 'line-up';
}

export function inviteRoleLabelForCard(data, notificationType) {
  if (notificationType === 'LINEUP_INVITE') {
    const sub = String(data?.lineupSubrole || data?.role || '').trim();
    return sub || 'Line up';
  }
  if (notificationType === 'STAFF_INVITE') {
    const map = { ADMIN: 'Co-host', BOUNCER: 'Bouncer', MEMBER: 'Featured talent' };
    return map[data?.role || ''] || 'Staff';
  }
  const ir = data?.inviteRole;
  if (!ir) return null;
  if (ir === 'LINEUP') {
    const sub = String(data?.lineupSubrole || data?.role || '').trim();
    return sub || 'Line up';
  }
  const map = { MEMBER: 'Member', COHOST: 'Co-host', BOUNCER: 'Bouncer' };
  return map[ir] || null;
}

export function isLineupStyleInvite(data, notificationType) {
  if (notificationType === 'LINEUP_INVITE') return true;
  return data?.inviteRole === 'LINEUP';
}

export function inviteAcceptedStatusText(roleLabel, isLineup) {
  if (isLineup) return "You're on the line-up";
  if (roleLabel && roleLabel !== 'Member') return `You joined as ${roleLabel}`;
  return "You're going";
}

export function inviteRoleAccent(data, notificationType) {
  if (notificationType === 'LINEUP_INVITE' || data?.inviteRole === 'LINEUP') return 'lineup';
  if (notificationType === 'STAFF_INVITE') {
    const role = data?.role || '';
    if (role === 'ADMIN') return 'cohost';
    if (role === 'BOUNCER') return 'bouncer';
    if (role === 'MEMBER') return 'member';
    return null;
  }
  const ir = data?.inviteRole;
  if (!ir) return null;
  if (ir === 'MEMBER') return 'member';
  if (ir === 'COHOST') return 'cohost';
  if (ir === 'BOUNCER') return 'bouncer';
  if (ir === 'LINEUP') return 'lineup';
  return null;
}

export function inviteRoleAccentColor(data, notificationType) {
  const accent = inviteRoleAccent(data, notificationType);
  return accent ? INVITE_ROLE_COLORS[accent] : null;
}
