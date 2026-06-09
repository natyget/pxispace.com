const STORAGE_KEY = 'pxi_help_requests_v1';

export const HELP_REQUEST_TYPES = [
  { value: 'refund', label: 'Refund' },
  { value: 'contact-organizer', label: 'Contact organizer' },
  { value: 'access-issue', label: 'Access issue' },
  { value: 'safety-security', label: 'Safety / security' },
  { value: 'other', label: 'Other' },
];

export const HELP_REQUEST_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
];

const memoryStore = [];

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function readStoredRequests() {
  if (!canUseStorage()) return [...memoryStore];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredRequests(requests) {
  if (!canUseStorage()) {
    memoryStore.splice(0, memoryStore.length, ...requests);
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    /* local persistence is best-effort */
  }
}

function normalizeRequest(input = {}) {
  const now = new Date().toISOString();
  return {
    id: input.id || `help_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    eventId: input.eventId ? String(input.eventId) : '',
    eventName: input.eventName || 'Event',
    ticketId: input.ticketId || null,
    requesterId: input.requesterId ? String(input.requesterId) : '',
    requesterName: input.requesterName || 'PXI attendee',
    requesterEmail: input.requesterEmail || '',
    type: HELP_REQUEST_TYPES.some((item) => item.value === input.type) ? input.type : 'other',
    subject: input.subject || 'Help request',
    message: input.message || '',
    status: HELP_REQUEST_STATUSES.some((item) => item.value === input.status) ? input.status : 'open',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

function eventIdsFrom(events = []) {
  return new Set(events.map((event) => String(event.id)).filter(Boolean));
}

export const helpRequestsService = {
  async listMyHelpRequests({ userId, eventId } = {}) {
    const uid = userId ? String(userId) : '';
    const eid = eventId ? String(eventId) : '';
    return readStoredRequests()
      .filter((request) => (!uid || request.requesterId === uid) && (!eid || request.eventId === eid))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createHelpRequest(payload = {}) {
    const requests = readStoredRequests();
    const request = normalizeRequest(payload);
    writeStoredRequests([request, ...requests]);
    return request;
  },

  async listOrganizerHelpRequests({ events = [], eventId, status } = {}) {
    const eventIds = eventIdsFrom(events);
    const eid = eventId ? String(eventId) : '';
    return readStoredRequests()
      .filter((request) => {
        const matchesEvent = eid ? request.eventId === eid : eventIds.size === 0 || eventIds.has(request.eventId);
        const matchesStatus = status && status !== 'all' ? request.status === status : true;
        return matchesEvent && matchesStatus;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  },

  async updateHelpRequestStatus(requestId, status) {
    if (!HELP_REQUEST_STATUSES.some((item) => item.value === status)) {
      throw new Error('Unsupported help request status.');
    }
    const requests = readStoredRequests();
    const nextRequests = requests.map((request) => (
      request.id === requestId
        ? { ...request, status, updatedAt: new Date().toISOString() }
        : request
    ));
    writeStoredRequests(nextRequests);
    return nextRequests.find((request) => request.id === requestId) || null;
  },
};
