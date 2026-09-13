# PXI Web Dashboard — Diplomat User Features

> **Access tier: Diplomat** — a Citizen who completed Stripe vendor verification. Can sell tickets, take payouts, and run events end-to-end.
> This is the highest user-facing tier. Diplomats have access to the full operations dashboard.

---

## How a Diplomat Is Created

A Citizen completes Stripe Connect onboarding (identity + banking verification). Their `isVendor` flag becomes `true`. They are now a Diplomat.

---

## Sidebar Navigation (Full Access)

Diplomats see the complete sidebar, organized into four sections:

### Hub
| Sidebar Item | Route | Description |
|---|---|---|
| **Command Center** | `/dashboard` | Full operations desk with live stats and event queue |
| **My Events** | `/dashboard/events` | All created, hosted, and attended events |

### Business
| Sidebar Item | Route | Description |
|---|---|---|
| **Earnings** | `/dashboard/earnings` | Revenue, payouts, costs, and profit |
| **Teams & Security** | `/dashboard/team` | Staff rosters, roles, and access control |

### People
| Sidebar Item | Route | Description |
|---|---|---|
| **CRM** | `/dashboard/audience` | Audience demographics, segments, and attendee management |
| **Ads Manager** | `/dashboard/ads` | Create and manage sponsored ad campaigns |
| **Email Campaigns** | `/dashboard/campaigns` | Draft, pay, and send emails to opted-in attendees |

### Intelligence
| Sidebar Item | Route | Description |
|---|---|---|
| **Analytics** | `/dashboard/analytics` | Per-event analytics with charts, funnels, and insights |
| **Live Operations** | `/dashboard/analytics?view=live-ops` | Real-time door scanning and headcount (appears when events are active) |
| **Venues** | `/dashboard/floor-plans` | Venue floor plans with heat maps |

---

## Tab-by-Tab Feature Breakdown

### 1. Command Center (`/dashboard`) — "Run the Room"

The Diplomat Command Center is the **VendorCommandCenter** — a full operations desk, completely different from the Partial/Citizen version.

#### Hero Section
- Title: "Run the room"
- Subtitle: "Live work, the next events, and the money — one read, no repeats."
- Two CTAs:
  - **"Create event"** button → `/dashboard/events/new`
  - **"See what moved the room"** link → `/dashboard/analytics`
- **Command Metrics Strip** — 4 headline stats:
  - **Net revenue** — total net earnings across all events
  - **Tickets sold** — total tickets sold across all events
  - **Turnout** — percentage of ticket holders who actually showed up (scanned at door)
  - **Live now** — number of currently active events

#### Revenue Trend Chart
- Area chart showing ticket sales revenue per day, last 30 days
- Interactive tooltip with daily revenue figure

#### Tickets Trend Chart
- Area chart showing tickets sold per day, last 30 days
- Interactive tooltip with daily ticket count

#### Upcoming + Live Section
- Grid of next 4 live or upcoming events
- Each event row shows:
  - Status dot (green=Live, amber=Upcoming)
  - Event name
  - Date
  - Revenue figure
  - Tickets sold count
- "View all" link → `/dashboard/events`

#### Urgent Notices Section
- Queue of customer help requests that need review
- Each notice shows:
  - Title (subject line)
  - Event name
  - Severity badge (high = red, medium = default)
  - Detail preview (2-line clamp)
  - Action link ("Review ticket" / "Continue review")
- Empty state: "No urgent notices. Customer requests and event issues will surface here when they need review."

#### Reminders Section
- Follow-up reminders based on event state and unread notifications
- Each reminder shows title, detail, and action link

#### "Only on PXI" Moat Band
Three feature cards highlighting PXI's competitive advantages:
1. **Where the room was alive** — floor plan heat maps + turnout verification → links to Venues
2. **Your crowd shot your marketing** — top media by reaction count + marketing kit → links to Analytics
3. **Guests you can prove came** — verified attendance (scanned, not self-reported) → links to CRM

#### Announcements
- Admin-authored announcement banners at the bottom
- Each shows: title, body text, optional CTA button (internal links only)
- Purple gradient accent bar on the left

---

### 2. My Events (`/dashboard/events`)

Full event management for Diplomats with all capabilities unlocked.

#### Features:
- **Status Filters** — All, Live, Upcoming, Past
- **Create Event** button → full event creation wizard
- **Search** — filter by event name
- **Pin to live** — pin live events for quick access
- **Per-event action menu**:
  - Edit event
  - View details
  - Invite attendees
  - Upload photos
  - Delete event

