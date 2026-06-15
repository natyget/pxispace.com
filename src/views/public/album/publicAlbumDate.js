/** Fixed locale so SSR and browser hydration produce identical date strings. */
export const PUBLIC_ALBUM_LOCALE = 'en-US';

export function formatAlbumSchedule(event) {
  if (!event?.startDate) {
    return { primary: 'Date TBD', secondary: 'Set in event details' };
  }
  try {
    const start = new Date(event.startDate);
    if (Number.isNaN(start.getTime())) return { primary: 'Date TBD', secondary: '' };
    const primary = start.toLocaleDateString(PUBLIC_ALBUM_LOCALE, { weekday: 'long' });
    let secondary = `${start
      .toLocaleDateString(PUBLIC_ALBUM_LOCALE, { month: 'short', day: 'numeric' })
      .toUpperCase()} · ${start
      .toLocaleTimeString(PUBLIC_ALBUM_LOCALE, { hour: 'numeric', minute: '2-digit' })
      .toUpperCase()}`;
    if (event.endDate) {
      const end = new Date(event.endDate);
      if (!Number.isNaN(end.getTime())) {
        const sameDay = start.toDateString() === end.toDateString();
        if (sameDay) {
          secondary += ` – ${end.toLocaleTimeString(PUBLIC_ALBUM_LOCALE, {
            hour: 'numeric',
            minute: '2-digit',
          }).toUpperCase()}`;
        } else {
          secondary += ` · ENDS ${end
            .toLocaleDateString(PUBLIC_ALBUM_LOCALE, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
            .toUpperCase()}`;
        }
      }
    }
    return { primary, secondary };
  } catch {
    return { primary: 'Date TBD', secondary: '' };
  }
}

export function formatAlbumPostTime(createdAt, now = new Date()) {
  if (!createdAt) return '';
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return '';

    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (sameDay) {
      return d.toLocaleTimeString(PUBLIC_ALBUM_LOCALE, { hour: 'numeric', minute: '2-digit' });
    }

    const dateOpts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== now.getFullYear()) {
      dateOpts.year = 'numeric';
    }
    return d.toLocaleDateString(PUBLIC_ALBUM_LOCALE, dateOpts);
  } catch {
    return '';
  }
}

/**
 * Album thread media timestamp (outside image frame) — mirrors mobile `formatAlbumThreadPostTime`.
 * Today → time only; other days → date + time.
 */
export function formatAlbumThreadPostTime(createdAt, now = new Date()) {
  if (!createdAt) return '';
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return '';

    const time = d.toLocaleTimeString(PUBLIC_ALBUM_LOCALE, { hour: 'numeric', minute: '2-digit' });
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (sameDay) return time;

    const dateOpts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== now.getFullYear()) {
      dateOpts.year = 'numeric';
    }
    const date = d.toLocaleDateString(PUBLIC_ALBUM_LOCALE, dateOpts);
    return `${date}, ${time}`;
  } catch {
    return '';
  }
}

/** Focus overlay progress clock — `00:01`, `01:06`. */
export function formatVideoProgressClockFromMs(ms) {
  const s = Math.max(0, Math.floor(Number(ms) / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${String(remM).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Video tile badge — `0:42`, `1:05`, `1:02:30`. */
export function formatVideoDuration(totalSeconds) {
  const raw = Number(totalSeconds);
  if (!Number.isFinite(raw) || raw <= 0) return '';
  let sec = raw > 10_000 ? raw / 1000 : raw;
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}
