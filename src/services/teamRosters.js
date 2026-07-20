import { api } from './api';
import { eventsService } from './events';

const STORAGE_KEY = 'pxi.dashboard.teamRosters.v1';
const CREATE_EVENT_ASSIGNMENT_KEY = 'pxi.dashboard.createEventTeamAssignments.v1';

export const ROSTER_PERMISSION_OPTIONS = [
  { key: 'checkIn', label: 'Check-in', description: 'Scan tickets and mark arrivals.' },
  { key: 'guestList', label: 'Guest list', description: 'View attendee names and plus-ones.' },
  { key: 'entryDecisions', label: 'Entry decisions', description: 'Approve line, wristband, and re-entry calls.' },
  { key: 'eventEdit', label: 'Event edits', description: 'Adjust event details and timing.' },
  { key: 'teamManage', label: 'Team management', description: 'Invite staff and change roles.' },
  { key: 'announcements', label: 'Announcements', description: 'Send updates to attendees.' },
  { key: 'vipNotes', label: 'VIP notes', description: 'View table and guest handling notes.' },
  { key: 'mediaManage', label: 'Media', description: 'Review event photos and moments.' },
  { key: 'payoutView', label: 'Payout view', description: 'View payout status.' },
];

export const ROSTER_ROLE_OPTIONS = [
  {
    value: 'Co-host',
    label: 'Co-host',
    permissions: ['checkIn', 'guestList', 'eventEdit', 'teamManage', 'announcements', 'vipNotes'],
  },
  {
    value: 'Bouncer',
    label: 'Bouncer',
    permissions: ['checkIn', 'guestList', 'entryDecisions'],
  },
  {
    value: 'General Staff',
    label: 'General Staff',
    permissions: ['checkIn'],
  },
  {
    value: 'Door Host',
    label: 'Door Host',
    permissions: ['checkIn', 'guestList'],
  },
  {
    value: 'VIP Host',
    label: 'VIP Host',
    permissions: ['guestList', 'vipNotes'],
  },
  {
    value: 'Media',
    label: 'Media',
    permissions: ['mediaManage', 'announcements'],
  },
];

export const ROSTER_MEMBER_SUGGESTIONS = [
  { id: 'staff-maya', name: 'Maya Torres', handle: '@maya.torres', contact: '@maya.torres', role: 'Co-host' },
  { id: 'staff-dre', name: 'Dre Wilson', handle: '@dre.w', contact: '@dre.w', role: 'Bouncer' },
  { id: 'staff-ari', name: 'Ari Chen', handle: '@ari.shoots', contact: '@ari.shoots', role: 'Media' },
  { id: 'staff-cole', name: 'Cole Bennett', handle: '@cole.sec', contact: '@cole.sec', role: 'Bouncer' },
  { id: 'staff-nia', name: 'Nia Brooks', handle: '@nia.hosts', contact: '@nia.hosts', role: 'VIP Host' },
  { id: 'staff-luis', name: 'Luis Mateo', handle: '@luis.m', contact: '@luis.m', role: 'General Staff' },
];