#### Create Event Flow (`/dashboard/events/new`) — Full Wizard
Diplomats have the complete creation form:
- **Event name** — required text input
- **Description** — long text
- **Cover image** — upload + crop tool (3:4 ratio, 1200×1600px, JPEG 80% quality)
- **Location** — Geoapify geocoder autocomplete with lat/lng
- **Venue name** — text field
- **Start date/time** — datetime-local picker
- **End date/time** — datetime-local picker
- **Recurrence** — optional recurring schedule
- **Spotify playlist URL** — optional playlist link
- **Passport stamp** — custom stamp image upload
- **Venue assignment** — pick from saved floor plans or create new
- **Team assignment** — assign team rosters
- **Door assignments** — assign staff to specific gates
- **Ticket Pricing** (Diplomat-exclusive):
  - Toggle free vs. paid
  - Multiple ticket tiers
  - Per-tier: name, price, quantity/capacity
  - Price validation
  - Fee preview: 5.49% consumer fee + $0.99 organizer flat fee
- **Co-hosts** — search users by username, add as co-hosts
- **Lineup** — add performers/artists with roles (80 char limit)

#### Event Detail View (`/dashboard/events/:id`)
Three sub-tabs:

**Details Tab:**
- Event summary card: name, description, cover image
- Status badge (Live/Upcoming/Draft/Ended)
- Date and location
- Quick stats: tickets sold, revenue, attendees
- Action links to edit, manage guests, analytics

**Members Tab:**
- Full attendee list
- Help request queue from attendees
  - Help request creation by attendees
  - Status management: Open → Reviewing → Resolved
  - Request types: Access issue, Safety/Security, General, Refund, Other
  - Organizer response and follow-up

**Configuration Tab:**
- Gallery mass upload section
  - Drag-and-drop photo upload
  - Bulk upload with progress bars
  - Upload to event gallery (R2 storage)

---

### 3. Earnings (`/dashboard/earnings`)

Full financial dashboard — the money page.

#### Hero Section
- Title: "Earnings"
- Huge headline figure: net profit (or net revenue, toggleable)
- Gross revenue alongside
- Retained percentage (how much of gross the organizer keeps)
- **SSE live connection status** — shows Connected/Connecting/Offline for real-time payment updates
- **Refresh button** — manually reload financial data
- **"Include costs" toggle** — switch to deduct logged event costs + marketing spend from headline number

#### Monthly Revenue Chart
- Bar/area chart showing gross and net revenue by month
- Interactive tooltip with gross and net per month
- X-axis: month labels (e.g., "Jun '26")

#### Revenue Breakdown Table
- Line items with title, value, and subheading:
  - **Total face value** (gross ticket revenue) — "What buyers paid for tickets, before any fees"
  - **Organizer flat fee** ($0.99/ticket) — "PXI's per-ticket platform fee"
  - **Net payout** — "Your take-home after the flat fee"
  - **Consumer service fee** (5.49%) — "Paid by the buyer, not deducted from your revenue"
  - **Stripe processing** — "Card processing costs absorbed by PXI"

#### Promo Credits Section
- Available ad/marketing credits balance
- Credit grant history
- Credits apply automatically before Stripe charges on campaigns and ads

#### Payouts Section
- List of Stripe payouts with:
  - Amount
  - Status (Paid, Failed, Pending)
  - Arrival date
  - Stripe payout ID

#### Per-Event Budget Panel
- Event selector dropdown
- Budget categories: Staff, Venue, Vendor, Marketing, Equipment, Other
- Add/edit/delete expense items
- Budget summary: total expenses, revenue, profit/loss per event

---

### 4. Teams & Security (`/dashboard/team`)

Staff roster management and access control.

#### Hero Section
- Title: "Teams & Security"
- Subtitle: "Build reusable rosters for doors, hosts, media, and event operations."
- Two summary tiles: Rosters count, People count

#### Features:
- **Create team roster** — name a new team
- **Roster tabs** — switch between multiple rosters
- **Add team member** — form fields:
  - Name
  - Email/contact
  - Username/handle
  - Role (dropdown: Event Staff, Door, Host, Media, Security, VIP Host, Manager)
- **Remove team member** — remove from roster
- **Rename roster** — edit roster name
- **Delete roster** — delete entire roster
- **Venue assignment** — assign rosters to specific venues/floor plans
- **Reusable across events** — rosters persist and can be assigned to multiple events

---

### 5. CRM / Audience (`/dashboard/audience`)

Audience intelligence and attendee relationship management.

#### "Your Real Audience" Overview Section
- Live demographics from API (not sample data)
- **Metric strip** (4 tiles):
  - Total attendees
  - Passport holders (Citizen-tier attendees)
  - Email reachable (opted into email marketing)
  - Repeat guests (percentage who came back for multiple events)

