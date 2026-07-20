/**
 * Command-center reminders — derived ONLY from real data (events, unread
 * notifications, payouts). The old fabricated "PXI updates" / support-queue /
 * marketing-pipeline mocks were removed deliberately: if it isn't wired, it
 * isn't shown.
 */

function toTime(raw) {
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

export function eventStatus(event, now = Date.now()) {
  const startMs = toTime(event?.startDate);
  const endMs = toTime(event?.endDate);
  const statusRaw = String(event?.status || '').toUpperCase();

  if (statusRaw === 'ARCHIVED' || (endMs && endMs < now)) return 'past';
  if (statusRaw === 'LIVE' || statusRaw === 'ACTIVE' || (startMs && startMs <= now && (!endMs || endMs >= now))) return 'live';
  if (startMs > now) return 'upcoming';
  return 'draft';
}

function eventTimeLabel(event) {
  const startMs = toTime(event?.startDate);
  if (!startMs) return 'Date pending';

  return new Date(startMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildCommandCenterReminders({ events = [], unreadCount = 0, vendorDashboard = null } = {}) {
  const now = Date.now();
  const upcoming = events
    .filter((event) => eventStatus(event, now) === 'live' || eventStatus(event, now) === 'upcoming')
    .sort((a, b) => toTime(a.startDate) - toTime(b.startDate));
  const nextEvent = upcoming[0];
  const pendingPayouts = (vendorDashboard?.payouts ?? []).filter(
    (payout) => String(payout?.status || '').toLowerCase() !== 'paid'
  ).length;

  const reminders = [];

  if (nextEvent) {
    reminders.push({
      id: 'next-event',
      title: 'Next event',
      detail: `${nextEvent.name || 'Hosted event'} · ${eventTimeLabel(nextEvent)}`,
      href: nextEvent.id ? `/dashboard/events/${nextEvent.id}` : '/dashboard/events',
      action: 'Open',
    });
  }
  if (unreadCount > 0) {
    reminders.push({
      id: 'unread',
      title: 'Unread updates',
      detail: `${unreadCount} update${unreadCount === 1 ? '' : 's'} waiting in your inbox.`,
      href: '/dashboard/notifications',
      action: 'Review',
    });
  }
  if (pendingPayouts > 0) {
    reminders.push({
      id: 'payouts',
      title: 'Payout review',
      detail: `${pendingPayouts} payout${pendingPayouts === 1 ? '' : 's'} still pending.`,
      href: '/dashboard/earnings',
      action: 'View earnings',
    });
  }

  return reminders;
}
