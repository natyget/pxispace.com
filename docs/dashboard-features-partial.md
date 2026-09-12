# PXI Web Dashboard — Partial User Features

> **Access tier: Partial** — web-only account, no passport issued, no mobile app installed.
> This is the lowest rung on the access ladder. A Partial signed up via email on the web and has never installed the PXI mobile app.

---

## How a Partial User Is Created

A Partial user registers through the website (email + password). They have **no** PXI mobile app, no passport, no face scan. Their `isPassportIssued` flag is `false`, and they have not completed Stripe verification.

---

## Sidebar Navigation (What They See)

Partial users see only the **Hub** section of the sidebar:

| Sidebar Item | Route | Description |
|---|---|---|
| **Command Center** | `/dashboard` | Their landing page (a pitch to upgrade, not an operations desk) |
| **My Events** | `/dashboard/events` | Events they have attended or been invited to |

Everything else in the sidebar — Earnings, Teams & Security, CRM, Ads Manager, Email Campaigns, Analytics, Live Operations, Venues — is **hidden**. If they type a vendor-only URL directly, they are bounced back to `/dashboard`.

---

## Tab-by-Tab Feature Breakdown

### 1. Command Center (`/dashboard`)

The Command Center for a Partial user is **NOT** the Diplomat operations desk. It is the `MemberCommandCenter` — a conversion/onboarding page that pitches them to become a Diplomat.

#### What they see:

**Hero Section**
- Page title: "Unlock the host desk"
- Descriptive copy: "You have a web account. The app issues your passport, and Stripe verification turns this workspace into the desk you run events from."
- Three summary metric tiles displayed in a row:
  - **Tier** → shows "Partial"
  - **Next** → shows "Citizen" (what they become after installing the app)
  - **Setup** → shows "Not started" or "In review" (Stripe vendor setup status)

**Vendor Setup Section** (prominent call-to-action)
- Title: "One setup, everything turns on"
- Description: explains that PXI verifies hosts through Stripe — identity and banking, once.
- Primary CTA button: "Start vendor setup" (or "Continue vendor setup" if already started) → links to `/dashboard/vendor-upgrade`
- Secondary link: "Back to my events" → links to `/dashboard/events`
- **Step Ladder** — numbered 1-2-3 list on the right:
  1. **Issue your passport** — "Install PXI on your phone — this makes you a Citizen."
  2. **Verify with Stripe** — "Identity and banking, 2–5 minutes."
  3. **Run the room** — "Sell tickets, scan the door, get paid."

**"What vendor setup unlocks" Section**
- Grid of 8 locked feature cards (icon + title + short description):
  - Analytics — "Sales, scans, and posted media per event."
  - Live Operations — "Door scanning and real-time headcount."
  - Venues — "Floor plans with live heat by zone."
  - CRM — "Your attendee list, saved as reusable segments."
  - Ads Manager — "Paid placements across the PXI feed."
  - Email Campaigns — "Send to opted-in attendees, consent handled."
  - Earnings — "Revenue, payouts, and receipts in one ledger."
  - Teams & Security — "Add door staff and co-hosts with scoped access."

**"What becomes achievable" Section**
- Three outcome cards:
  - **Charge for the door** — "Publish paid events and sell tickets natively — no third-party ticketing link."
  - **Get paid directly** — "Payouts land in your own bank account on Stripe's schedule, not ours."
  - **Keep the room** — "Everyone who attends becomes an audience you can segment and re-invite."
- Footer note: "Free events stay free to host. PXI charges a 5.49% consumer fee and a $0.99 organizer flat fee per ticket on paid transactions."

---

### 2. My Events (`/dashboard/events`)

This is the events list page. For a Partial user it shows:

#### Features:
- **Status Filters** — segmented toggle at the top: All, Live, Upcoming, Past
- **Attended Events Tab** — Partial users primarily see events they attended (purchased tickets to)
  - Each event card shows: cover image, event name, date/time, location, status badge (Live/Upcoming/Past/Ended)
