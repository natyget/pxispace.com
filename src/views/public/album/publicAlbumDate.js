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

export function formatAlbumPostTime(createdAt) {
  if (!createdAt) return '';
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(PUBLIC_ALBUM_LOCALE, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
