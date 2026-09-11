# PXI Web Dashboard — Citizen User Features

> **Access tier: Citizen** — has the PXI mobile app installed, passport issued, but has NOT completed Stripe vendor verification.
> A Citizen is one step above Partial. They have a passport with stamps, Odyssey XP, and face-scan identity — but they cannot sell tickets or take payouts.

---

## How a Citizen Is Created

A Partial user installs the PXI mobile app and completes the passport issuance flow (face scan + identity creation). Their `isPassportIssued` flag becomes `true`. They are now a Citizen.

---

## Sidebar Navigation (What They See)

Citizens see only the **Hub** section of the sidebar, identical to Partials:

| Sidebar Item | Route | Description |
|---|---|---|
| **Command Center** | `/dashboard` | Onboarding/conversion page to become a Diplomat |
| **My Events** | `/dashboard/events` | Events they organized (free) or attended |

**Exception — Live Operations:** If a Citizen is added as **event staff (bouncer)** on someone else's event, the **Live Operations** sidebar item appears for them. This is the one vendor-only feature Citizens can access when granted bouncer permissions.

| Conditional Sidebar Item | Route | Condition |
|---|---|---|
| **Live Operations** | `/dashboard/analytics?view=live-ops` | Only if user has bouncer access on any event |

Everything else (Earnings, Teams & Security, CRM, Ads Manager, Email Campaigns, Analytics, Venues) stays hidden.

---

## Tab-by-Tab Feature Breakdown

### 1. Command Center (`/dashboard`)

Same as Partial users — the `MemberCommandCenter` — but the copy and steps adapt:

#### Key Differences from Partial:

**Hero Section**
- Title: "Unlock the host desk"
- Copy: "Your passport gets you in the room. Vendor setup turns this workspace into the desk you run it from."
- Metric tiles:
  - **Tier** → shows "Citizen"
  - **Next** → shows "Diplomat"
  - **Setup** → shows "Not started" or "In review"

**Step Ladder** — adapted for Citizens (they already have the app):
1. **Verify with Stripe** — "Identity and banking, 2–5 minutes."
2. **Publish paid events** — "Ticket tiers, capacity, and door rules."
3. **Run the room** — "Scanning, analytics, and payouts turn on."

All other sections are identical to the Partial version:
- "What vendor setup unlocks" — same 8 feature cards
- "What becomes achievable" — same 3 outcome cards
- CTA: "Start vendor setup" or "Continue vendor setup" → `/dashboard/vendor-upgrade`

---

### 2. My Events (`/dashboard/events`)

Identical to Partial user experience but Citizens may also see events where they served as staff (bouncer/co-host).

#### Features:
- **Status Filters** — segmented toggle: All, Live, Upcoming, Past
- **Hosted Events** — events the Citizen created (free events only — they cannot create paid events)
- **Attended Events** — events they purchased tickets to and attended
- **Event Cards** — cover image, name, date, location, status dot (green=Live, amber=Upcoming, zinc=Past/Draft)
- **Search** — filter events by name
- **Create Event** button — Citizens can create **free** events
- **"Pin to live"** — option to pin live events for quick access
- **Action menu per event** — contextual actions (edit, view details, delete, invite, upload photos)

#### Create Event Flow (`/dashboard/events/new`)
Full event creation wizard (same for Citizens and Diplomats):
- **Event name** — text input
- **Description** — rich text area
- **Cover image** — upload with crop tool (3:4 aspect ratio, 1200×1600px output)
- **Location** — Geoapify geocoder autocomplete (address search)
- **Venue name** — text input
- **Start date/time** and **End date/time** — datetime-local pickers
- **Recurrence** — optional recurring event setting
- **Spotify playlist URL** — optional, links a playlist to the event
- **Stamp image** — custom passport stamp design upload
- **Venue assignment** — pick from saved floor plans
- **Team assignment** — assign team rosters to the event
- **Door assignments** — assign staff to specific gates
- **Ticket pricing** (Diplomats only) — Citizens see this but cannot enable paid tickets
  - Ticket tiers, capacity limits, pricing