- **"What this means" narrative** — plain-language story of the numbers:
  - Age skew (e.g., "Your crowd skews 21-25")
  - Strongest city (e.g., "Miami is your strongest city (247 attendees)")
  - Email opt-in rate and reach
  - Repeat rate and loyalty assessment

- **Retention Funnel** — visual funnel chart:
  - All attendees → Passport holders → Repeat guests

- **Top Cities** — donut chart + list of top cities by attendee count
- **Age Brackets** — distribution chart of attendee ages

#### Attendee Table
- Paginated table of all attendees
- Columns: name, username, city, events attended, tier, email opt-in status
- Search/filter

#### Audience Segments
- **Create segment** — save a reusable audience filter
- **Segment criteria**: by event, by city, by tier, by repeat status
- **Save/edit/delete segments**
- **"Send campaign" chip** — deep-links to Email Campaigns with the segment pre-selected

---

### 6. Ads Manager (`/dashboard/ads`)

Promote events as sponsored content across the PXI platform.

#### Campaign List View
- Table of all ad campaigns with:
  - Campaign name
  - Status badge (Draft, Pending Payment, Scheduled, Active, Paused, Completed, Cancelled)
  - Event name
  - Start/end dates
  - Budget (in cents, displayed as USD)
  - Impressions, clicks, CTR
  - Per-surface breakdown of reach

#### Create Campaign Wizard
- **Step 1 — Event selection**: pick which event(s) to promote
- **Step 2 — Targeting**:
  - Age brackets (multi-select chips): 18-20, 21-24, 25-29, 30-34, 35+
  - XP tiers (multi-select chips): Wanderer, Seeker, Voyager, Pathfinder, Luminary, Odyssey
  - Reach estimate updates live as targeting changes
- **Step 3 — Surfaces & Intensity**:
  - Available ad surfaces (multi-select):
    - Mobile feed
    - Mobile discovery
    - Web discovery
    - Web featured hero
    - Email blast (optional add-on)
  - Per-surface intensity slider
  - Live price quote updates as surfaces/intensity change
- **Step 4 — Schedule**: start date, end date
- **Step 5 — Review & Pay**:
  - Campaign summary
  - Total price
  - Credits applied first, Stripe covers remainder
  - Stripe payment modal (StripePaymentModal component)

#### Campaign Performance View
- Per-campaign analytics:
  - Impressions over time (area chart)
  - Click-through rate
  - Per-surface breakdown
- Campaign actions:
  - Pause / Resume
  - Cancel

---

### 7. Email Campaigns (`/dashboard/campaigns`)

Draft, pay, and send emails to opted-in attendees.

#### Campaign List
- Table of past and current campaigns
- Status badges: Draft, Pending Payment, Sending, Sent, Failed, Cancelled
- Per-campaign: name, subject, audience, recipient count, price, sent date

#### Create Campaign
- **Campaign name** — text input
- **Channel selector** — Email or SMS (SMS has 320 char limit, Email has 10,000 char limit)
- **Subject line** — text input (email only)
- **Body** — text area with character counter
- **Audience selector** — dropdown:
  - ALL_PAST — all past attendees
  - By specific event
  - By saved segment (from CRM)
- **Deep-link from CRM** — `?segmentId=...` pre-selects a segment
- **Get quote** — fetches live recipient count and price
- **Price** — based on recipient count, credits applied first
- **Pay & Send** — Stripe payment modal, then campaign is sent
- **Consent enforcement** — server-side, only emails opted-in recipients

---

### 8. Analytics (`/dashboard/analytics`)

Per-event analytics deep dive with charts, funnels, and AI insights.

#### Event Timeline Picker
- Horizontal scrollable row of event cards (cover image + name)
- Select one or more events to analyze
- Cards show selection state with purple ring

#### Ticket Sales Velocity Chart
- **Daily tickets sold** — area chart with brand gradient
- **Cumulative total** — separate mini area chart beneath
- **Range toggle** — 1D, 1W, 1M, ALL
- **Pace note** — plain-language: "Selling X/day — at this pace, about Y sold by doors (Z days away)"
- **Stats strip**: Gross revenue, Net revenue, Total sold, Velocity (7-day avg)

#### Conversion Funnel
- Funnel chart: Impressions → Page views → Ticket purchases → Scanned at door
- Per-stage: count + conversion rate

#### Hype Through the Night
- **Engagement velocity chart** — stacked area chart by hour showing:
  - Chat messages
  - Reactions
  - Media captures (photos/videos)
