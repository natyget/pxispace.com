# PXI-WEB browser QA

The harness behind `PXIStudio-App/docs/WEB_QA.md`. It drives a real Chromium against a real
build and a real API; nothing here is a unit test. `.cjs` because the package is ESM.

```bash
npm i -D playwright && npx playwright install chromium
export PXI_QA_DIR=./scripts/qa/.artifacts      # screenshots and inputs; gitignored
```

## `webDeep.cjs` — start here

The main run. Registers its own Citizen, invites a co-host and accepts the invite, creates
events from a second browser, and signs in by typing into the real login form. **No proxy and
no interception**, except where a network failure is being simulated on purpose.

```bash
# stub + production build, for the pages that need the edge gate
node scripts/qa/apiStub.cjs 4310 &
API_BASE_URL=http://localhost:4310 npm run build && API_BASE_URL=http://localhost:4310 npx next start -p 5174 &
npm run dev &                                   # :5173, deliberately unseeded

SITE=http://localhost:5174 UNSEEDED=http://localhost:5173 node scripts/qa/webDeep.cjs
```

### Three things that will waste your afternoon if you don't know them

1. **Run it headed.** Cloudflare lets a headed Chromium reach `dev.pxispace.com` and refuses
   the identical request from a headless one, with `net::ERR_FAILED` raised before any CORS
   evaluation — so it reads as a CORS bug and is not one. `HEADLESS=1` reproduces it.
2. **`middleware.ts` does not run under `next dev`** (Next 16.3.1 + Turbopack): `/dashboard`
   answers 200 with no cookie there, and 307 from a production build. Every WEB-2 case must
   run against `next start`, or it is testing nothing.
3. **A seeded hub has no loading or error state**, by design — the answer is already in the
   first response. Those two states only exist on a server that could not seed, which is what
   `UNSEEDED` points at.
4. **Do not point `SITE` at the deployed site for a whole run.** Six or seven navigations in,
   Cloudflare puts up a block page and keeps it up, and every assertion after that reads as a
   broken app. Run against a local build of the same commit and check the deployed site with
   curl, which is not rate-limited.

Assertions to copy rather than reinvent: grep the event **id**, never `href="/events/…"` (the
markup escapes its quotes), and match card titles case-insensitively (CSS uppercases them).

## `venueDashboard.cjs`: the venue dashboard (VEN-8)

Signs in through the login form as an account that owns a venue, opens each of its venues, and
checks that every card shows what the API answered: the door, the arrival chart, tonight and
upcoming, come back, insights, albums, the audience, the heat map, night by night, guarantees,
and phone width. It hardcodes nothing about the data, so it reads the same on a venue with no
nights, one night or many. Results: `PXIStudio-App/docs/VEN8_QA.md`.

```bash
QA_EMAIL=... QA_PASSWORD=... node scripts/qa/venueDashboard.cjs
```

`LOCAL_API=http://localhost:4320` answers the venue requests from a backend checkout that is
not deployed yet (`npm run venue:local-api` in PXIStudio-App, read-only). That local API answers
as one named account without a login, so it is for looking at a branch, not for testing sign-in.
Leave `LOCAL_API` out to test against the deployed API as the venue's real owner.

The pure decisions behind the cards have their own tests, no browser needed: `npm run test:venue`.

## `floorPlanGate.cjs`: floor plans are for venue accounts (PART-3)

Signs in through the login form as a vendor and checks that every screen offers what the API says
that account may do with floor plans: the Venues entry in the sidebar, the Command Center card,
the Venues page, a "turn this into a venue" link, the saved-venue picker on a new event, and the
heat map on Analytics when the account has an event to draw one for. The expectations are read
off the `GET /api/floor-plans` answer the page received. Results: `PXIStudio-App/docs/PART3_DECISIONS.md`.

```bash
QA_EMAIL=... QA_PASSWORD=... node scripts/qa/floorPlanGate.cjs
```

There are three cases (a venue account, an account that kept a venue from before the rule, an
account with neither) and one sign-in is only one of them. `FLOOR_PLAN_APIS` takes a list of
origins that answer the floor plan requests instead, one case each: `npm run floorplan:local-api`
in PXIStudio-App, which serves a backend checkout as a named account and writes nothing.

```bash
FLOOR_PLAN_APIS=http://localhost:4330,http://localhost:4331,http://localhost:4332 \
QA_EMAIL=... QA_PASSWORD=... node scripts/qa/floorPlanGate.cjs
```

