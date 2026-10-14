// Dashboard 2: one way to print money, counts, dates and rates on every dashboard page.

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat('en-US');

/** "$1,234" from cents; small amounts keep cents ("$12.50") so a first commission does not read as $0. */
export function money(cents) {
    if (cents === null || cents === undefined || Number.isNaN(Number(cents))) return '-';
    const dollars = Number(cents) / 100;
    if (dollars === 0) return '$0';
    return Math.abs(dollars) < 100 ? usd2.format(dollars) : usd0.format(dollars);
}

/** "$136.48" from cents, always to the cent: for commissions and payouts, where the rows must add up to the total. */
export function exactMoney(cents) {
    if (cents === null || cents === undefined || Number.isNaN(Number(cents))) return '-';
    const dollars = Number(cents) / 100;
    return dollars === 0 ? '$0' : usd2.format(dollars);
}

/** "1,234". */
export function count(n) {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
    return int.format(Number(n));
}

/** "20%" from basis points (2000); "12.5%" keeps one decimal when needed; "Not set" for null. */
export function percentFromBps(bps) {
    if (bps === null || bps === undefined) return 'Not set';
    const pct = Number(bps) / 100;
    return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

function asDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** "Oct 13", or "Oct 13, 2025" outside the current year. */
export function shortDate(value) {
    const d = asDate(value);
    if (!d) return '';
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString('en-US', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Mon, Oct 13". */
export function dayDate(value) {
    const d = asDate(value);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Oct 13, 9:00 PM". */
export function dateTime(value) {
    const d = asDate(value);
    if (!d) return '';
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then the date. */
export function ago(value) {
    const d = asDate(value);
    if (!d) return '';
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    const days = Math.floor(s / 86400);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return shortDate(d);
}

/** "in 3 days", "tomorrow", "today". */
export function until(value) {
    const d = asDate(value);
    if (!d) return '';
    const days = Math.round((d.getTime() - Date.now()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
}

/** "@name", or the name when there is no username. */
export function handle(person) {
    if (!person) return '';
    return person.username ? `@${person.username}` : person.name || '';
}

/** The name to show for a person: their name, else their @username. */
export function displayName(person) {
    if (!person) return '';
    return person.name || (person.username ? `@${person.username}` : '');
}
