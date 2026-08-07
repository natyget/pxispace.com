# Pixel, CAPI and CSP setup — what the founder must do

Written 6 Aug 2026. Everything in code is committed; nothing here can be done from code.

> **No credential values in this file.** Every secret below is a placeholder. This
> document is committed to git, which is a wider and more permanent audience than a
> chat window — a repo gets cloned, forked, and read by anyone who later gains access.
> Real values belong only in the Netlify UI and the EC2 `.env.production`.
>
> Public ids (pixel ids, the Facebook app id) ARE written out in full, because they
> ship in the page source anyway and hiding them helps nobody.

---

## 0. Secrets vs public ids

| Value | Public? | Where it goes |
|---|---|---|
| TikTok Pixel ID `D9QI5AJC77UAHM1GQQ10` | Public (visible in page source) | `NEXT_PUBLIC_TIKTOK_PIXEL_ID` (Netlify) **and** `TIKTOK_PIXEL_ID` (EC2) |
| TikTok Events API token | **SECRET** | `TIKTOK_EVENTS_ACCESS_TOKEN` (EC2 only) |
| TikTok app secret | **SECRET** | Not used — no viable RN Business SDK, see §5 |
| Meta App Client Token | **SECRET** | Mobile only, already in `app.json` via the config plugin |
| Meta Pixel ID | Public | `NEXT_PUBLIC_META_PIXEL_ID` + `META_PIXEL_ID` |
| Meta CAPI token | **SECRET** | `META_CAPI_ACCESS_TOKEN` (EC2 only) |
| Facebook App ID `1470652311198736` | Public | Mobile only — see §5 |

A `NEXT_PUBLIC_*` value is **inlined at build time**. Setting it in Netlify requires a
**full rebuild**, not a redeploy.

---

## 1. Deploy the CSP — do this one first, and in two steps

The site currently has **no CSP at all**. The new one is verified against 33 pages with
zero violations, but a CSP fails closed and the surfaces I could not reach without
logging in were the dashboard and a real Stripe checkout.

**Step 1 — report-only.** Set in Netlify, then **rebuild**:

