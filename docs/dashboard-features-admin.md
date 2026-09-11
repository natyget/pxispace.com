# PXI Web Dashboard — Admin Features

> **Access tier: Admin** — platform-level staff role. An admin is also whatever user tier their account has earned (Partial/Citizen/Diplomat), but they additionally get the full admin control panel.
> Admin is NOT a rung above Diplomat — it's a separate platform role that gates access to internal tools.

---

## How Admin Access Works

Admin status is set in the database (`accountTier: 'ADMIN'`). The `canAccessAdminDashboard(user)` function checks for this. Admins who also have `isVendor: true` are Diplomats with admin powers; those without are treated as Diplomats for UI purposes (admin tier always wins for gating).

---

## Sidebar Navigation — Dual Mode

Admins get a **mode toggle** at the top of the sidebar:

```
┌─────────────────────────┐
│  [ ADMIN ] [ WORKSPACE ] │
└─────────────────────────┘
```

- **ADMIN mode** — shows the admin navigation (internal tools)
- **WORKSPACE mode** — shows the regular Diplomat navigation (organizer tools)

Admins can switch between modes at any time. The active mode persists via `localStorage`.

### Admin Sidebar Items (ADMIN mode)

| Sidebar Item | Route | Description |
|---|---|---|
| **Overview** | `/dashboard/admin` | Platform-wide summary stats |
| **Analytics** | `/dashboard/admin/analytics` | Platform-level analytics and trends |
| **Support** | `/dashboard/admin/support` | Customer support ticket management |
| **Accounts** | `/dashboard/admin/users` | User account management |
| **Events** | `/dashboard/admin/events` | Platform-wide event management |
| **Reports** | `/dashboard/admin/reports` | User/content reports and moderation |
| **Content** | `/dashboard/admin/ugc` | User-generated content moderation |
| **Organizers** | `/dashboard/admin/organizers` | Organizer management and onboarding |
| **Promos & Credits** | `/dashboard/admin/promos` | Promo codes and ad credit management |
| **Ads** | `/dashboard/admin/ads` | Platform-wide ad campaign monitoring |
| **Announcements** | `/dashboard/admin/announcements` | Create/manage organizer-facing announcements |

### Workspace Sidebar Items (WORKSPACE mode)

Same as Diplomat navigation — all Hub, Business, People, Intelligence sections.

---

## Admin Tab-by-Tab Feature Breakdown

### 1. Admin Overview (`/dashboard/admin`)

Platform-wide operational summary.

#### Hero Section
- Title: "Admin overview"
- Subtitle: "Users, events, reports, and operating queues at platform level."
- **Data source badge** — shows "Live" or "Mock" depending on admin access level
  - Live admin: real data from `GET /api/admin/stats`
  - Mock mode: sample data for PXI employee accounts without backend ADMIN tier (safe UI preview)

#### Summary Tiles (4 large tiles)
- **Users** — total user count + organizer count hint
- **Events** — total event count + upcoming count hint
- **Reports** — pending report count + "Pending review" hint
- **Support** — open support ticket count + "Open tickets" hint

#### Operating Mode Notice
- Explains whether live admin data or preview/mock mode is active

#### Stat Blocks (4-column grid)

**Accounts Block:**
- Partial count
- Citizen count
- Diplomat count (labeled "Diplomat", stored as "vendor" in DB)
- Platform admin count (only shown if > 0)

**Events Block:**
- Pending review
- Upcoming
- Ended or archived

**Reports Block:**
- Pending
- Cancelled
- Accepted (resolved)

**Operations Block:**
- Open support tickets
- Active promo codes

---

### 2. Admin Analytics (`/dashboard/admin/analytics`)

Platform-level analytics with time-range controls.

#### Features:
- **Range selector** — 7d, 30d, 90d
- **Data source badge** — Live / Mock indicator

#### Metric Tiles:
- New users (with per-day breakdown chart)
- Events created
- Tickets sold
- Revenue generated
- Active users
- Total media uploads

#### Time-Series Charts:
- New signups per day (area chart)
- Events created per day
- Revenue per day
- Tickets sold per day