const DEFAULT_ROSTERS = [
  {
    id: 'roster-summer-2025',
    name: 'Summer 2025 Crew',
    defaultRole: 'General Staff',
    rolePermissions: {
      'Co-host': ['checkIn', 'guestList', 'eventEdit', 'teamManage', 'announcements', 'vipNotes'],
      Bouncer: ['checkIn', 'guestList', 'entryDecisions'],
      'General Staff': ['checkIn'],
      'Door Host': ['checkIn', 'guestList'],
      'VIP Host': ['guestList', 'vipNotes'],
      Media: ['mediaManage', 'announcements'],
    },
    members: [
      {
        id: 'member-maya',
        name: 'Maya Torres',
        handle: '@maya.torres',
        contact: '@maya.torres',
        role: 'Co-host',
        inviteStatus: 'Ready',
        permissions: ['teamManage'],
        eventAssignmentIds: [],
      },
      {
        id: 'member-dre',
        name: 'Dre Wilson',
        handle: '@dre.w',
        contact: '@dre.w',
        role: 'Bouncer',
        inviteStatus: 'Ready',
        permissions: [],
        eventAssignmentIds: [],
      },
      {
        id: 'member-ari',
        name: 'Ari Chen',
        handle: '@ari.shoots',
        contact: '@ari.shoots',
        role: 'Media',
        inviteStatus: 'Invited',
        permissions: [],
        eventAssignmentIds: [],
      },
    ],
    eventAssignments: [],
  },
  {
    id: 'roster-saturday-door',
    name: 'Saturday Door Team',
    defaultRole: 'Bouncer',
    members: [
      {
        id: 'member-cole',
        name: 'Cole Bennett',
        handle: '@cole.sec',
        contact: '@cole.sec',
        role: 'Bouncer',
        inviteStatus: 'Ready',
        permissions: ['entryDecisions'],
        eventAssignmentIds: [],
      },
      {
        id: 'member-luis',
        name: 'Luis Mateo',
        handle: '@luis.m',
        contact: '@luis.m',
        role: 'Door Host',
        inviteStatus: 'Invited',
        permissions: [],
        eventAssignmentIds: [],
      },
    ],
    eventAssignments: [],
  },
  {
    id: 'roster-vip-floor',
    name: 'VIP Floor Staff',
    defaultRole: 'VIP Host',
    members: [
      {
        id: 'member-nia',
        name: 'Nia Brooks',
        handle: '@nia.hosts',
        contact: '@nia.hosts',
        role: 'VIP Host',
        inviteStatus: 'Ready',
        permissions: [],
        eventAssignmentIds: [],
      },
    ],
    eventAssignments: [],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function roleValues() {
  return ROSTER_ROLE_OPTIONS.map((role) => role.value);
}

function defaultRolePermissions() {
  return Object.fromEntries(ROSTER_ROLE_OPTIONS.map((role) => [role.value, [...role.permissions]]));
}

function uniquePermissions(permissions) {
  const allowed = new Set(ROSTER_PERMISSION_OPTIONS.map((permission) => permission.key));
  return Array.from(new Set((permissions || []).filter((permission) => allowed.has(permission))));
}

function normalizeRole(value) {
  const raw = String(value || '').trim();
  if (roleValues().includes(raw)) return raw;

  const lowered = raw.toLowerCase();
  if (lowered.includes('bouncer') || lowered.includes('security') || lowered.includes('scanner')) return 'Bouncer';
  if (lowered.includes('door')) return 'Door Host';
  if (lowered.includes('vip')) return 'VIP Host';
  if (lowered.includes('media') || lowered.includes('photo')) return 'Media';
  if (lowered.includes('host') || lowered.includes('lead')) return 'Co-host';
  return 'General Staff';
}

function normalizeRolePermissions(input = {}, fallbackPermissions = []) {
  const defaults = defaultRolePermissions();
  const source = input && typeof input === 'object' ? input : {};

  return Object.fromEntries(
    ROSTER_ROLE_OPTIONS.map((role) => {
      const permissions = source[role.value] || (role.value === 'General Staff' ? fallbackPermissions : undefined);
      return [role.value, uniquePermissions(permissions || defaults[role.value])];
    })
  );
}

function normalizeHandle(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('@') && !trimmed.startsWith('@')) return trimmed;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function normalizeMember(input = {}) {
  const inviteStatus = input.inviteStatus || input.assignmentStatus || 'Invited';
  const normalizedStatus = String(inviteStatus).toLowerCase();

  return {
    id: input.id || makeId('member'),
    name: String(input.name || '').trim(),
    handle: normalizeHandle(input.handle),
    contact: String(input.contact || '').trim(),
    role: normalizeRole(input.role),
    inviteStatus: normalizedStatus.startsWith('draf') || normalizedStatus === 'needs invite' ? 'Invited' : inviteStatus,
    permissions: uniquePermissions(input.permissions),
    eventAssignmentIds: Array.from(new Set((input.eventAssignmentIds || []).map(String).filter(Boolean))),
  };
}

function normalizeAssignment(input = {}) {
  const eventId = String(input.eventId || input.eventAssignmentId || '').trim();

  return {
    id: input.id || makeId('assignment'),
    eventId,
    memberIds: Array.from(new Set((input.memberIds || []).map(String).filter(Boolean))),
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

function normalizeVenueIds(venueIds) {
  return Array.from(new Set((venueIds || []).map(String).filter(Boolean)));
}

function normalizeRoster(input = {}) {
  const fallbackPermissions = uniquePermissions(input.permissions);
  const oldEventAssignmentId = String(input.eventAssignmentId || '').trim();
  const eventAssignments = Array.isArray(input.eventAssignments)
    ? input.eventAssignments.map(normalizeAssignment).filter((assignment) => assignment.eventId)
    : [];

  if (oldEventAssignmentId && !eventAssignments.some((assignment) => assignment.eventId === oldEventAssignmentId)) {
    eventAssignments.push(normalizeAssignment({ eventId: oldEventAssignmentId }));
  }

  return {
    id: input.id || makeId('roster'),
    name: String(input.name || 'Untitled Team').trim() || 'Untitled Team',
    defaultRole: normalizeRole(input.defaultRole),
    rolePermissions: normalizeRolePermissions(input.rolePermissions, fallbackPermissions),
    members: Array.isArray(input.members) ? input.members.map(normalizeMember) : [],
    eventAssignments,
    // Venues (FloorPlan) this team is attached to — pure client-side many-to-many,
    // no backend migration needed since dataJson is opaque JSON.
    venueIds: normalizeVenueIds(input.venueIds),
  };
}

function readRosters() {
  if (!canUseLocalStorage()) return clone(DEFAULT_ROSTERS.map(normalizeRoster));

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = DEFAULT_ROSTERS.map(normalizeRoster);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return clone(defaults);
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeRoster) : clone(DEFAULT_ROSTERS.map(normalizeRoster));
  } catch {
    return clone(DEFAULT_ROSTERS.map(normalizeRoster));
  }
}

function writeRosters(rosters) {
  const normalized = rosters.map(normalizeRoster);
  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  // Write-through to the backend (fire-and-forget; localStorage stays the
  // offline cache so the UI never blocks on the network).
  api.put('/api/team/rosters', { rosters: normalized }).catch(() => {
    /* offline / logged out — server copy syncs on next successful save */
  });
  return clone(normalized);
}

/**
 * Read-through server sync: replaces the local cache with the server's rosters
 * when available. Falls back to the local cache (and its defaults) offline.
 */
async function syncRostersFromServer() {
  try {
    const data = await api.get('/api/team/rosters');
    if (Array.isArray(data?.rosters)) {
      const normalized = data.rosters.map(normalizeRoster);
      if (canUseLocalStorage()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
      return clone(normalized);
    }
  } catch {
    /* offline / logged out */
  }
  return null;
}

function updateRosterList(rosterId, updater) {
  const rosters = readRosters();
  const next = rosters.map((roster) => (roster.id === rosterId ? normalizeRoster(updater(roster)) : roster));
  return writeRosters(next).find((roster) => roster.id === rosterId) || null;
}

function normalizeCreateEventAssignment(input = {}) {
  return {
    rosterId: String(input.rosterId || '').trim(),
    memberIds: Array.from(new Set((input.memberIds || []).map(String).filter(Boolean))),
  };
}

function readCreateEventAssignments() {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CREATE_EVENT_ASSIGNMENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeCreateEventAssignment).filter((assignment) => assignment.rosterId)
      : [];
  } catch {
    return [];
  }
}

export async function listTeamRosters() {
  const fromServer = await syncRostersFromServer();
  if (fromServer) return fromServer;
  return readRosters();
}

export async function deleteTeamRoster(rosterId) {
  const rosters = readRosters().filter((roster) => roster.id !== rosterId);
  writeRosters(rosters);
  return clone(rosters);
}

export async function createTeamRoster(input = {}) {
  const rosters = readRosters();
  const roster = normalizeRoster({
    name: input.name,
    defaultRole: input.defaultRole || 'General Staff',
    members: input.members || [],
    rolePermissions: input.rolePermissions,
    eventAssignments: [],
  });

  writeRosters([roster, ...rosters]);
  return clone(roster);
}

export async function updateTeamRoster(rosterId, updates = {}) {
  const updated = updateRosterList(rosterId, (roster) =>
    normalizeRoster({
      ...roster,
      ...updates,
      id: roster.id,
      members: updates.members ?? roster.members,
      rolePermissions: updates.rolePermissions ?? roster.rolePermissions,
      eventAssignments: updates.eventAssignments ?? roster.eventAssignments,
      venueIds: updates.venueIds ?? roster.venueIds,
    })
  );
  return clone(updated);
}

export async function updateRosterRolePermissions(rosterId, role, permissions = []) {
  const safeRole = normalizeRole(role);
  const updated = updateRosterList(rosterId, (roster) => ({
    ...roster,
    rolePermissions: {
      ...roster.rolePermissions,
      [safeRole]: uniquePermissions(permissions),
    },
  }));
  return clone(updated);
}

/** Attach/detach venues (FloorPlan) to a roster — many-to-many via the roster's own venueIds. */
export async function setRosterVenues(rosterId, venueIds = []) {
  const updated = updateRosterList(rosterId, (roster) => ({
    ...roster,
    venueIds: normalizeVenueIds(venueIds),
  }));
  return clone(updated);
}

export async function addRosterMember(rosterId, member) {
  const updated = updateRosterList(rosterId, (roster) => ({
    ...roster,
    members: [
      ...roster.members,
      normalizeMember({
        role: roster.defaultRole,
        inviteStatus: 'Invited',
        ...member,
      }),
    ],
  }));
  return clone(updated);
}

export async function updateRosterMember(rosterId, memberId, updates = {}) {
  const updated = updateRosterList(rosterId, (roster) => ({
    ...roster,
    members: roster.members.map((member) =>
      member.id === memberId
        ? normalizeMember({
            ...member,
            ...updates,
            id: member.id,
            permissions: updates.permissions ?? member.permissions,
            eventAssignmentIds: updates.eventAssignmentIds ?? member.eventAssignmentIds,
          })
        : member
    ),
  }));
  return clone(updated);
}

export async function removeRosterMember(rosterId, memberId) {
  const updated = updateRosterList(rosterId, (roster) => ({
    ...roster,
    members: roster.members
      .filter((member) => member.id !== memberId)
      .map((member) => ({
        ...member,
        eventAssignmentIds: member.eventAssignmentIds.filter((eventId) =>
          roster.eventAssignments.some(
            (assignment) =>
              assignment.eventId === eventId &&
              (assignment.memberIds.length === 0 || assignment.memberIds.includes(member.id))
          )
        ),
      })),
    eventAssignments: roster.eventAssignments.map((assignment) => ({
      ...assignment,
      memberIds: assignment.memberIds.filter((id) => id !== memberId),
    })),
  }));
  return clone(updated);
}

/** Roster roles -> real backend staff-invite roles (event.routes.ts only knows co-host/bouncer/featured_talent). */
function staffInviteRoleForRosterRole(role) {
  if (role === 'Co-host') return 'co-host';
  return 'bouncer'; // Bouncer, Door Host, General Staff, VIP Host, Media all map to floor/door staff today.
}

export async function assignRosterToEvent(rosterId, eventId, options = {}) {
  const safeEventId = String(eventId || '').trim();
  if (!safeEventId) {
    return { roster: null, assignment: null, message: 'Choose an event first.' };
  }

  const requestedMemberIds = Array.from(new Set((options.memberIds || []).map(String).filter(Boolean)));
  const updated = updateRosterList(rosterId, (roster) => {
    const rosterMemberIds = new Set(roster.members.map((member) => member.id));
    const memberIds = requestedMemberIds.filter((memberId) => rosterMemberIds.has(memberId));
    const existing = roster.eventAssignments.find((assignment) => assignment.eventId === safeEventId);
    const assignment = normalizeAssignment({
      id: existing?.id,
      eventId: safeEventId,
      memberIds,
    });

    return {
      ...roster,
      eventAssignments: [
        assignment,
        ...roster.eventAssignments.filter((current) => current.eventId !== safeEventId),
      ],
      members: roster.members.map((member) => {
        const assignedByTeam = memberIds.length === 0;
        const assignedByMember = memberIds.includes(member.id);
        const withoutEvent = member.eventAssignmentIds.filter((currentEventId) => currentEventId !== safeEventId);

        return {
          ...member,
          eventAssignmentIds: assignedByTeam || assignedByMember ? [safeEventId, ...withoutEvent] : withoutEvent,
        };
      }),
    };
  });

  const assignment = updated?.eventAssignments.find((current) => current.eventId === safeEventId) || null;

  // Roster assignment itself is local (this address book spans events and isn't backend-tracked),
  // but assigning members to a *specific* event is a real staff decision — attempt a real
  // POST /api/events/:id/staff invite for each assigned member with a PXI @username. Best-effort:
  // members without a linked username (e.g. added by name/email only) are skipped, not faked.
  const assignedMembers = updated
    ? updated.members.filter((member) => member.eventAssignmentIds.includes(safeEventId) && member.handle)
    : [];
  const invited = [];
  const failed = [];
  for (const member of assignedMembers) {
    const username = member.handle.replace(/^@/, '');
    try {
      await eventsService.inviteStaff(safeEventId, username, staffInviteRoleForRosterRole(member.role));
      invited.push(username);
    } catch (err) {
      failed.push({ username, error: err?.message || 'Invite failed' });
    }
  }

  return {
    roster: clone(updated),
    assignment: clone(assignment),
    message: 'Assignment saved.',
    staffInvites: { invited, failed },
  };
}

export async function listTeamAssignments() {
  return readRosters().flatMap((roster) =>
    roster.eventAssignments.map((assignment) => ({
      ...assignment,
      rosterId: roster.id,
      rosterName: roster.name,
      members: assignment.memberIds.length
        ? roster.members.filter((member) => assignment.memberIds.includes(member.id))
        : roster.members,
    }))
  );
}

export async function listTeamAssignmentsForEvent(eventId) {
  const safeEventId = String(eventId || '').trim();
  if (!safeEventId) return [];
  const assignments = await listTeamAssignments();
  return assignments.filter((assignment) => assignment.eventId === safeEventId);
}

export async function getCreateEventTeamAssignments() {
  return readCreateEventAssignments();
}

export async function setCreateEventTeamAssignments(assignments = []) {
  const normalized = assignments.map(normalizeCreateEventAssignment).filter((assignment) => assignment.rosterId);
  if (canUseLocalStorage()) {
    window.localStorage.setItem(CREATE_EVENT_ASSIGNMENT_KEY, JSON.stringify(normalized));
  }
  return clone(normalized);
}

export async function clearCreateEventTeamAssignments() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(CREATE_EVENT_ASSIGNMENT_KEY);
  }
  return [];
}

export async function searchRosterMemberSuggestions(query = '', rosterId = '') {
  const trimmed = String(query || '').trim().toLowerCase();
  if (!trimmed) return [];

  const rosters = readRosters();
  const roster = rosters.find((candidate) => candidate.id === rosterId);
  const existing = new Set((roster?.members || []).flatMap((member) => [member.handle, member.contact]).filter(Boolean));

  return ROSTER_MEMBER_SUGGESTIONS.filter((person) => {
    if (existing.has(person.handle) || existing.has(person.contact)) return false;
    return [person.name, person.handle, person.contact, person.role].some((value) =>
      String(value || '').toLowerCase().includes(trimmed)
    );
  });
}
