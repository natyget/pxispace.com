# PXI — everything to do before production deploy

Written 7 August 2026. Plain checklist. Do it in order; later steps depend on earlier ones.

Companion documents:
- `GROWTH_OPERATING_GUIDE.md` — how to actually USE Meta / TikTok / Google once this is on
- `PIXEL_SETUP_RUNBOOK.md` — the deeper why behind each integration
- `AUDIT_2026-08-06.md` — what was broken and what was fixed

Anything marked **[VERIFIED]** was tested live during this work and needs no re-checking.
Anything marked **[YOU]** cannot be done from code — it needs you in a dashboard.

---

## STATUS SUMMARY — read this first

```
WORKING, TESTED, NEEDS ONLY ENV VARS SET
  Meta browser pixel          3347164888818656   [VERIFIED loads + fires]
  Meta Conversions API        system-user token  [VERIFIED events_received:1]
  TikTok browser pixel        D9QI5AJC77UAHM1GQQ10  [VERIFIED loads + fires]
  TikTok Events API           access token       [VERIFIED code:0]
  GA4 + Google Ads            G-7K7MSDZV47       [VERIFIED live]
  Content-Security-Policy     33 pages, 0 violations
  Consent gate + GPC          denial binds everywhere

WORKING BUT INERT UNTIL YOU ACT
  Meta app events (iOS)       needs an EAS build + the app added to Events Manager
  TikTok app events (iOS)     needs an EAS build + 3 env vars + a dedicated app token
  SKAdNetwork attribution     needs an EAS build (ids are in app.json now)
  X / Twitter pixel           no pixel id exists yet; plumbing is ready

NOT BUILT, AND DELIBERATELY SO
  Advanced Matching (browser) contradicts our privacy policy — see step 9
```

---

## PART 1 — KEYS AND ENVIRONMENT VARIABLES

### Step 1 — Netlify (web)

Site settings → Environment variables. These are **public ids**, safe to paste anywhere.

```
NEXT_PUBLIC_META_PIXEL_ID=3347164888818656
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D9QI5AJC77UAHM1GQQ10
CSP_REPORT_ONLY=1
```

Confirm these are still present from the earlier GA4 migration:

```
NEXT_PUBLIC_GOOGLE_TAG_ID=GT-MJMHMN4S
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-7K7MSDZV47
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-18365171384
NEXT_PUBLIC_GTM_ID=GTM-MHXZZTC8
API_BASE_URL=https://api.pxispace.com
NEXT_PUBLIC_API_BASE_URL=https://api.pxispace.com
```

Then **Clear cache and deploy site** — not a plain redeploy.

> Why the cache clear matters: every `NEXT_PUBLIC_*` value, and `CSP_REPORT_ONLY`, is
> baked into the JavaScript at BUILD time. Setting the variable and redeploying the
> existing build changes nothing at all. This has already caught us once.

### Step 2 — AWS EC2 (the API), `.env.production`

**Secrets. Send these in a separate private message from step 1.**

```
META_PIXEL_ID=3347164888818656
META_CAPI_ACCESS_TOKEN=<the ads_management + ads_read system-user token>

TIKTOK_PIXEL_ID=D9QI5AJC77UAHM1GQQ10
TIKTOK_EVENTS_ACCESS_TOKEN=<TikTok Events Manager token>
TIKTOK_TEST_EVENT_CODE=TEST77294
```

Still outstanding from the GA4 migration, unrelated to pixels but on the same box:

```
GA4_WEB_MEASUREMENT_ID=G-7K7MSDZV47
GA4_WEB_API_SECRET=<mint in GA4 property 514139578>
GA4_IOS_FIREBASE_APP_ID=<Firebase console>
GA4_IOS_API_SECRET=<mint>
GA4_ANDROID_FIREBASE_APP_ID=<Firebase console>
GA4_ANDROID_API_SECRET=<mint>
```

Restart the API after saving.

