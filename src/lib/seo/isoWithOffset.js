// ISO-8601 dates with the event zone's real offset. Pure (no aliases), so listings.test.mjs can import it.

/**
 * ISO-8601 with a real UTC offset for the event's local timezone, e.g.
 * "2026-08-14T22:00:00-04:00". Google explicitly wants the offset on Event dates —
 * a bare "Z" is legal but tells it the party starts at 2am, which is how events end up
 * listed on the wrong day.
 * Falls back to plain ISO (Z) when no timezone is known rather than inventing one.
 */
export function isoWithOffset(value, timeZone) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (!timeZone) return d.toISOString();

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(d)
      .reduce((acc, p) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});

    // Intl renders midnight as "24" in some ICU versions; normalise it.
    const hour = parts.hour === '24' ? '00' : parts.hour;
    const local = `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;

    // Offset = (wall-clock time in that zone) − (the same instant in UTC).
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const offsetMinutes = Math.round((asUtc - d.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const mag = Math.abs(offsetMinutes);
    const oh = String(Math.floor(mag / 60)).padStart(2, '0');
    const om = String(mag % 60).padStart(2, '0');
    return `${local}${sign}${oh}:${om}`;
  } catch {
    return d.toISOString();
  }
}
