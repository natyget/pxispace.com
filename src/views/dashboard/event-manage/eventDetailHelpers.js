/** Pure helpers aligned with mobile `AlbumDetailsModal` / web dashboard event UI. */

export function coverImageUrl(ev) {
  const u = ev?.coverImage;
  if (!u || typeof u !== 'string') return null;
  const t = u.trim();
  if (!t) return null;
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:image/')) return t;
  return null;
}

export function lineupRoleDisplay(role) {
  return (role && String(role).trim()) || 'Line up';
}

/** Mirrors mobile `AlbumDetailsModal` schedule display (date-fns-style). */
export function scheduleDisplay(ev) {
  if (!ev?.startDate) {
    return { primary: 'Date TBD', secondary: 'Set in event details' };
  }
  const start = new Date(ev.startDate);
  if (Number.isNaN(start.getTime())) {
    return { primary: 'Date TBD', secondary: '' };
  }
  const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
  const primary = weekdayFmt.format(start);

  const monthDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  let secondary = `${monthDay.format(start).toUpperCase()} · ${timeFmt.format(start).toUpperCase()}`;

  if (ev.endDate) {
    const end = new Date(ev.endDate);
    if (!Number.isNaN(end.getTime())) {
      const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
      if (sameDay) {
        secondary += ` – ${timeFmt.format(end).toUpperCase()}`;
      } else {
        const endBit = new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(end);
        secondary += ` · ENDS ${endBit.toUpperCase()}`;
      }
    }
  }
  return { primary, secondary };
}

/** Mirrors mobile location split on newline / comma / bullet. */
export function locationDisplay(ev) {
  const raw = String(ev?.location || ev?.venue || '').trim();
  if (raw) {
    const split = raw
      .split(/\n|,|•/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (split.length >= 2) {
      return { primary: split[0], secondary: split.slice(1).join(' · ') };
    }
    return { primary: raw, secondary: '' };
  }
  const lat = ev?.latitude != null ? Number(ev.latitude) : NaN;
  const lng = ev?.longitude != null ? Number(ev.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      primary: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      secondary: 'Coordinates (no address set)',
    };
  }
  return { primary: 'Location TBD', secondary: '' };
}

export function hostFromEvent(event) {
  const h = event?.host || event?.user;
  if (!h) return null;
  const name = h.name || h.username || 'Unknown Host';
  const avatarUrl = h.avatarUrl || h.avatar || null;
  return { name, avatarUrl };
}

export function publicEventPageUrl(eventId) {
  if (typeof window === 'undefined') {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    return base ? `${base}/events/${eventId}` : `/events/${eventId}`;
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '');
  return `${base}/events/${eventId}`;
}