### Step 3 — Mobile `.env`

```
EXPO_PUBLIC_META_APP_ID=1470652311198736

EXPO_PUBLIC_TIKTOK_STORE_APP_ID=<App Store listing id, digits only>
EXPO_PUBLIC_TIKTOK_APP_ID=<TikTok App ID, Events Manager → App Events>
EXPO_PUBLIC_TIKTOK_APP_ACCESS_TOKEN=<a token generated SEPARATELY from the server one>
```

All three TikTok values are required together — the SDK stays inert if any is missing.
The access token ships inside the binary and is extractable, which is why it must not be
the same token as `TIKTOK_EVENTS_ACCESS_TOKEN` on EC2. See step 14.

The Meta **client token** is not an env var — it is written into the native project by the
config plugin in `app.json`. Changing it requires a new EAS build.

### Step 4 — Delete the test codes when testing is done  **[YOU]**

`TIKTOK_TEST_EVENT_CODE` and `META_TEST_EVENT_CODE` route conversions to the Test Events
view. **While either is set, those conversions are excluded from real reporting and from
campaign optimisation.** Remove them and restart the API once you have seen test purchases
arrive.

---

## PART 2 — META (Facebook / Instagram)

Meta spreads one product across four different sites. Which one you need:

| You want to… | Go to | URL |
|---|---|---|
| Check the pixel is receiving events | **Events Manager** | business.facebook.com/events_manager2 |
| Create/edit/read campaigns and spend | **Ads Manager** | adsmanager.facebook.com |
| Manage people, assets, ad accounts, permissions | **Business Settings** | business.facebook.com/settings |
| Post organically, read Page insights, reply to DMs | **Business Suite** | business.facebook.com |
| Register apps, generate tokens, set SDK config | **Developers** | developers.facebook.com/apps |

Your identifiers, confirmed live:

```
Business portfolio    PXI LABS            685912800638435
Ad account            PXI LABS ad account act_1482730986747606   (active, USD)
Dataset / Pixel       "Meta PXI"          3347164888818656
Business-side app     PXI                 4337863129859682   (owns the CAPI token)
Mobile SDK app        PXI                 1470652311198736   (in app.json)
```

### Step 5 — Confirm the pixel is receiving  **[YOU]**

Events Manager → Data sources → **Meta PXI** → *Overview*. After the Netlify deploy you
should see `PageView`, `ViewContent`, `InitiateCheckout` arriving from the browser and
`Purchase` arriving from the server.

The **Test Events** tab is the fast way to check: open it, then browse pxispace.com in
another tab. Events appear within a few seconds.

> **If the pixel looks completely dead in a test tool or automated browser, check the user
> agent before you check anything else.** Meta silently discards every event from a browser
> whose user agent contains `HeadlessChrome` — the pixel initialises, sets `_fbp`, counts
> the events internally, and sends nothing. This cost real time during this work.

### Step 6 — Two Meta apps exist, and only one is connected  **[YOU]** ← IMPORTANT

There are two Meta apps both named "PXI":

- `4337863129859682` — the app the CAPI system-user token belongs to
- `1470652311198736` — the app the mobile SDK is built against

They are separate. The system user in the PXI LABS portfolio **cannot even see** app
`1470652311198736`, which means the mobile app's events currently have no path into the
same dataset as the website's.

Do this:

1. Business Settings → Accounts → **Apps** → Add → *Add an app ID* → `1470652311198736`
2. Assign your system user to it with Full control
3. Events Manager → Data sources → **Meta PXI** → Settings → **Connected app** → connect
   `1470652311198736`
4. Developers → app `1470652311198736` → Settings → Basic → confirm the iOS bundle ID is
   `com.pxistudio.PXIStudio`

Until this is done, app installs and in-app events will not join up with web conversions,
and you will be optimising two disconnected pictures of the same person.

If keeping two apps has no reason behind it, the cleaner end state is one app used for both
— but do not delete anything until you know which one the App Store listing references.

