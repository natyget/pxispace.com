# Pixel, CAPI and CSP setup — what the founder must do

Written 6 Aug 2026. Everything in code is committed; nothing here can be done from code.

> **Rotate these two credentials.** The TikTok Events API access token and the TikTok
> app secret were pasted into a chat transcript in plain text. Rotate both in TikTok
> Events Manager once you have confirmed the integration works, and set the new token
> only as an environment variable. Never commit either to the repo.

---

## 0. Secrets vs public ids

| Value | Public? | Where it goes |
|---|---|---|
| TikTok Pixel ID `D9QI5AJC77UAHM1GQQ10` | Public (visible in page source) | `NEXT_PUBLIC_TIKTOK_PIXEL_ID` (Netlify) **and** `TIKTOK_PIXEL_ID` (EC2) |
| TikTok Events API token | **SECRET** | `TIKTOK_EVENTS_ACCESS_TOKEN` (EC2 only) |
| TikTok app secret | **SECRET** | Not used yet — see §5 |
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
```

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
TIKTOK_EVENTS_ACCESS_TOKEN=<rotate first, then paste the new one>
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

## 3. Meta — blocked on two ids

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

**Meta mobile is one credential away.** `react-native-fbsdk-next` 13.4.3 (Feb 2026) is
well maintained and ships an official Expo config plugin. It needs a **Client Token**
(App Dashboard → Settings → Advanced → Client Token) which you did not include. ATT and
`SKAdNetworkItems` are already configured in `app.json`, so the remaining work is small.

Say the word and I will wire Meta mobile; tell me your risk appetite on TikTok mobile and
I will either add the 0.x package or write a thin native module against the official
`TikTokBusinessSDK` pod.

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