#### Summary Stats:
- Total across range
- Daily average
- Active days (days with non-zero values)
- Formatted as USD for revenue metrics

---

### 3. Admin Support (`/dashboard/admin/support`)

Customer support ticket management system.

#### Features:

**Ticket List**
- Paginated table with columns:
  - Ticket ID
  - Subject
  - User (name/email)
  - Status badge
  - Created date
  - Last updated
- **Status filters**: All, Open, In Progress, Waiting on User, Resolved, Closed
- **Pagination controls** — page navigation

**Status Badges:**
- Open (amber)
- In Progress (sky/blue)
- Waiting on User (amber)
- Resolved (emerald/green)
- Closed (muted)

**Ticket Detail View**
- Full conversation thread
- Reply form (text area)
- Status update dropdown
- Internal notes

**Actions:**
- Reply to ticket
- Update status (Open → In Progress → Waiting on User → Resolved → Closed)
- View user profile link

---

### 4. Admin Accounts (`/dashboard/admin/users`)

User account management and moderation.

#### Features:

**User Table**
- Paginated table with columns:
  - User ID
  - Name
  - Email
  - Username
  - Account tier (Partial/Citizen/Vendor/Admin)
  - Passport issued (Yes/No)
  - Vendor status
  - Created date
  - Suspended status
- **Search** — search users by name, email, or username
- **Pagination** — page-by-page navigation

**Per-User Actions:**
- **Update user** — edit user fields (account tier, vendor status, etc.)
- **Suspend user** — suspend account (blocks login and access)
- **Unsuspend user** — restore suspended account
- **Super admin restriction** — only super admins can modify other admins

**Data Source:** Live mode fetches from `GET /api/admin/users`; mock mode shows sample data.

---

### 5. Admin Events (`/dashboard/admin/events`)

Platform-wide event browser and management.

#### Features:

**Event Table**
- Paginated table with columns:
  - Event ID
  - Event name
  - Organizer (name/username)
  - Status
  - Start date
  - End date
  - Ticket count
  - Location
- **Pagination** — page controls with total count
- **Sortable** — by date, status

**Data Source:** Live → `GET /api/admin/events`; mock → sample events.

---

### 6. Admin Reports (`/dashboard/admin/reports`)

User and content report review and moderation.

#### Features:

**Report Table**
- Paginated table with columns:
  - Report ID
  - Reporter (who filed the report)
  - Target type (USER or CONTENT)
  - Target (the reported user or content)
  - Reason
  - Status badge (Pending = amber, Resolved = green, Cancelled = muted)
  - Created date
- **Pagination controls**

**Report Resolution Panel (expandable per report)**
- **Status selector**: Resolved, Cancelled
- **Action selector** (for user reports):
  - NONE — no action taken
  - WARNING — warn the user
  - SUSPEND — suspend the reported user
  - BAN — ban the reported user
- **Reason** — text area for admin notes
- **Submit** button — resolve the report with the chosen action

**Data Source:** Live → `GET /api/admin/reports`; mock → sample reports.

---

### 7. Admin Content / UGC (`/dashboard/admin/ugc`)

User-generated content moderation.

#### Features:

**UGC Report Table**
- Paginated table of reported content
- Columns:
  - Report ID
  - Content type
  - Content preview/link
  - Reporter
  - Reason
  - Status (Pending/Resolved/Cancelled)
  - Created date

**Moderation Actions:**
- Resolve — mark as handled
- Cancel — dismiss the report
- Remove content — delete the reported content from the platform
- Action selector with reason field

**Status Badges:**
- Same as Reports: Pending (amber), Resolved (green), Cancelled (muted)

---

### 8. Admin Organizers (`/dashboard/admin/organizers`)

Organizer management and onboarding pipeline.

#### Features:
- Organizer list / table
- View organizer profiles
- Monitor Stripe verification status
- Track organizer event activity
- Onboarding pipeline management

---

### 9. Admin Promos & Credits (`/dashboard/admin/promos`)

Promo code and ad credit management for the platform.

#### Features:

**Promo Code Management**
- Paginated table of promo codes
- Create new promo code:
  - Code string
  - Discount type (percentage, fixed amount)
  - Discount value
  - Usage limits
  - Expiration date
  - Active/inactive toggle
