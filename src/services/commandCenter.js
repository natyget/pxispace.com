const SUPPORT_STATES = ['open', 'triage', 'waiting', 'resolved'];
const CAMPAIGN_STATES = ['draft', 'scheduled', 'active', 'completed'];

function toTime(raw) {
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function soldTickets(event) {
  return Math.max(0, (event?._count?.tickets ?? 0) - 1);
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

function money(cents) {
  return `$${((cents ?? 0) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildEventOperationsGraph(events = [], now = Date.now()) {
  const buckets = events.reduce(
    (acc, event) => {
      acc[eventStatus(event, now)].push(event);
      return acc;
    },
    { live: [], upcoming: [], draft: [], past: [] }
  );

  const focusEvents = [...buckets.live, ...buckets.upcoming, ...buckets.draft, ...buckets.past]
    .slice(0, 4)
    .map((event) => {
      const state = eventStatus(event, now);
      const tickets = soldTickets(event);
      return {
        id: event.id,
        title: event.name || 'Untitled event',
        state,
        detail: `${eventTimeLabel(event)} - ${tickets} attendee${tickets === 1 ? '' : 's'}`,
        href: `/dashboard/events/${event.id}`,
        action:
          state === 'live'
            ? 'Open Live Ops'
            : state === 'upcoming'
              ? 'Review Run Sheet'
              : state === 'draft'
                ? 'Finish Setup'
                : 'Review Event',
      };
    });

  return {
    counts: [
      { label: 'Live', value: buckets.live.length, href: '/dashboard/events' },
      { label: 'Upcoming', value: buckets.upcoming.length, href: '/dashboard/events' },
      { label: 'Drafts', value: buckets.draft.length, href: '/dashboard/events' },
      { label: 'Past', value: buckets.past.length, href: '/dashboard/events' },
    ],
    focusEvents,
    emptyAction: {
      title: 'Create your first hosted event',
      detail: 'Once an event is hosted, Command Center will show live ops, run-sheet, and settlement paths here.',
      href: '/dashboard/events',
      action: 'Open Events',
    },
  };
}

export function listSupportQueue({ events = [], notifications = [] } = {}) {
  const eventNames = events.slice(0, 3).map((event) => event.name || 'Hosted event');
  const unreadCount = notifications.filter((notification) => !notification?.readAt).length;
  const baseQueue = [
    {
      id: 'support-access',
      title: 'Door access issue',
      event: eventNames[0] || 'Next hosted event',
      status: 'open',
      severity: unreadCount > 3 ? 'high' : 'medium',
      detail:
        unreadCount > 0
          ? `${unreadCount} recent activity signal${unreadCount === 1 ? '' : 's'} attached to the support queue.`
          : 'Attendee cannot surface wallet ticket at entry.',
      action: 'Assign Door Staff',
      href: '/dashboard/events',
    },
    {
      id: 'support-refund',
      title: 'Refund eligibility check',
      event: eventNames[1] || eventNames[0] || 'Upcoming event',
      status: 'triage',
      severity: 'medium',
      detail: 'Participant asked for organizer review before payout closes.',
      action: 'Review Request',
      href: '/dashboard/events',
    },
    {
      id: 'support-safety',
      title: 'Safety follow-up',
      event: eventNames[2] || eventNames[0] || 'Recent event',
      status: 'waiting',
      severity: 'high',
      detail: 'Staff follow-up recommended before the next hosted event.',
      action: 'Open Support',
      href: '/dashboard/events',
    },
  ];

  const requests = baseQueue.slice(0, 4);
  return {
    statuses: SUPPORT_STATES.map((status) => ({
      status,
      count: requests.filter((request) => request.status === status).length,
    })),
    requests,
  };
}

export function listMarketingPipeline({ events = [], notifications = [] } = {}) {
  const upcoming = events
    .filter((event) => eventStatus(event) === 'upcoming' || eventStatus(event) === 'live')
    .slice(0, 3);
  const inviteActivity = notifications.filter((notification) => {
    const text = `${notification?.type || ''} ${notification?.title || ''} ${notification?.message || ''}`.toLowerCase();
    return text.includes('invite') || text.includes('ticket') || text.includes('event');
  }).length;

  const campaigns = upcoming.map((event, index) => ({
    id: `campaign-${event.id}`,
    title: `${event.name || 'Hosted event'} ${index === 0 ? 'last-call push' : 'audience reminder'}`,
    status: index === 0 ? 'scheduled' : 'draft',
    channel: index === 0 ? 'SMS + feed' : 'Email + discovery',
    detail: `${eventTimeLabel(event)} - ${soldTickets(event)} ticket${soldTickets(event) === 1 ? '' : 's'} sold`,
    action: index === 0 ? 'Check Schedule' : 'Continue Draft',
    href: '/dashboard/campaigns',
  }));

  if (campaigns.length === 0) {
    campaigns.push(
      {
        id: 'campaign-audience',
        title: 'Passport audience reactivation',
        status: 'draft',
        channel: 'Email + feed',
        detail: 'Saved segments are ready for a reactivation send.',
        action: 'Build Draft',
        href: '/dashboard/campaigns',
      },
      {
        id: 'campaign-discovery',
        title: 'Discovery ranking test',
        status: 'scheduled',
        channel: 'Discovery page',
        detail: 'Promote next public drop once an event is hosted.',
        action: 'Review Mix',
        href: '/dashboard/ads',
      }
    );
  }

  if (inviteActivity > 2) {
    campaigns.unshift({
      id: 'campaign-invite-followup',
      title: 'Invite follow-up window',
      status: 'active',
      channel: 'Push + in-app',
      detail: `${inviteActivity} invite or ticket signals available for targeting.`,
      action: 'Tune Audience',
      href: '/dashboard/audience?view=crm',
    });
  }

  const rows = campaigns.slice(0, 4);
  return {
    stages: CAMPAIGN_STATES.map((status) => ({
      status,
      count: rows.filter((campaign) => campaign.status === status).length,
    })),
    campaigns: rows,
  };
}

export function buildPayoutActionSummary(vendorDashboard) {
  const aggregates = vendorDashboard?.aggregates ?? {};
  const payouts = vendorDashboard?.payouts ?? [];
  const payments = vendorDashboard?.payments ?? [];
  const pendingPayouts = payouts.filter((payout) => String(payout?.status || '').toLowerCase() !== 'paid');
  const latestPayout = payouts[0];
  const netPayout = aggregates.netPayout ?? 0;

  return {
    netLabel: money(netPayout),
    grossLabel: money(aggregates.grossRevenue ?? 0),
    paymentsCount: payments.length,
    pendingCount: pendingPayouts.length,
    latest: latestPayout
      ? {
          id: latestPayout.id,
          amount: money(latestPayout.amount),
          status: latestPayout.status || 'pending',
          detail: latestPayout.stripePayoutId
            ? `Stripe - ${String(latestPayout.stripePayoutId).slice(-6)}`
            : 'Stripe payout',
        }
      : null,
    action:
      pendingPayouts.length > 0
        ? 'Resolve payout hold'
        : netPayout > 0
          ? 'Review payout history'
          : 'Connect revenue flow',
    href: '/dashboard/earnings',
  };
}

export function buildCommandCenterUpdates({ events = [], unreadCount = 0, vendorDashboard = null } = {}) {
  const now = Date.now();
  const upcoming = events
    .filter((event) => eventStatus(event, now) === 'live' || eventStatus(event, now) === 'upcoming')
    .sort((a, b) => toTime(a.startDate) - toTime(b.startDate));
  const nextEvent = upcoming[0];
  const netPayout = vendorDashboard?.aggregates?.netPayout ?? 0;
  const pendingPayouts = (vendorDashboard?.payouts ?? []).filter(
    (payout) => String(payout?.status || '').toLowerCase() !== 'paid'
  ).length;

  return [
    nextEvent
      ? {
          id: 'next-event',
          title: 'Next event is ready',
          detail: `${nextEvent.name || 'Hosted event'} · ${eventTimeLabel(nextEvent)}`,
          href: nextEvent.id ? `/dashboard/events/${nextEvent.id}` : '/dashboard/events',
          action: 'Open event',
          group: 'reminder',
        }
      : {
          id: 'next-event',
          title: 'Start the next drop',
          detail: 'Create a hosted event and Command Center will track sales, audience, and payout signals.',
          href: '/dashboard/events/new',
          action: 'Create event',
          group: 'reminder',
        },
    {
      id: 'audience-followup',
      title: unreadCount > 0 ? 'Unread updates waiting' : 'Audience follow-up',
      detail:
        unreadCount > 0
          ? `${unreadCount} update${unreadCount === 1 ? '' : 's'} need a quick pass.`
          : 'Build a segment from recent attendees before the next announcement.',
      href: unreadCount > 0 ? '/dashboard/notifications' : '/dashboard/audience',
      action: unreadCount > 0 ? 'Review' : 'Open audience',
      group: 'reminder',
    },
    {
      id: 'payouts',
      title: pendingPayouts > 0 ? 'Payout review' : 'Revenue snapshot',
      detail:
        pendingPayouts > 0
          ? `${pendingPayouts} payout${pendingPayouts === 1 ? '' : 's'} still pending.`
          : `${money(netPayout)} net earned across ticket activity.`,
      href: '/dashboard/earnings',
      action: 'View earnings',
      group: 'reminder',
    },
    {
      id: 'privacy-policy',
      title: 'Privacy policy refresh',
      detail: 'New privacy language is ready for organizer review before the next public drop.',
      href: '/privacy_policy',
      action: 'Read',
      group: 'product',
    },
    {
      id: 'new-features',
      title: 'New dashboard features',
      detail: 'Gallery controls, invite status, and campaign reporting are being tightened around the new glass UI.',
      href: '/dashboard/campaigns',
      action: 'Preview',
      group: 'product',
    },
    {
      id: 'pxi-response',
      title: 'PXI response queue',
      detail: 'Responses from PXI support and product will appear here alongside organizer reminders.',
      href: '/dashboard/notifications',
      action: 'Open',
      group: 'product',
    },
  ];
}