- **Co-hosts** — search and add co-hosts by username
- **Lineup** — add performers/DJs with roles (up to 80 chars per role)

#### Event Detail View (`/dashboard/events/:id`)
Three sub-tabs:
- **Details** — event summary, stats (tickets sold, revenue, attendance), status badge, date/location, cover image
- **Members** — attendee list with help request management
  - View attendee list, help requests from guests
  - Help request types: Access issue, Safety/Security, General, Refund, Other
  - Help request statuses: Open, Reviewing, Resolved
- **Configuration** — gallery mass upload, event settings
  - Mass upload photos to event gallery
  - Drag-and-drop or click-to-upload interface
  - Upload progress indicators

---

### 3. Live Operations (conditional — bouncer access only)

Route: `/dashboard/analytics?view=live-ops` or `/dashboard/live-scan`

This ONLY appears if the Citizen has been added as event staff (bouncer) by a Diplomat. When it does appear:

#### Features:
- **Event selector** — choose which live event to monitor
- **Live status indicator** — "Goes live during active events" when no events are active
- **Capacity indicator** — real-time: scanned / capacity (or scanned / sold), with percentage bar
- **Ops metrics** — 4 metric tiles:
  - Scanned (real-time scan count)
  - Sold (total tickets)
  - Turnout rate (%)
  - Flagged (problematic scans)
- **Scan log** — real-time feed of scan events showing:
  - Attendee name
  - Scan time
  - State chip: Accepted (green), Flagged (red), Pending
- **Gate management** — view/manage door gates
  - Create, rename, delete gates
  - Assign staff to gates
- **Announcements** — send announcements to event staff
- **SSE live connection** — real-time updates via Server-Sent Events
  - Connection status indicator: Connected/Connecting/Offline

---

### 4. Passport Page (`/dashboard/passport`)

Not a sidebar item — accessible via link. Shows the user's PXI passport.

#### Features:
- **Passport card** — visual passport component with:
  - User's avatar
  - Display name and username
  - Odyssey tier badge (Wanderer → Seeker → Voyager → Pathfinder → Luminary → Odyssey)
  - Odyssey XP progress
  - Passport level tracking
- **Passport level change tracking** — detects and reports when user crosses into a higher Odyssey band
- **Share profile link** — button to copy public profile URL (`/u/:userId`)
- **Relationship status** — shows friendship/connection status
- **iOS app download link** — prompts to download PXI if not installed

---

### 5. Account Settings (`/dashboard/account`)

Identical to Partial users — same three tabs:
- **Profile** — avatar, name, username, bio, city, Instagram, birthday, show age, email, Spotify connect
- **Payouts** — billing & payout info (minimal for Citizens)
- **Usage** — all-time usage & costs (minimal for Citizens)
- **Account Controls** — delete account

---

### 6. Vendor Upgrade (`/dashboard/vendor-upgrade`)

Same flow as Partials — this is where Citizens go to become Diplomats:
- Stripe Connect onboarding
- Benefits presentation
- Status checklist
- Outstanding Stripe requirements

---

### 7. Notifications (`/dashboard/notifications`)

Identical to Partial users:
- Filter: Unread / Read / All
- Types: friend requests, event invites, ticket confirmations, system messages
- Actions: read, accept/decline, hide
- Mark all as read
- Time-grouped sections

---

## What Citizens CANNOT Do

- Cannot see: Earnings, Analytics (full), CRM/Audience, Ads Manager, Email Campaigns, Teams & Security, Venues
- Cannot sell tickets (no Stripe verification)
- Cannot take payouts
- Cannot create paid events
- Cannot access marketing kit
- Cannot send email campaigns
- Cannot create/manage audience segments

## What Citizens CAN Do That Partials Cannot

- Have a passport with stamps
- Earn Odyssey XP and progress through levels (Wanderer → Odyssey)
- Get face-tagged in event albums
- Create free events
- Serve as event staff (bouncer) if assigned by a Diplomat
- Have a shareable public profile

---

## The Upgrade Path

```
Citizen → complete Stripe vendor verification → Diplomat
```

The Command Center drives this single remaining step.
