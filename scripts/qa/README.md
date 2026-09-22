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

Assertions to copy rather than reinvent: grep the event **id**, never `href="/events/…"` (the
markup escapes its quotes), and match card titles case-insensitively (CSS uppercases them).

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