A create is only attempted for an account the API says cannot create, so the run writes nothing.
How each screen reads the answer has its own tests, no browser needed: `npm run test:floor-plans`.

## `staffSetup.cjs`: staff setup in one choice, and a manager's own team (PART-7)

Uses both screens from start to finish: on Venue claims, a regional manager adds an ambassador, is
refused the eight kinds of account they may not add, and removes one; on Admin, Accounts, a super
admin sets a person up as city admin and regional manager with one Save, switches on a role that was
saved without its tier, and is shown a refusal; a city admin sees staff access and cannot change it.
After each step it reads back what the backend stored. Results: `PXIStudio-App/docs/PART7_DECISIONS.md`.

```bash
# in PXIStudio-App: this checkout's real admin and sales routes, on made-up accounts in memory
STAFF_LOCAL_API_CONFIRM=yes npm run staff:local-api
# here
QA_EMAIL=... QA_PASSWORD=... node scripts/qa/staffSetup.cjs
```

Read the header of the script before trusting a green run. The sign-in, the build and the route code
are real; the accounts are made up, nothing reaches a database, and the admin pages are opened by
giving the page an admin role in its own "who am I" answer, because there is no super admin sign-in
to test with. It is for a branch that is not deployed. It does not replace one run on dev with real
staff sign-ins. Restart the local API before each run: the run changes its accounts.

The choices and the wording have their own tests, no browser needed: `npm run test:staff-setup`.

## `staffLive.cjs`: the same two screens on the deployed API, with real staff sign-ins

The run that `staffSetup.cjs` cannot be. Nothing is intercepted and no account is made up: each
person signs in through the login form, each request goes from the browser to the deployed API, and
what the backend stored is read back through the API as that person.

```bash
MANAGER_EMAIL=... MANAGER_PASSWORD=... MANAGER2_EMAIL=... MANAGER2_PASSWORD=... \
AMBASSADOR_EMAIL=... AMBASSADOR_PASSWORD=... CITYADMIN_EMAIL=... CITYADMIN_PASSWORD=... \
MEMBER_EMAIL=... MEMBER_PASSWORD=... node scripts/qa/staffLive.cjs
```

Give it any of the sign-ins and it runs the parts it can and says which it skipped:

- **A regional manager** (`@qa_rm_nyc`): their team, add, add again, each refusal, remove.
- **A second manager** (`@qa_rm_bos`): holds one account on their own team for the length of the run,
  so the first manager can be refused "another manager's ambassador", add and remove.
- **An ambassador, a city admin, an account with no staff role**: what each is shown, and that the
  API refuses them the rest.
- **A super admin** (`SUPER_EMAIL`, `SUPER_PASSWORD`): the one-Save setup on Accounts, the refusal, a
  role switched on, Advanced. On dev the super admins are real people's sign-ins, so this part has
  only been written, not run: see `PART7_DECISIONS.md`.

**It writes to the deployed database**, through the screens: it adds and removes `@qa_fan3` and
`@qa_fan5` on the managers' teams (and, with a super admin, sets `@qa_fan4` to `@qa_fan6` up and
back). It checks those accounts have no staff access before it starts, and sets every one back even
when a step fails. Each change leaves an audit row.

## `webLive.cjs` / `webLiveDown.cjs` — the earlier pass

Kept because they cover the first HTML response directly and are proxy-based, so they still
work headless. They need `stale_token.txt` (a PASETO carrying **zero** event claims) and
`tester_user.json` (the `user` field of a login response) in `$PXI_QA_DIR`.

```bash
SITE=http://localhost:5174 node scripts/qa/webLive.cjs
node scripts/qa/webLiveDown.cjs
```

Their proxy replays API calls through `curl`, which Cloudflare does not challenge. It passes
the real status through — an earlier version forced `200` and made a broken flow look healthy.

## `apiStub.cjs`

A local `next build` here cannot reach the API (Node `fetch`, same Cloudflare refusal), so
every city would render empty for the wrong reason. The stub serves a verbatim `curl` capture
of the live response:

```bash
curl -s "$API/api/events?discover=1&limit=100&offset=0" -o "$PXI_QA_DIR/discover-payload.json"
node scripts/qa/apiStub.cjs 4310                # or --empty, or --down
```