### Step 7 — Domain verification  **[YOU]**

Business Settings → Brand safety → **Domains** → Add `pxispace.com`, verify by DNS TXT.

No longer required for event configuration (Meta removed the manual 8-event setup in mid
2025), but it establishes link ownership, prevents someone else claiming the domain, and is
needed before you can edit link previews.

### Step 8 — Aggregated Event Measurement  **[nothing to do]**

AEM is how Meta reports conversions from iOS users who declined tracking. It is automatic
now — pixel plus CAPI is the whole requirement, and both are live. There is no configuration
screen any more.

One consequence worth knowing: AEM still only carries the **top 8 events per domain**.
Anything past that is dropped for opted-out iOS users. We send about 10 event types, so the
low-value ones (`notification_opt_in`, `view_item_list`) are the ones that fall off. That is
the right thing to lose.

### Step 9 — Automatic Advanced Matching: leave it OFF  **[decision, not a task]**

Events Manager shows `enable_automatic_matching: false` and it should stay that way.

Automatic Advanced Matching works by **scraping email and phone fields out of your page
forms** and hashing them in the browser. Our Privacy Policy §4.6 states plainly that the
browser sends no personally identifying value to an ad partner and that hashed identifiers
travel only server-side. Turning this on would make that sentence false.

We get the same match-quality benefit the compliant way: the Conversions API sends SHA-256
hashed email, phone, external id, IP and user agent from the server, only for buyers who
allowed ad tracking. That is strictly better data and it matches what we tell people.

### Step 10 — Watch Event Match Quality  **[YOU, ongoing]**

Events Manager → Meta PXI → *Purchase* → **Event Match Quality** (scored 0–10).

- Below 4 → conversions are barely matching anyone; check that `fbc`/`fbp` are reaching
  the server
- 6+ → healthy
- 8+ → excellent

We now send: hashed email, hashed phone, hashed user id, `_fbc`, `_fbp`, client IP and user
agent. That should land in the 7–9 range. If it sits low, the usual cause is the browser
cookies not making it into Stripe metadata at checkout.

---

## PART 3 — TIKTOK

| You want to… | Go to |
|---|---|
| Check the pixel / Events API | Ads Manager → **Assets → Events** |
| Create campaigns | ads.tiktok.com |
| Post organically, read follower analytics | TikTok app, or **TikTok Studio** (tiktok.com/tiktokstudio) |
| Creator partnerships / paid influencers | **Creator Marketplace** (creatormarketplace.tiktok.com) |

### Step 11 — Confirm receipt  **[YOU]**

Assets → Events → Web Events → `D9QI5AJC77UAHM1GQQ10` → **Test Events**, using code
`TEST77294`.

Browser events and Events API events both carry the same `event_id` so TikTok collapses the
pair. If you see doubled `CompletePayment`, the ids are not matching — tell engineering, do
not "fix" it by turning one off.

### Step 12 — Remove the test code  **[YOU]**

Same as step 4. Test-coded events never reach optimisation.

---

## PART 4 — GOOGLE

### Step 13 — Still outstanding from the GA4 migration  **[YOU]**

1. GA4 property `514139578` → Admin → Data streams → **Measurement Protocol API secrets** →
   create one per stream (web / iOS / Android), put them on EC2 (step 2)
2. GA4 → Admin → **Key events** → mark `purchase`, `sign_up`, `join_event`,
   `event_create_publish`, `host_lead` as key events
3. Google Ads `AW-18365171384` → Tools → **Conversions** → import the GA4 key events
4. Search Console → confirm `pxispace.com` is verified and the sitemap is submitted
5. Google Ads → Tools → **Audience manager** → confirm the remarketing tag is collecting

---

## PART 5 — THE MOBILE APP

### Step 14 — What ships, and what does not

