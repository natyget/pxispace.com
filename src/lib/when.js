/**
 * The "When" model, shared by every Discover surface (mirrors the app's whenModel).
 *
 *   When = { kind: 'tonight' } | { kind: 'tomorrow' } | { kind: 'weekend' } | { kind: 'week' }
 *        | { kind: 'night', night: 'YYYY-MM-DD' }
 *
 * A "night" runs 5 am to 5 am the next day in the city's time zone, so a set that starts at
 * 11 pm is still "tonight" at 2 am. Nothing here reads the clock or hard-codes a weekday:
 * every function takes `tonight` ('YYYY-MM-DD', from `tonightIn`) or a Date.
 */

export const NIGHT_TURNS_AT_HOUR = 5;
export const PICK_DAYS_AHEAD = 90;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const WHEN_TONIGHT = Object.freeze({ kind: 'tonight' });
export const WHEN_TOMORROW = Object.freeze({ kind: 'tomorrow' });
export const WHEN_WEEKEND = Object.freeze({ kind: 'weekend' });
export const WHEN_WEEK = Object.freeze({ kind: 'week' });
export const whenNight = (night) => ({ kind: 'night', night });

// ── calendar-date helpers (pure, on 'YYYY-MM-DD' strings) ───────────────────────────────

const pad = (n) => String(n).padStart(2, '0');
const toKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

