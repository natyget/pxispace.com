# Oct 13 web: When pill, organizer page, login

Branch `web-feature-OCT13-when-org-login`. No new package, no backend change required (everything degrades on an old backend).

## 1. Discover When + City pill
- `src/lib/when.js` (+ `when.test.mjs`, `npm run test:when`): the contract's `When` model. `whenOptions`, `whenNights`,
  `whenLabel`, `whenParams`, `eventInWhen`, `nightOf` (5 am to 5 am in the city's zone, DST safe), `pickRange` (today to +90).
- `src/components/discover/WhenCityPill.jsx` (was `FilterPill.jsx`, renamed) and `WhenCalendar.jsx`: When menu with
  Tonight, Tomorrow, This weekend, This week, the remaining weekdays with their dates, then Pick a date (calendar
  popover). City second, then sort and search, as before.
- Used by `/events` (`PublicEventsPage.jsx`), the only web surface with a time control. `/discover/[city]` and the
  legacy `/events-old` (iframe map) have none, so there is no web map/list pair to keep in step.
- Feed: `eventsService.getDiscoverEvents` sends `window` (+ `night`, `tz`) when a When is set. A 400 retries without
  them. The list is always also filtered by night client-side (`eventInWhen`), so an old backend (no `windowEcho`)
  gives the same answer from its 48 events; a night with nothing shows the empty state, never an error.
- Default is no time filter (shown as "When"), the page's old default of All. Choosing the chosen row again clears it.
  The founder may want Tonight as the default instead: change `useState(null)` for `when` in `PublicEventsPage.jsx`.
- Nights are cut in `America/New_York` (PXI runs in New York and Boston only): `NIGHT_TZ` in `PublicEventsPage.jsx`.

## 2. Organizer page (`/u/[id]` for a Diplomat)
- Scenes they host at the top (after the header, before Next up): `OrganizerScenes.jsx`. Patch drawn by
  `src/components/scenes/ScenePatch.jsx` from the patch data (flat web version of the app's embroidery; emblems copied
  from the app into `src/lib/patchEmblems.js`). Join: signed in `POST /api/scenes/:slug/join`; signed out to
  `/login?redirect=/u/...` (the login's own param is `redirect`; it now also reads `next`). Shown only when
  `GET /api/scenes?host=` echoes `host` (`parseHostScenes`, tested in `organizerPage.test.mjs`). A signed-in reader's
  own fetch replaces the public list so "Joined" is right.
- Passport at the bottom: `OrganizerPassport.jsx` uses `PxiPassportSection` (card only, no second h1) when the
  profile is published and not private; data from `getPublicProfile`.

## 3. Login like the app
`EmailAuthPage.jsx` rebuilt to the app's `login.tsx`: the three-print fan (`AuthPrints.jsx`, images in
`public/auth/`, same photos as the app), WELCOME BACK / JOIN PXI in the display face, LOG IN / SIGN UP track with a
flat purple pill, Apple then Google (white 48px pills, brand marks, "Continue with ..."), OR, flat #2E2E2E fields
(`AuthField.jsx`, no labels, same placeholders), purple CREATE ACCOUNT / LOG IN, the app's legal line. Validation is
the app's: messages under the field on submit (no dead button). Auth logic, redirects, Apple/Google, phone verify
unchanged. Removed the floating decorations (`FloatingAuthElements`, `AuthParticles`).

## Check in the browser
- `/events`: the When menu, the calendar (any night to +90 days), pick a night, empty state wording.
- `/u/<a Diplomat with scenes>`: scenes first, Join signed out and signed in; passport last. Needs the
  `?host=` backend (OCT13-D) to show scenes at all.
- `/login` and `/login?mode=signup`, phone width and desktop; Google and Apple still open their flows; a `?redirect=` return.