- **Channel filter** — toggle: All activity, Chat, Reactions, Captures
- **Spike detection** — dots marking hours with statistically significant activity spikes
  - Note explaining what spikes might mean (a track, a shoutout, a drop)
- **Stat strip**: Hype score + tier label, Peak hour, Chat count, Reactions count, Captures count, Capture lag (or Comments)

#### Top Moments Gallery
- Grid of most-reacted media (photos/videos)
- Each card shows: thumbnail, author (@username), reaction count
- **Remove** button — host moderation to remove inappropriate content
- **Marketing Kit** button — open marketing kit modal

#### Marketing Kit Modal
- Selectable top moments
- Download options for marketing materials
- Curated content for social media

#### Marketing Panel
- Event marketing insights
- Engagement metrics
- Content performance

#### Insights Panel
- AI-generated insights about event performance
- Actionable recommendations

#### Venue Heat Map
- If a floor plan is attached: interactive heat map overlay
- Shows where activity was highest during the event
- Zone-by-zone engagement data

---

### 9. Live Operations (`/dashboard/analytics?view=live-ops` or `/dashboard/live-scan`)

Real-time event management console. Goes live during active events.

#### Features:

**Event Selector** — pick which live event to manage

**Capacity Indicator**
- Real-time: scanned count / capacity (or / sold)
- Percentage bar with fill animation
- "X% full" or "X% scanned"

**Ops Metrics** — 4-tile grid:
- Scanned (real-time)
- Sold (total)
- Turnout rate
- Flagged scans

**Scan Log**
- Real-time feed of ticket scans
- Each entry: attendee name/info, scan timestamp, state (Accepted/Flagged/Pending)
- Color-coded state chips

**Gate Management**
- Create new gates (named entry points)
- Rename/delete gates
- Assign staff members to gates
- View per-gate scan counts

**Announcements**
- Send real-time announcements to event staff
- Announcement modal

**SSE Live Connection**
- Server-Sent Events for real-time data
- Connection status indicator: Connected (green), Connecting (amber), Offline (gray)
- Auto-reconnect on drop

---

### 10. Venues / Floor Plans (`/dashboard/floor-plans`)

Venue management with floor plan creation and heat map visualization.

#### Features:

**Venue List**
- Grid of saved venues/floor plans
- Each card: venue name, location
- Create new, edit, delete actions

**Venue Wizard (Create/Edit)**
- Venue name
- Location (map-based with lat/lng)
- Floor plan upload or draw
- Zone definition
- Gate placement

**Heat Map Overlay**
- Activity heat map on the floor plan after events
- Shows where the crowd concentrated
- Zone-by-zone metrics

**Event Attachment**
- Attach a floor plan to an event
- Deep-link support: `?eventId=...` and `?seedLat=...&seedLng=...`

---

### 11. Account Settings (`/dashboard/account`)

Same as Citizen/Partial with fuller data:
- **Profile** tab — full profile editor + Spotify connect
- **Payouts** tab — real payout data: available balance, most recent payout, payout history
- **Usage** tab — marketing sends + ad boosts spend breakdown with donut charts
- **Account Controls** — delete account

---

### 12. Passport Page (`/dashboard/passport`)

Same as Citizen — passport card with Odyssey tier, XP, share link.

---

### 13. Notifications (`/dashboard/notifications`)

Same as Citizen/Partial — filter, read, accept/decline, hide.

---

## What Makes Diplomats Unique

| Feature | Partial | Citizen | Diplomat |
|---|---|---|---|
| Create free events | ✓ | ✓ | ✓ |
| Create paid events | ✗ | ✗ | ✓ |
| Sell tickets | ✗ | ✗ | ✓ |
| Take payouts | ✗ | ✗ | ✓ |
| Full Analytics | ✗ | ✗ | ✓ |
| CRM / Audience | ✗ | ✗ | ✓ |
| Ads Manager | ✗ | ✗ | ✓ |
| Email Campaigns | ✗ | ✗ | ✓ |
| Earnings page | ✗ | ✗ | ✓ |
| Teams & Security | ✗ | ✗ | ✓ |
| Venues / Floor Plans | ✗ | ✗ | ✓ |
| Live Operations (as owner) | ✗ | ✗ | ✓ |
| Live Operations (as bouncer) | ✗ | ✓* | ✓ |
| Marketing Kit | ✗ | ✗ | ✓ |
| Command Center (operations desk) | ✗ | ✗ | ✓ |
| Passport & XP | ✗ | ✓ | ✓ |

*Citizens can access Live Operations only when assigned as event staff by a Diplomat.
