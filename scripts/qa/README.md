# PXI-WEB browser QA

The harness behind `PXIStudio-App/docs/WEB_QA.md`. It drives a real Chromium against a real
build and a real API; nothing here is a unit test.

```bash
npm i -D playwright && npx playwright install chromium

export PXI_QA_DIR=./scripts/qa/.artifacts      # inputs and screenshots; gitignored
mkdir -p "$PXI_QA_DIR"
```

## Inputs it expects in `$PXI_QA_DIR`

| File | What | How to get it |
|---|---|---|
| `stale_token.txt` | a PASETO for the QA account carrying **zero** event claims — the whole point | log in before being given anything, or mint one and check it has no `ownedEventIds`/`staffEventIds` |
| `tester_user.json` | that account's profile object | the `user` field of the login response |
| `discover-payload.json` | a real `GET /api/events?discover=1&limit=100` response | `curl`, not `fetch` — see below |

## The two runs

```bash
SITE=http://localhost:5174 node scripts/qa/webLive.js   # against a healthy server
node scripts/qa/webLiveDown.js                          # against a build that could not seed
```

`webLive.js` covers both stories: `canManage` in both directions at the API, the discovery
empty states including what is in the **first** HTML response, and the dashboard access cases
(own event on a stale cookie, stranger, vendor bounce, signed out).

`webLiveDown.js` covers the branch where the server could not reach the API at render time,
which is the one that has actually happened in production.

## Why it looks the way it does

**API calls are replayed through `curl`.** Cloudflare challenges browser XHR and Node `fetch`
from some networks but not `curl`. Only the transport is swapped and the real status code is
passed through — never force a `200`, or a broken flow will look healthy.

**Pages are driven against a local production build of the commit under test.** Repeated
headless navigation to the deployed site trips the same bot check part-way through a run.
Anything checkable without a browser (middleware redirects, server HTML) is checked against
the deployed site directly.

**`apiStub.js` exists because a local `next build` cannot reach the API** for the same
Cloudflare reason, so every city would render empty for the wrong reason:

```bash
curl -s "$API/api/events?discover=1&limit=100&offset=0" -o "$PXI_QA_DIR/discover-payload.json"
node scripts/qa/apiStub.js 4310                 # or --empty, or --down
API_BASE_URL=http://localhost:4310 npm run build && npx next start -p 5174
```