- Edit existing promo codes
- Deactivate/reactivate promos

**Credit Grants**
- **Grant credits to a user** — search for a user, grant ad/marketing credit amount
- User search (by name/email/username)
- Credit amount input
- Credit history per user

**Pagination** — standard page controls

---

### 10. Admin Ads (`/dashboard/admin/ads`)

Platform-wide ad campaign monitoring and control.

#### Features:

**Campaign Table**
- All ad campaigns across all organizers
- Columns:
  - Campaign ID
  - Organizer
  - Event name
  - Status (Draft, Pending Payment, Scheduled, Active, Paused, Completed, Cancelled)
  - Budget
  - Impressions
  - Clicks
  - CTR
  - Start/end dates
- **Status filters**: ALL, ACTIVE, SCHEDULED, PAUSED, PENDING_PAYMENT, COMPLETED, CANCELLED
- **Pagination controls**

**Platform-Level Actions:**
- **Staff pause** — admin pauses a campaign (organizer cannot resume a staff pause)
- **Staff resume** — admin unpauses a campaign
- **Cancel** — admin cancels a campaign
- **Placement kill switch** — toggle ad placements on/off for featured hero slots

**Ads Overview**
- Platform-wide ad revenue/metrics
- Aggregate impressions, clicks, revenue

---

### 11. Admin Announcements (`/dashboard/admin/announcements`)

Create and manage organizer-facing announcements that appear on the Diplomat Command Center.

#### Features:

**Announcement Table**
- List of all announcements
- Columns:
  - Title
  - Body (truncated)
  - CTA label + href
  - Active status
  - Created date

**Create Announcement**
- **Title** — text input (120 char max)
- **Body** — text area (600 char max)
- **CTA label** — optional button text
- **CTA href** — optional internal link (must start with `/`, not `//`)
- **Active toggle** — publish/unpublish
- **Max active limit** — 5 active announcements at a time

**Edit / Delete Announcement**
- Edit all fields
- Toggle active/inactive
- Delete announcement

**Where Announcements Appear:**
- Bottom of the Diplomat Command Center as full-width banners with purple accent bar
- Each shows title, body, and optional CTA button

---

## Mock Mode vs Live Mode

All admin pages support a dual mode:

| Mode | When | Data Source |
|---|---|---|
| **Live** | Account has backend `ADMIN` tier | Real API calls to `/api/admin/*` endpoints |
| **Mock** | PXI employee without backend ADMIN tier | Pre-built sample data from `adminMockData.js` |

A `DataSourceBadge` component shows "Live" or "Mock" on each admin page so the admin always knows which data they're seeing.

---

## Admin-Specific UI Components

| Component | Purpose |
|---|---|
| `AdminPageShell` | Standard layout wrapper for all admin pages |
| `AdminPanel` | Content card with consistent styling |
| `AdminTableShell` | Scrollable table wrapper |
| `AdminPagination` | Page controls with total count |
| `AdminError` | Error message display |
| `DataSourceBadge` | Live/Mock indicator badge |
| `adminFormat` utilities | Date formatting, error message normalization |

---

## What Admins Can Do That Diplomats Cannot

| Action | Diplomat | Admin |
|---|---|---|
| View platform-wide stats | ✗ | ✓ |
| Manage user accounts | ✗ | ✓ |
| Suspend/unsuspend users | ✗ | ✓ |
| Review safety reports | ✗ | ✓ |
| Moderate content (UGC) | ✗ | ✓ |
| Manage support tickets | ✗ | ✓ |
| Create promo codes | ✗ | ✓ |
| Grant ad credits | ✗ | ✓ |
| Staff-pause ad campaigns | ✗ | ✓ |
| Kill-switch ad placements | ✗ | ✓ |
| Create announcements | ✗ | ✓ |
| View platform analytics | ✗ | ✓ |
| Browse all events | ✗ | ✓ |
| Browse all organizers | ✗ | ✓ |

> Admins also have full Diplomat access when in WORKSPACE mode — they can create events, sell tickets, run Live Ops, etc.