```
CSP_REPORT_ONLY=1
````

Then walk these with the browser console open and confirm no `Content Security Policy`
errors appear:

- [ ] Buy a ticket end to end (real Stripe PaymentElement)
- [ ] Organizer dashboard: analytics, campaigns, floor plans, live scan
- [ ] Face scan / photo upload
- [ ] Connect Spotify, connect Apple Music
- [ ] Sign in with Google and with Apple

**Step 2 — enforce.** Delete `CSP_REPORT_ONLY` and **rebuild again**. The header name is
baked into `routes-manifest.json` at build time, so a redeploy of the existing artifact
keeps whatever mode it was built with.

If something breaks after enforcing, set the variable back and rebuild — that is the
one-move rollback.

**Known limitation:** Google Ads sends conversion pings to the searcher's country domain
(`google.co.uk` and friends). Only `www.google.com` is allowlisted. Fine while PXI is
US-only; revisit before international campaigns.

---

## 2. TikTok — web (ready, needs env only)

Already verified: the token authenticates and our exact payload returns `code: 0`.

**Netlify** (then rebuild):
```
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D9QI5AJC77UAHM1GQQ10
```

**EC2 `.env.production`** (restart the API):
```
TIKTOK_PIXEL_ID=D9QI5AJC77UAHM1GQQ10
TIKTOK_EVENTS_ACCESS_TOKEN=<TikTok Events Manager → Settings → generated token>
TIKTOK_TEST_EVENT_CODE=TEST77294   # REMOVE after test purchases are confirmed
```

**In TikTok Events Manager:**
1. **Test Events** tab → copy the test code → set `TIKTOK_TEST_EVENT_CODE` on EC2
   temporarily, make a purchase, confirm it appears, then **remove the variable**.
   Leaving it set keeps production conversions out of reporting.
2. Confirm **event deduplication** is working. Browser and server both send
   `CompletePayment` with `event_id` = the Stripe payment intent id. Events Manager
   shows a dedupe rate; it should be non-zero once both are live.
3. Ignore one junk event in your data: `event_id: pi_shape_probe_do_not_use`, timestamped
   1970. That was my payload validation probe.

---

## 3. Meta web + CAPI — blocked on two ids

**You gave a Facebook App ID, which is not a Pixel ID.** They are different objects. The
web pixel and Conversions API both need:

1. **Pixel ID** — Events Manager → Data Sources → your pixel. 15–16 digits.
2. **CAPI access token** — same pixel → Settings → Conversions API → Generate access token.

Then:

**Netlify** (rebuild): `NEXT_PUBLIC_META_PIXEL_ID=<pixel id>`
**EC2**: `META_PIXEL_ID=<pixel id>` and `META_CAPI_ACCESS_TOKEN=<token>`

**Also required in Meta, or conversions get throttled:**

- [ ] **Verify the domain `pxispace.com`** — Business Settings → Brand Safety → Domains.
      Without this, iOS 14.5+ Aggregated Event Measurement will not attribute properly.
- [ ] **Configure Aggregated Event Measurement** — Events Manager → Aggregated Event
      Measurement → rank your 8 events. Put `Purchase` first.
- [ ] Check **Event Match Quality** on the Purchase event after a few real sales. We send
      hashed email, phone and external_id server-side, so it should be decent.

---

## 4. X (Twitter) — optional, plumbing only

`NEXT_PUBLIC_X_PIXEL_ID` from X Ads → Tools → Conversion tracking. Lowest priority of the
three; X ad inventory is unlikely to matter for an events product in NY/Boston.

---

## 5. Mobile app SDKs — NOT implemented, and here is why

I installed both packages, inspected them, and **reverted the install**. `package.json`
and the lockfile are untouched.

**TikTok: there is no viable package.** `react-native-tiktok` — the one in your notes — is
**TikTok Login Kit, not the Business SDK**. Its entire API is `authorize()` with OAuth
scopes for user info and video lists. It has no `trackEvent`, so the
`TikTokSDK.trackEvent('ViewContent', …)` snippet in your instructions cannot work with it.
The alternatives are `react-native-tiktok-business` (0.2.0, last touched Jan 2025) and
`expo-tiktok-business` (0.1.2, Mar 2025) — both 0.x, both predating RN 0.81 and Expo 54,
neither tested against the New Architecture. Adding one to an app that is about to ship is
a build risk I would not take without your say-so.

**What you lose by skipping it:** app *install* attribution only. In-app conversions are
already covered — the TikTok Events API accepts `event_source: "app"`, and purchases
already flow server-side from the Stripe webhook regardless of platform.

**Meta mobile is DONE** (commit `59fe089`). `react-native-fbsdk-next` 13.4.3 is installed
and configured with the app id and client token. It is built fully inert
(`isAutoInitEnabled`, `autoLogAppEventsEnabled`, `advertiserIDCollectionEnabled` all
false) and only starts collecting after ATT is granted, from the single decision point in
`attribution.ts`. **Requires a new EAS build to take effect** — a JS-only OTA update will
not add a native SDK.

For TikTok mobile, tell me your risk appetite and I will either add the 0.x package or
write a thin Expo module against the official `TikTokBusinessSDK` pod.

**Either way, before the next store submission:** Play Data Safety must declare the
Advertising ID, and the App Store privacy questionnaire must declare IDFA/tracking.

---

## 6. Still outstanding from the earlier migration

Unchanged, see `PXIStudio-App/docs/analytics-migration-runbook.md`: 3 GA4 MP API secrets ·
Netlify env + full rebuild · EC2 `.env.production` in the same window · 12 custom
dimensions · GA4→Ads link · Enhanced Measurement history-events OFF ·
`npx prisma migrate deploy` · Search Console verification (no tag in the codebase — confirm
it is verified by DNS).

---

## 7. How the retargeting loop works once this is on

1. Visitor reads `/features/branded-event-ticketing`. `_ttp` / `_fbp` set, post-consent.
2. `track('view_item')` → GA4 `view_item`, Meta `ViewContent`, TikTok `ViewContent`.
3. In Meta Ads Manager build a **Custom Audience**: fired ViewContent in the last 30 days,
   did not fire Purchase. That audience covers Instagram and Facebook.
4. Ads against that audience are the Instagram ad you described.
5. `Purchase` fires server-side from Stripe, so the audience self-cleans.

Step 3 is a console action — code cannot create audiences.

**For the attendee→organizer loop specifically:** the highest-value audience is
"fired `join_event` or `purchase`, never fired `event_create_publish`". Those are
attendees who have never hosted. That is the lookalike seed worth building, and every one
of those events already flows to all three networks.


---

## 8. Every environment variable, in one place

Public ids and secrets are separated. **Send section B privately** — do not paste it in
the same channel message as section A.

### A — Netlify (Site settings → Environment variables), then **Clear cache and deploy site**

```
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D9QI5AJC77UAHM1GQQ10
NEXT_PUBLIC_META_PIXEL_ID=3347164888818656
CSP_REPORT_ONLY=1
```

Already set from the earlier migration — confirm they are still there:
```
NEXT_PUBLIC_GOOGLE_TAG_ID=GT-MJMHMN4S
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-7K7MSDZV47
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-18365171384
NEXT_PUBLIC_GTM_ID=GTM-MHXZZTC8
API_BASE_URL=https://api.pxispace.com
NEXT_PUBLIC_API_BASE_URL=https://api.pxispace.com
```

Optional, only if X ads are ever run: `NEXT_PUBLIC_X_PIXEL_ID=`

> Every `NEXT_PUBLIC_*` is inlined at build time. So is `CSP_REPORT_ONLY`. Changing any of
> them needs a **rebuild**, not a redeploy.

### B — EC2 `.env.production` (then restart the API) — CONTAINS SECRETS

```
TIKTOK_PIXEL_ID=D9QI5AJC77UAHM1GQQ10
TIKTOK_EVENTS_ACCESS_TOKEN=<TikTok Events Manager → Settings → generated token>
TIKTOK_TEST_EVENT_CODE=TEST77294

