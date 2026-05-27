/** @typedef {'join' | 'invite'} ShareLinkTone */

/**
 * @param {string | undefined | null} name
 * @param {ShareLinkTone} [tone]
 */
export function eventShareLead(name, tone = 'join') {
  const label = (name || '').trim() || 'this event';
  return tone === 'invite' ? `You've been invited to ${label}` : `Join us at ${label}`;
}

/**
 * @param {string | undefined | null} name
 * @param {ShareLinkTone} [tone]
 */
export function albumShareLead(name, tone = 'join') {
  const label = (name || '').trim() || 'this album';
  return tone === 'invite' ? `You've been invited to ${label}` : `Join us at ${label}`;
}

/** @param {string} lead @param {string} url */
export function shareMessageWithUrl(lead, url) {
  return `${lead}\n\n${url}`;
}
