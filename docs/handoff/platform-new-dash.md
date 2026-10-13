# Platform page on the new member dashboard

Branch `web-feature-PLATFORM-new-dash`, stacked on `web-feature-DASH-figma-shell` (PR must target that branch until it merges to dev).

## What changed
- Hero (`src/views/site/platform/platform.scenes.js`, `buildCC` / `buildMCC`): the pinned picture is the member dashboard: top bar,
  passport band (collapsed bar on phones), Hub / Insights / Operations / Engagement tabs, bold sub-tabs with Create event, then the
  Command Center (KPI strip, Revenue and Tickets sold, Key metrics, Live and upcoming, Only on PXI, Notices). Demo organizer Alex Rivera,
  nights Late Checkout, Afro Fest Nights, Rooftop Sessions at Harbor Hall; revenue $18,905 gross, $18,372 payout (the shot figures).
  On desktop the pin is longer and the dashboard scrolls inside its frame so the whole page is readable.
- Sell, Doors, Room, Recap, Crowd stages (desktop) get the dashboard's tab row and sub-tabs (`dFrame`): Insights/Analytics,
  Operations/Live Operations, Engagement/Audience. Card titles use the app's type (600 sentence case); eyebrow lines the real pages
  do not have are gone. Stage `data-h` values in `PlatformView.jsx` grew by 108px for the header.
- Feature pages (`src/components/marketing/DashboardMockup/DashboardMock.jsx`): new `section` prop renders the real `DashboardTabs`
  (via `buildMemberTabs`) pointed at that page, so the tabs cannot drift. Skeleton heights in `AnalyticsView` and
  `BrandedTicketingView` updated to the new measured heights.

## Not done / notes
- The platform page is still hand-built SVG/HTML (gsap scenes), not the real React panels; only the feature-page mockups use real components.
  The shell chrome there is copied from `PassportHeader` / `DashboardTabs` markup and CSS (`.ds-*` in `platform.css`); change both together.
- Phone-width scenes (Sell to Crowd) show the new card titles but not the tab row (stages are fixed-height crossfades).
- Door scan names (Lu Chen, Zee Mensah ...) are fictional sample guests from earlier work.