**Meta app events — built, inert until an EAS build.** `react-native-fbsdk-next` is in
`package.json` and configured in `app.json` with everything disabled at launch:
`isAutoInitEnabled: false`, `autoLogAppEventsEnabled: false`,
`advertiserIDCollectionEnabled: false`. The SDK does nothing at all until the user
affirmatively grants App Tracking Transparency. The native module is not in the current
binary, so this needs a new build.

**TikTok app events — BUILT 8 August 2026, inert until an EAS build.** A maintained
community wrapper does exist after all: `react-native-tiktok-business-sdk` (MIT, 13.6k
weekly downloads, last published 28 July 2026) wraps the real `TikTokBusinessSDK` pod. The
package that looks right by name, `react-native-tiktok`, is Login Kit — OAuth sign-in, no
`trackEvent`. The names are a trap and it cost one wasted install already.

Same law as Meta: nothing initialises until ATT is affirmatively granted, every automatic
tracker is disabled, SKAdNetwork support stays on. `identify()` is never called, so no email
or phone leaves the device.

**Three things you must do before this can work:**

1. Set these in the mobile `.env` (all three, or the SDK stays inert):
   ```
   EXPO_PUBLIC_TIKTOK_STORE_APP_ID=<your App Store listing id, digits only>
   EXPO_PUBLIC_TIKTOK_APP_ID=<TikTok App ID from Events Manager → App Events>
   EXPO_PUBLIC_TIKTOK_APP_ACCESS_TOKEN=<a SEPARATE token — see below>
   ```
2. **Generate a token dedicated to the app.** TikTok's SDK requires the access token to be
   passed into `initializeSdk`, so it ships inside the binary and is extractable from any
   IPA or APK. There is no client-token equivalent the way Meta has one — this is TikTok's
   design. Using a separate token from the server one means a leak can be rotated without
   taking down server-side conversions.
3. Register the app in TikTok Ads Manager → Assets → Events → **App Events**, and confirm
   the SKAdNetwork ids listed in step 15 match what TikTok shows you there.

**The native build is UNVERIFIED.** Typecheck is clean and the JS integration is done, but
nothing has been through `prebuild` or EAS. It is a legacy bridge module (no codegen),
which works here only because `expo-build-properties` sets `bridgelessEnabled: false`. If
the build breaks, `npm uninstall react-native-tiktok-business-sdk` and revert commit
`44d4db3` — everything else keeps working, since the module is behind a guarded require.

### Step 15 — SKAdNetwork  **[done in code, needs a build]**

`app.json` now declares:

```
cstr6suwn9   Google
v9wttpbfk9   Meta / Facebook
n38lu8286q   Meta / Instagram
238da6jt44   ByteDance / Pangle (China)
22mmun2rn5   ByteDance / Pangle (non-China)
```

On iOS an ad network receives an install postback **only** if its identifier is in the
advertiser app's Info.plist. Before this change, only Google's was there — every app-install
campaign on Instagram, Facebook or TikTok would have been silently unmeasurable.

This list is compiled into the binary. A missing id cannot be patched later; it costs a full
resubmit. The two ByteDance ids came from a community registry rather than TikTok's own
documentation — **confirm them in TikTok Ads Manager before spending on iOS installs.**

### Step 16 — App Store Connect  **[YOU]**

App Privacy → confirm these are declared, because the app now contacts Meta:

- **Identifiers → Device ID** → *Used for Tracking: YES*, purposes: Third-Party
  Advertising + Analytics
- **Usage Data → Product Interaction** → Analytics, App Functionality
- **Identifiers → User ID** → Analytics, App Functionality
- **Purchases → Purchase History** → Analytics, App Functionality

These already match `PrivacyInfo.xcprivacy` in the build. The App Store form is a separate
declaration and Apple compares the two.

### Step 17 — Google Play  **[YOU, when you build Android]**

Data safety form must declare: Device or other IDs, App activity, Purchase history, and
**"Data is used for advertising or marketing"**. The `com.google.android.gms.permission.AD_ID`
permission is already declared in `app.json`, which Play requires whenever the advertising id
is read.