META_PIXEL_ID=3347164888818656
META_CAPI_ACCESS_TOKEN=<REGENERATE — the supplied token is rejected, see below>
META_TEST_EVENT_CODE=<optional, from Events Manager → Test Events>
```

Also still outstanding from the GA4 migration (see the other runbook):
```
GA4_WEB_MEASUREMENT_ID=G-7K7MSDZV47
GA4_WEB_API_SECRET=<mint in GA4 property 514139578>
GA4_IOS_FIREBASE_APP_ID=<from Firebase>
GA4_IOS_API_SECRET=<mint>
GA4_ANDROID_FIREBASE_APP_ID=<from Firebase>
GA4_ANDROID_API_SECRET=<mint>
```

**Remove `TIKTOK_TEST_EVENT_CODE` and `META_TEST_EVENT_CODE` after testing.** While either
is set, those conversions go to the Test Events view and are **excluded from real
reporting and optimisation**.

### C — Mobile (`.env`, already correct)

```
EXPO_PUBLIC_META_APP_ID=1470652311198736
```
The Meta client token is not an env var — it is baked into `app.json` by the config
plugin. Needs a new **EAS build**.


---

## 9. Meta CAPI token is rejected — regenerate it

The Pixel ID `3347164888818656` is **confirmed good**: the browser pixel loads,
`connect.facebook.net/signals/config/3347164888818656` resolves and `_fbp` is set.

The CAPI access token supplied is **not valid**:

```
{"error":{"message":"The access token could not be decrypted","type":"OAuthException","code":190}}
```

This is not a pixel or permissions problem. A bare `GET /v21.0/me?access_token=…`,
which involves no pixel at all, fails identically — so the token string itself is bad
(truncated on copy, or already invalidated).

**Generate a replacement that does not expire.** A token copied out of Graph API
Explorer is short-lived (1–2 hours) and will break again:

1. Business Settings → **Users → System Users** → add a system user (admin).
2. **Add Assets** → your pixel `3347164888818656` → full control.
3. **Generate New Token** → select the app → scope **`ads_management`**.
4. Set it as `META_CAPI_ACCESS_TOKEN` on EC2.

Verify before deploying, expecting `{"events_received":1,...}`:

```bash
curl -s -X POST "https://graph.facebook.com/v21.0/3347164888818656/events" \
  -H "Content-Type: application/json" -d '{
    "data":[{"event_name":"Purchase","event_time":'"$(date +%s)"',
      "event_id":"manual_probe_1","action_source":"website",
      "user_data":{"em":["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"]},
      "custom_data":{"value":1,"currency":"USD"}}],
    "test_event_code":"<from Events Manager > Test Events>",
    "access_token":"<NEW TOKEN>"}'
```

Until this is set, Meta CAPI is dormant and fails closed — the browser pixel still
works, so remarketing audiences build normally; only the server-side purchase signal
is missing.

---

## 10. Consent now gates server-side conversions

`adConsent` rides through Stripe metadata from the browser. The webhook sends a Meta or
TikTok conversion **only** when it equals `'1'`, so an opted-out buyer generates nothing
and a missing value fails closed. Verified with a table test (5/5).

Practical consequence for testing: **a test purchase made with cookies rejected will
correctly produce no CAPI event.** Accept cookies before your test purchase, or you will
chase a bug that is the feature working.

---

## 11. EventTrack migration (song → event discovery)

Backend commit `d7c4954`. Additive: one new table, nothing altered or dropped, nothing
reads or writes it yet.

```bash
npx prisma migrate deploy                              # never `migrate dev` — shadow DB is broken
npx tsx scripts/backfillEventTracks.ts --dry-run       # reports counts, writes nothing
npx tsx scripts/backfillEventTracks.ts                 # apply
```

The backfill is safe to re-run; it recomputes each event's rows in a transaction. Run it
again whenever the normalisation rules in `src/services/trackKey.ts` change.

**Nothing to configure in TikTok or Meta for this.** The one external dependency is
getting the Spotify app **out of dev mode** — until then playlist reads 403, ingest goes
through the embed payload, and `providerTrackId` stays mostly null so matching relies on
the normalised title key alone.
