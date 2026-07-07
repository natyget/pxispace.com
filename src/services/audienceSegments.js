const SEGMENTS_STORAGE_KEY = 'pxi_audience_segment_drafts';
const CAMPAIGN_DRAFTS_STORAGE_KEY = 'pxi_campaign_drafts_v1';

export const BEHAVIOR_STAMPS = [
  'Scene Staple',
  'Content Creator',
  'High Roller',
  'Regular',
  'Loyalist',
  'Community Voice',
  'Connector',
  'Organizer',
];

const INVITE_LABELS = {
  ALBUM_INVITE: 'Album invite',
  STAFF_INVITE: 'Staff invite',
  LINEUP_INVITE: 'Lineup invite',
};

const STAMP_TIERS = [
  { label: 'Platinum', min: 15000 },
  { label: 'Gold', min: 7000 },
  { label: 'Silver', min: 2500 },
  { label: 'Bronze', min: 0 },
];

function readStorage(key, fallback = []) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures should not break CRM rendering.
  }
  return value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function soldTickets(event) {
  return Math.max(0, Number(event?._count?.tickets) || 0);
}

function eventPrice(event) {
  const price = Number(event?.ticketPrice ?? event?.priceUsd ?? 0);
  return event?.ticketType === 'PAID' || price > 0 ? Math.max(0, price) : 0;
}

function isPastEvent(event) {
  const status = String(event?.status || '').toLowerCase();
  if (['ended', 'past', 'completed', 'archived'].includes(status)) return true;
  const start = event?.endDate || event?.startDate;
  return start ? new Date(start).getTime() < Date.now() : false;
}

function responseState(notification) {
  const response = String(notification?.data?.inviteResponse || '').toLowerCase();
  if (response === 'accepted' || notification?.data?.acceptedAt) return 'Accepted';
  if (response === 'declined') return 'Declined';
  return 'Pending';
}

function stampTier(score) {
  return STAMP_TIERS.find((tier) => score >= tier.min)?.label || 'Bronze';
}

function formatIndex(index) {
  return String(index + 1).padStart(2, '0');
}

function rowBase({ id, audienceName, sourceEvent, pricePaid, odysseyScore, engagementIndex, stampTypes, eventsAttendedCount, inviteState, rowType }) {
  return {
    id,
    audienceName,
    sourceEvent,
    pricePaid: Number(pricePaid.toFixed(2)),
    odysseyScore,
    engagementIndex: clamp(Math.round(engagementIndex), 0, 100),
    stampTypes: stampTypes.filter((stamp) => BEHAVIOR_STAMPS.includes(stamp)),
    stampTier: stampTier(odysseyScore),
    eventsAttendedCount: Math.max(0, Math.round(eventsAttendedCount)),
    inviteState,
    rowType,
  };
}

function buildEventRows(event, index) {
  const eventId = event?.id || `event-${index}`;
  const title = event?.name || `Hosted event ${formatIndex(index)}`;
  const tickets = soldTickets(event);
  const price = eventPrice(event);
  const past = isPastEvent(event);
  const baselineScore = 420 + tickets * 24 + Math.round(price * 18);
  const engagement = clamp(46 + tickets * 2 + (past ? 12 : 4), 35, 96);
  const eventAttendanceCount = past ? clamp(1 + Math.floor(tickets / 35) + (index % 3), 1, 18) : clamp(Math.floor(tickets / 28), 0, 12);

  return [
    rowBase({
      id: `${eventId}-paid-buyers`,
      audienceName: `${title} paid buyers`,
      sourceEvent: title,
      pricePaid: price,
      odysseyScore: baselineScore,
      engagementIndex: engagement,
      stampTypes: price >= 75 ? ['High Roller', 'Scene Staple'] : ['Regular', 'Scene Staple'],
      eventsAttendedCount: eventAttendanceCount,
      inviteState: 'Converted',
      rowType: 'Ticket holders',
    }),
    rowBase({
      id: `${eventId}-passport-engagers`,
      audienceName: `${title} passport engagers`,
      sourceEvent: title,
      pricePaid: Math.max(0, price * 0.6),
      odysseyScore: baselineScore + 1180,
      engagementIndex: engagement + 10,
      stampTypes: ['Content Creator', past ? 'Community Voice' : 'Connector'],
      eventsAttendedCount: eventAttendanceCount + 1,
      inviteState: 'Organic',
      rowType: 'Engaged Passport',
    }),
    rowBase({
      id: `${eventId}-vip-table-prospects`,
      audienceName: `${title} VIP/table prospects`,
      sourceEvent: title,
      pricePaid: Math.max(price * 2, price >= 50 ? price : 50),
      odysseyScore: baselineScore + 3200,
      engagementIndex: engagement + 4,
      stampTypes: ['High Roller', 'Loyalist', 'Connector'],
      eventsAttendedCount: eventAttendanceCount + 2,
      inviteState: 'Warm',
      rowType: 'Premium buyers',
    }),
  ];
}

