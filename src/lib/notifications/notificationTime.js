const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(input) {
  if (input == null) return null;
  const d = typeof input === 'string' ? new Date(input) : input;
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMonthDay(d, withYear) {
  const m = MONTHS[d.getMonth()];
  const day = d.getDate();
  if (withYear) return `${m} ${day}, ${d.getFullYear()}`;
  return `${m} ${day}`;
}

/** List rows: relative under 24h, else "Apr 18" or "Apr 18, 2025". */
export function formatNotificationListTime(input) {
  const d = parseDate(input);
  if (!d) return '';

  const now = new Date();
  if (d.getTime() > now.getTime()) return formatMonthDay(d, true);

  const diffMs = now.getTime() - d.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diffMs < dayMs) {
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return min === 1 ? '1 min ago' : `${min} min ago`;
    const hr = Math.floor(min / 60);
    return hr === 1 ? '1 hour ago' : `${hr} hours ago`;
  }

  const sameYear = d.getFullYear() === now.getFullYear();
  return formatMonthDay(d, !sameYear);
}

/** Dense rows: "now", "45m", "2h", "3d", or list date. */
export function formatNotificationCompactTime(input) {
  const d = parseDate(input);
  if (!d) return '';

  const now = new Date();
  if (d.getTime() > now.getTime()) return formatMonthDay(d, false);

  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return formatNotificationListTime(d);
}

export function formatInviteRespondedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}