export function parseNight(night) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(night || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

/** 'YYYY-MM-DD' plus `n` days (negative allowed). Calendar arithmetic, immune to DST. */
export function addDays(night, n) {
  const p = parseNight(night);
  if (!p) return night;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return toKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** 0 = Sunday .. 6 = Saturday. */
export function weekdayOf(night) {
  const p = parseNight(night);
  return p ? new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() : 0;
}

export const daysBetween = (a, b) => {
  const pa = parseNight(a);
  const pb = parseNight(b);
  if (!pa || !pb) return 0;
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
};

/** The Sunday that ends the week `night` is in (the week is Monday..Sunday). */
export function sundayOf(night) {
  return addDays(night, (7 - weekdayOf(night)) % 7);
}

// ── clock -> night ──────────────────────────────────────────────────────────────────────

const fmtCache = new Map();
function partsFormatter(tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/** The night an instant belongs to in `tz`: the local date, or the day before when it is
 *  earlier than 5 am local. Returns null for an invalid date. */
export function nightOf(instant, tz) {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(d.getTime())) return null;
  const get = {};
  for (const p of partsFormatter(tz).formatToParts(d)) get[p.type] = p.value;
  const key = `${get.year}-${get.month}-${get.day}`;
  return Number(get.hour) < NIGHT_TURNS_AT_HOUR ? addDays(key, -1) : key;
}

/** The night that "Tonight" means right now in `tz`. */
export const tonightIn = (tz, now = new Date()) => nightOf(now, tz);

// ── the model ───────────────────────────────────────────────────────────────────────────

/** The nights a When covers, oldest first. */
export function whenNights(when, tonight) {
  switch (when?.kind) {
    case 'tonight':
      return [tonight];
    case 'tomorrow':
      return [addDays(tonight, 1)];
    case 'week': {
      const out = [];
      for (let n = tonight; ; n = addDays(n, 1)) {
        out.push(n);
        if (n === sundayOf(tonight)) break;
      }
      return out;
    }
    case 'weekend': {
      // Fri..Sun of this week; on Fri/Sat/Sun it is what is left of it.
      const sunday = sundayOf(tonight);
      const friday = addDays(sunday, -2);
      const out = [];
      for (let n = daysBetween(friday, tonight) > 0 ? tonight : friday; ; n = addDays(n, 1)) {
        out.push(n);
        if (n === sunday) break;
      }
      return out;
    }
    case 'night':
      return parseNight(when.night) ? [when.night] : [];
    default:
      return [];
  }
}

const dayLabel = (night) => `${WEEKDAYS[weekdayOf(night)]} ${parseNight(night).d}`;

/** "Tonight", "Tomorrow", "This weekend", "This week", "Fri 16" (rest of this week), "Oct 29". */
export function whenLabel(when, tonight) {
  switch (when?.kind) {
    case 'tonight':
      return 'Tonight';
    case 'tomorrow':
      return 'Tomorrow';
    case 'weekend':
      return 'This weekend';
    case 'week':
      return 'This week';
    case 'night': {
      const p = parseNight(when.night);
      if (!p) return 'Pick a date';
      if (when.night === tonight) return 'Tonight';
      if (when.night === addDays(tonight, 1)) return 'Tomorrow';
      if (daysBetween(tonight, when.night) > 0 && daysBetween(when.night, sundayOf(tonight)) >= 0) {
        return dayLabel(when.night);
      }
      return `${MONTHS[p.m - 1]} ${p.d}`;
    }
    default:
      return '';
  }
}

/** The rows of the When menu, in order. `pick` opens the calendar. */
export function whenOptions(tonight) {
  const rows = [
    { id: 'tonight', label: 'Tonight', when: WHEN_TONIGHT },
    { id: 'tomorrow', label: 'Tomorrow', when: WHEN_TOMORROW },
    { id: 'weekend', label: 'This weekend', when: WHEN_WEEKEND },
    { id: 'week', label: 'This week', when: WHEN_WEEK },
  ];
  const sunday = sundayOf(tonight);
  for (let n = addDays(tonight, 2); daysBetween(n, sunday) >= 0; n = addDays(n, 1)) {
    rows.push({ id: n, label: dayLabel(n), when: whenNight(n) });
  }
  rows.push({ id: 'pick', label: 'Pick a date', when: null });
  return rows;
}

/** Stable string for a When (state keys, fetch keys). */
export const whenKey = (when) => (when ? (when.kind === 'night' ? `night:${when.night}` : when.kind) : 'any');

/** Is `when` the same choice as menu row `row`? A picked night that has a named row (or is
 *  tonight/tomorrow) counts as that row. */
export function whenMatchesRow(when, row, tonight) {
  if (!when || !row.when) return false;
  if (when.kind === row.when.kind && when.kind !== 'night') return true;
  const nights = whenNights(when, tonight);
  const rowNights = whenNights(row.when, tonight);
  return when.kind !== 'weekend' && when.kind !== 'week' && row.when.kind !== 'weekend' && row.when.kind !== 'week'
    ? nights.length === 1 && nights[0] === rowNights[0]
    : false;
}

/** First and last night the calendar lets a reader pick. */
export const pickRange = (tonight) => ({ min: tonight, max: addDays(tonight, PICK_DAYS_AHEAD) });

// ── feeds ───────────────────────────────────────────────────────────────────────────────

/** Query params for the discover feeds (contract section 2). `tz` rides along for a single night. */
export function whenParams(when, tz) {
  if (!when) return {};
  if (when.kind === 'night') return { window: 'night', night: when.night, tz };
  return { window: when.kind };
}

/** The `windowEcho` a backend that honoured `whenParams(when)` answers with. */
export const whenEcho = (when) => (when ? (when.kind === 'night' ? `night:${when.night}` : when.kind) : null);

/**
 * Does an event fall in the When? It does if it is on during any of the nights: it starts in
 * one, or it started earlier and is still on in the first. Used as the client fallback when
 * the backend did not echo the window, and to keep a server answer honest.
 */
export function eventInWhen(event, when, tonight, tz) {
  if (!when) return true;
  const nights = whenNights(when, tonight);
  if (!nights.length) return false;
  const start = nightOf(event?.startDate ?? event?.start, tz);
  if (!start) return false;
  const endRaw = event?.endDate ?? event?.end;
  const end = (endRaw && nightOf(endRaw, tz)) || start;
  const first = nights[0];
  const last = nights[nights.length - 1];
  return start <= last && (end >= first || start >= first);
}
