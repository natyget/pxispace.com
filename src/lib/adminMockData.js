export const adminMockStats = {
    users: { partial: 124, citizen: 912, vendor: 146, admin: 9 },
    events: { pending: 22, upcoming: 71, ended: 504 },
    reports: { pending: 7, cancel: 12, accepted: 39 },
};

export const adminMockUsers = [
    { id: 'u1', email: 'host1@pxispace.com', username: 'hostalpha', accountTier: 'CITIZEN', isVendor: true, isVerified: true, createdAt: '2026-04-03T16:04:00.000Z' },
    { id: 'u2', email: 'citizen2@example.com', username: 'citynights', accountTier: 'CITIZEN', isVendor: false, isVerified: true, createdAt: '2026-04-08T20:18:00.000Z' },
    { id: 'u3', email: 'bouncer3@example.com', username: 'gatekeeper', accountTier: 'CITIZEN', isVendor: false, isVerified: true, createdAt: '2026-04-14T12:22:00.000Z' },
    { id: 'u4', email: 'organizer4@pxispace.com', username: 'pulseadmin', accountTier: 'CITIZEN', isVendor: true, isVerified: true, createdAt: '2026-04-17T09:37:00.000Z' },
];

export const adminMockEvents = [
    {
        id: 'e1',
        name: 'Downtown Rooftop Session',
        startDate: '2026-05-23T21:00:00.000Z',
        endDate: '2026-05-24T03:00:00.000Z',
        status: 'UPCOMING',
        visibility: 'PUBLIC',
        creator: { email: 'host1@pxispace.com' },
        location: 'Hudson Rooftop',
    },
    {
        id: 'e2',
        name: 'Passport Night Pop-up',
        startDate: '2026-05-11T00:00:00.000Z',
        endDate: '2026-05-11T05:00:00.000Z',
        status: 'ENDED',
        visibility: 'PRIVATE',
        creator: { email: 'organizer4@pxispace.com' },
        location: 'Lower East Side',
    },
];

export const adminMockReports = [
    {
        id: 'r1',
        status: 'PENDING',
        reporter: { email: 'citizen2@example.com' },
        reporterId: 'u2',
        targetType: 'EVENT',
        targetId: 'e1',
        reason: 'Ticket screenshot appears duplicated at gate check.',
        createdAt: '2026-05-13T23:12:00.000Z',
    },
    {
        id: 'r2',
        status: 'RESOLVED',
        reporter: { email: 'host1@pxispace.com' },
        reporterId: 'u1',
        targetType: 'USER',
        targetId: 'u3',
        reason: 'Resolved after identity verification by staff.',
        createdAt: '2026-05-10T21:45:00.000Z',
    },
];

export const adminMockUgcReports = [
    {
        id: 'ugc-1',
        status: 'PENDING',
        severity: 'CRITICAL',
        reason: 'Explicit nudity',
        reporterCount: 6,
        eventName: 'Passport Night Pop-up',
        author: '@nightpulse',
        createdAt: '2026-05-15T20:16:00.000Z',
    },
    {
        id: 'ugc-2',
        status: 'PENDING',
        severity: 'HIGH',
        reason: 'Hate symbol visible in frame',
        reporterCount: 4,
        eventName: 'Downtown Rooftop Session',
        author: '@gateside',
        createdAt: '2026-05-15T19:45:00.000Z',
    },
    {
        id: 'ugc-3',
        status: 'RESOLVED',
        severity: 'HIGH',
        reason: 'Underage alcohol content',
        reporterCount: 3,
        eventName: 'Afterhours Test Event',
        author: '@clipdrop',
        createdAt: '2026-05-14T23:10:00.000Z',
    },
];