---

## PART 6 — COMPLIANCE

### Apple review — assessed ready

| Requirement | State |
|---|---|
| `NSUserTrackingUsageDescription` | Present, specific, non-coercive |
| ATT prompt timing | After onboarding, one call site, never on cold start |
| No collection before ATT is answered | Meta SDK built fully inert; verified in `metaApp.ts` |
| ATT denial respected | `applyMetaTrackingConsent(false)` turns everything off |
| `PrivacyInfo.xcprivacy` | Present, generated by `withPxiAnalyticsNative.js` |
| `NSPrivacyTrackingDomains` | Correct — see the warning below |
| SKAdNetwork ids | Declared |
| Privacy policy reachable in-app and on web | Yes |
| Account deletion | Implemented (`DELETE /account`, purge service) |

> **Never add a facebook.com domain to `NSPrivacyTrackingDomains`.** Now that the Meta SDK
> is in the build, that is exactly the wrong instinct. iOS **blocks** every domain on that
> list outright when ATT is denied; FBSDKCoreKit 18.x ships its own privacy manifest already
> declaring `ep1`/`ep6.facebook.com`; and Meta's own guidance says adding the domain
> yourself breaks the SDK. Third-party manifests are merged into the app's at build time.
> The rule for that list is: only domains **our own code** contacts for tracking.

### Web — assessed ready for US operation

- Content-Security-Policy on every HTML document — 33 pages, 0 violations
- Consent Mode v2, region-scoped, denial binding **everywhere** including the US
- Global Privacy Control honoured
- CPRA "sharing" disclosed and opt-out honoured (Privacy Policy §4.6)
- Cookie Policy names every actual cookie, including `_fbp`, `_fbc`, `_ttp`
- Reject-all genuinely deletes cookies and calls `fbq('consent','revoke')` +
  `ttq.revokeConsent()` on already-loaded pixels
- Server-side conversions are gated on the buyer's own consent choice, carried through
  Stripe metadata as `adConsent`; anything other than `'1'` sends nothing

### One thing worth a lawyer's eye

We now send **SHA-256 hashed email, phone and user id** to Meta and TikTok from the server,
for buyers who allowed ad tracking. That is standard industry practice and it is disclosed
in Privacy Policy §4.6 — but it is a genuine data flow to a third party, and it is the kind
of sentence a state AG reads closely. Have counsel confirm §4.6 says enough.

---

## PART 7 — THE ORDER TO ACTUALLY DO THIS IN

```
0.  Read PXI_EARLY_GROWTH_2026-08-08.md before planning any spend — the answer to
    "when do we start advertising" is month twelve, for two independent reasons
1.  Set Netlify vars (step 1), Clear cache and deploy
2.  Set EC2 vars (step 2) WITH the test codes, restart API
3.  Buy one real ticket on production
4.  Check it lands in Meta Test Events and TikTok Test Events
5.  Check Event Match Quality is not near zero (step 10)
6.  Remove both test codes, restart API (step 4)
7.  Connect the mobile app to the dataset (step 6)
8.  Verify the domain (step 7)
9.  Mint the GA4 MP secrets, mark key events, import to Ads (step 13)
10. EAS build → TestFlight → confirm ATT prompt still appears once, after onboarding
11. Only now start spending money
```

Do not start step 11 before step 5. Spending against a pixel that is not receiving
conversions teaches the algorithm nothing and the money is simply gone.

And do not start step 11 in 2026 at all. Meta and TikTok need roughly 50 conversions per ad
set per week before optimisation does anything, and the Monthly Model's ROI ladder releases
no real ad budget until month twelve. Both constraints land on the same date. Months 1–11
are a hand-sales problem with a specific plan of their own:
`PXI-operation/Docs/Operations/PXI_EARLY_GROWTH_2026-08-08.md`.