- **Search** — search input to filter events by name
- **Event Cards** — clicking an event card navigates to the event detail view (`/dashboard/events/:id`)
- **Create Event** — a "Create event" button exists but creating paid events requires Diplomat status. Free event creation flows through the `/dashboard/events/new` route.

#### Event Detail View (`/dashboard/events/:id`)
When a Partial user clicks into an event they attended, they see the event detail page with tabs:
- **Details** — event name, description, date/time, location, cover image, ticket count, attendee count
- **Members** — attendee list for the event (if they have access as the organizer)
- **Configuration** — gallery upload and event settings

---

### 3. Account Settings (via sidebar account popover)

Accessible by clicking the account avatar at the bottom of the sidebar, then "Settings". Routes to `/dashboard/account`.

#### Tabs:

**Profile Tab** (`?tab=profile`)
- **Avatar upload** — upload/change profile photo (stored in R2)
- **Display name** — editable text field
- **Username** — editable with live availability check (shows Available/Taken/Invalid)
- **Bio** — text area, 280 character max
- **City** — typeahead picker from curated city list (not free text)
- **Instagram** — @handle field
- **Birthday** — date picker
- **Show age** — toggle switch to display age on profile
- **Email** — display only (not editable)
- **Save profile** button
- **Music Connections** — Spotify connect/disconnect card
  - Connect Spotify to power event match scores based on music taste
  - Shows connected status and top genres
  - Legacy Apple Music connections can be swapped to Spotify

**Payouts Tab** (`?tab=billing`)
- Shows billing & payout information
- For a Partial user with no vendor status: shows empty/minimal state
- Displays: available balance, most recent payout info

**Usage Tab** (`?tab=usage`)
- Shows all-time usage & costs
- Breakdown: Marketing sends spend, Ad boosts spend
- Donut chart visualization of spending
- For a Partial user: typically shows "No paid marketing or ad spend yet."

**Account Controls** (shown on every tab)
- **Delete My Account** button — triggers a confirmation flow
- Deletion warning lists everything that will be removed:
  - Profile, name, username, and avatar
  - All uploaded photos and videos
  - PXI Passport and digital identity
  - All biometric face data (FaceVector)
  - Event history, tickets, and scrapbooks
  - Odyssey points and activity feed
  - Stripe connection and payout history

---

### 4. Vendor Upgrade (`/dashboard/vendor-upgrade`)

This is the Stripe onboarding page. A Partial user can access it, but it's primarily useful after they become a Citizen.

#### Features:
- **Benefits list** — three cards: Sell tickets, Collect revenue, Secure verification
- **Stripe Connect flow** — button to start/continue Stripe identity verification
- **Status checklist** — shows charges enabled, payouts enabled status
- **Outstanding requirements** — lists any Stripe requirements still needed (name, DOB, SSN, bank account, etc.)
- **Stripe redirect** — opens Stripe's hosted onboarding in a new context

---

### 5. Notifications (`/dashboard/notifications`)

- Not in the sidebar navigation, but accessible via notification bell or direct URL
- **Filter toggle**: Unread / Read / All
- **Notification types**: friend requests, event invites, ticket confirmations, system messages
- **Actions per notification**: mark as read, accept/decline friend requests, accept/decline invites, hide notification
- **Mark all as read** button
- **Time-grouped sections**: Today, Yesterday, This Week, Earlier

---

## What Partials CANNOT Do

- Cannot see or access: Earnings, Analytics, CRM/Audience, Ads Manager, Email Campaigns, Teams & Security, Live Operations, Venues
- Cannot sell tickets (no Stripe verification)
- Cannot scan at the door
- No passport stamps or Odyssey XP
- No face-scan tagging in event albums
- No marketing kit access
- No floor plan heat maps

---

## The Upgrade Path

```
Partial → install PXI app → Citizen → complete Stripe verification → Diplomat
```

The entire Command Center is designed to drive this conversion.
