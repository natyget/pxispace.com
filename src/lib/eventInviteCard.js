/**
 * What the event link-preview card prints (the app's invite card: pxi-mobile-app
 * src/utils/eventInviteDisplay.ts + EventInviteStoryCanvas): the day "SAT, OCT 4", the hours
 * "9 PM – 2 AM", and one place line — the venue's own name, else the street, never the full address.
 */

const LOCALE = 'en-US';
const DAY_MS = 24 * 60 * 60 * 1000;
// Both operating cities (New York, Boston) are Eastern; used only when the event names no zone.
export const INVITE_FALLBACK_TIMEZONE = 'America/New_York';

/** The venue's own name when there is one, else the first piece of "venue, street, city". '' when there is nothing to say. */
export function formatInviteVenue(location, venueName) {
  const venue = String(venueName ?? '').trim().split(/\n|,|•/)[0]?.trim() ?? '';
  if (venue) return venue;
  return String(location ?? '').split(/\n|,|•/)[0]?.trim() ?? '';
}

/** { day: 'SAT, OCT 4', hours: '9 PM – 2 AM' } in the event's own time zone, or null without a usable start. */
export function formatInviteWhen(startDate, endDate, timeZone) {
  const start = startDate ? new Date(startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return null;
  let tz = timeZone || INVITE_FALLBACK_TIMEZONE;
  try {
    new Intl.DateTimeFormat(LOCALE, { timeZone: tz });
  } catch {
    tz = INVITE_FALLBACK_TIMEZONE;
  }
  const fmt = (d, opts) => new Intl.DateTimeFormat(LOCALE, { timeZone: tz, ...opts }).format(d);
  const clock = (d) => {
    const minutes = Number(new Intl.DateTimeFormat(LOCALE, { timeZone: tz, minute: 'numeric' }).format(d));
    return fmt(d, minutes === 0 ? { hour: 'numeric' } : { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  };
  // Calendar day number in the event's zone, to tell "the same night" from a later day.
  const dayKey = (d) => {
    const p = new Intl.DateTimeFormat(LOCALE, { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d);
    const g = (t) => Number(p.find((x) => x.type === t)?.value);
    return Date.UTC(g('year'), g('month') - 1, g('day')) / DAY_MS;
  };

  const day = fmt(start, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  let hours = clock(start);
  const end = endDate ? new Date(endDate) : null;
  if (end && !Number.isNaN(end.getTime()) && end.getTime() > start.getTime()) {
    const diff = dayKey(end) - dayKey(start);
    const sameNight = diff === 0 || (diff === 1 && end.getTime() - start.getTime() < DAY_MS);
    hours += sameNight
      ? ` – ${clock(end)}`
      : ` – ${fmt(end, { month: 'short', day: 'numeric' }).toUpperCase()}, ${clock(end)}`;
  }
  return { day, hours };
}