function notificationName(notification, index) {
  const data = notification?.data || {};
  return (
    data.inviteeName ||
    data.recipientName ||
    data.username ||
    data.inviteeUsername ||
    data.email ||
    `Invite recipient ${formatIndex(index)}`
  );
}

function notificationEvent(notification) {
  const data = notification?.data || {};
  return data.eventName || data.albumName || data.title || 'Passport invite';
}

function buildInviteRow(notification, index) {
  const state = responseState(notification);
  const inviteType = INVITE_LABELS[notification?.type] || 'Direct invite';
  const acceptedBoost = state === 'Accepted' ? 1650 : state === 'Pending' ? 720 : 260;
  const engagement = state === 'Accepted' ? 82 : state === 'Pending' ? 54 : 28;

  return rowBase({
    id: `invite-${notification?.id || index}`,
    audienceName: notificationName(notification, index),
    sourceEvent: notificationEvent(notification),
    pricePaid: Number(notification?.data?.ticketPrice ?? 0),
    odysseyScore: 680 + acceptedBoost + index * 37,
    engagementIndex: engagement,
    stampTypes: [state === 'Accepted' ? 'Connector' : 'Regular', inviteType === 'Staff invite' ? 'Organizer' : 'Community Voice'],
    eventsAttendedCount: state === 'Accepted' ? 1 : 0,
    inviteState: state,
    rowType: 'Invite pipeline',
  });
}

export function buildAudienceRows(events = [], notifications = []) {
  const eventRows = events.flatMap((event, index) => buildEventRows(event, index));
  const inviteRows = notifications
    .filter((item) => Object.hasOwn(INVITE_LABELS, item?.type))
    .map((item, index) => buildInviteRow(item, index));

  if (eventRows.length || inviteRows.length) {
    return [...eventRows, ...inviteRows];
  }

  return [
    rowBase({
      id: 'seed-passport-regulars',
      audienceName: 'Passport regulars',
      sourceEvent: 'Seed segment',
      pricePaid: 35,
      odysseyScore: 4280,
      engagementIndex: 76,
      stampTypes: ['Regular', 'Content Creator'],
      eventsAttendedCount: 4,
      inviteState: 'Organic',
      rowType: 'Engaged Passport',
    }),
    rowBase({
      id: 'seed-vip-table-buyers',
      audienceName: 'VIP/table buyers',
      sourceEvent: 'Seed segment',
      pricePaid: 120,
      odysseyScore: 11200,
      engagementIndex: 84,
      stampTypes: ['High Roller', 'Loyalist'],
      eventsAttendedCount: 7,
      inviteState: 'Warm',
      rowType: 'Premium buyers',
    }),
  ];
}

export function listAudienceSegments() {
  return readStorage(SEGMENTS_STORAGE_KEY, []);
}

export function deleteAudienceSegment(segmentId) {
  const current = listAudienceSegments();
  return writeStorage(SEGMENTS_STORAGE_KEY, current.filter((item) => item.id !== segmentId));
}

export function saveAudienceSegment(segment) {
  const current = listAudienceSegments();
  const id = segment.id || `segment-${Date.now()}`;
  const saved = {
    ...segment,
    id,
    savedAt: new Date().toISOString(),
  };
  const next = [saved, ...current.filter((item) => item.id !== id)].slice(0, 12);
  return writeStorage(SEGMENTS_STORAGE_KEY, next);
}

export function exportSegmentToCampaignDraft(segment) {
  const current = readStorage(CAMPAIGN_DRAFTS_STORAGE_KEY, []);
  const rowCount = Number(segment.rowCount || segment.rowIds?.length || 0);
  const draft = {
    id: `draft-audience-${Date.now()}`,
    source: 'audience-crm',
    title: `${segment.name || 'Audience segment'} campaign draft`,
    audience: rowCount === 1 ? '1 selected audience row' : `${rowCount} selected audience rows`,
    status: 'draft',
    stage: 'Segment draft',
    schedule: 'Next best send window',
    updatedAt: new Date().toISOString(),
    mix: {
      sms: true,
      email: true,
      feedPosts: true,
      discoveryRanking: false,
      budget: 300,
    },
    insights: [
      'Selected CRM rows are ready for a targeted campaign.',
      'Use SMS for urgent reminders and email/feed posts for richer context.',
    ],
    segment: {
      ...segment,
      rowCount,
    },
  };
  writeStorage(CAMPAIGN_DRAFTS_STORAGE_KEY, [draft, ...current].slice(0, 12));
  return draft;
}
