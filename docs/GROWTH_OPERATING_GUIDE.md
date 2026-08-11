# PXI — the growth operating guide

Written 7 August 2026. How to actually run the analytics and advertising stack once
`PRE_DEPLOY_CHECKLIST.md` is done. Written for the founder, not for engineers.

---

## PART 1 — WHAT WE BUILT, IN ONE PAGE

There are four systems and they do different jobs. Confusing them is the most common way
people waste money.

```
GOOGLE ANALYTICS 4     Tells you what happened on your own property.
                       Truth about YOUR funnel. Not an advertising tool.

GOOGLE ADS             Buys Search, YouTube, Display, Discover.
                       Catches people who are LOOKING for something.

META PIXEL + CAPI      Buys Instagram and Facebook.
                       Catches people who are NOT looking, based on who they are.

TIKTOK PIXEL + EAPI    Buys TikTok.
                       Catches people who are not looking, based on what they watch.
```

Every one of them is fed from **one place in our code**: `track()` in
`src/lib/analytics.js`. Call it once and the event fans out to GA4, Meta, TikTok and X
simultaneously. That is deliberate — it makes it structurally impossible for a funnel step
to exist in GA4 and be missing from Meta, which is the single most common cause of "our
retargeting doesn't work".

### The events we send, and what each is for

| Our name | Meta | TikTok | What it means | Use it to… |
|---|---|---|---|---|
| `page_view` | PageView | Pageview | any page | build URL audiences |
| `view_item` | ViewContent | ViewContent | opened an event page | retarget warm people |
| `search` | Search | Search | searched | see demand, incl. songs |
| `add_to_cart` | AddToCart | AddToCart | picked a tier | mid-funnel |
| `begin_checkout` | InitiateCheckout | InitiateCheckout | opened checkout | **best retargeting audience** |
| `add_payment_info` | AddPaymentInfo | AddPaymentInfo | entered card | abandoners |
| `purchase` | Purchase | CompletePayment | bought (**server only**) | optimise + measure ROAS |
| `sign_up` | CompleteRegistration | CompleteRegistration | made an account | measure app growth |
| `join_event` | Schedule | SubmitForm | free RSVP | free-event funnel |
| `host_lead` | Lead | SubmitForm | **wants to host** | ← the money event |
| `event_create_publish` | SubmitApplication | CompleteRegistration | published an event | organizer activation |

**`purchase` is sent from our server, never from the browser.** It fires from the Stripe
webhook, which is the only place a sale is a fact rather than a hope. This survives ad
blockers, Safari, and people who close the tab on the success page — roughly a third of real
buyers. It also means a refund can net out properly later.

### The retargeting loop you asked about

The Chase-credit-card effect, concretely:

```
1. Someone opens pxispace.com/event/xyz
2. The Meta pixel fires ViewContent and drops a first-party cookie (_fbp)
3. Meta ties that cookie to their logged-in Instagram identity
4. They appear in the Custom Audience "viewed an event page, last 30 days"
5. Your ad runs against that audience and shows up in their Instagram feed
6. They come back and buy
7. Our SERVER tells Meta they bought, using the payment intent id
8. Meta credits the ad, learns what that person looked like, finds more like them
```

Step 4 was impossible before 7 August 2026. The site is a single-page app, so the pixel
only ever saw the first URL of a session — browsing ten events looked identical to bouncing.
That is now fixed and verified.

---

## PART 2 — WHERE TO CLICK, PER PLATFORM

### Meta has five different websites. This is the map.

| Task | Product | URL |
|---|---|---|
| Is the pixel receiving data? | **Events Manager** | business.facebook.com/events_manager2 |
| Build/run/read ads, spend money | **Ads Manager** | adsmanager.facebook.com |
| Add people, apps, ad accounts, permissions | **Business Settings** | business.facebook.com/settings |
| Post to the Page/IG, read organic reach, inbox | **Business Suite** | business.facebook.com |
| Custom Audiences, Lookalikes | Ads Manager → **Audiences** | adsmanager.facebook.com/audiences |
| Tokens, app config, SDK | **Developers** | developers.facebook.com/apps |
| Influencer / creator partnerships | Business Suite → **Collaborations** | business.facebook.com |

Mental model: **Business Settings owns things. Ads Manager spends money. Events Manager
proves the data arrived. Business Suite is the organic side.**

Most people get lost because they look for the pixel inside Ads Manager. It is not there —
it is in Events Manager.

### TikTok

| Task | Where |
|---|---|
| Pixel + Events API health | Ads Manager → **Assets → Events** |
| Campaigns | ads.tiktok.com |
| Audiences | Ads Manager → **Assets → Audiences** |
| Organic posting + follower analytics | TikTok app, or **TikTok Studio** |
| Paid creators | **Creator Marketplace** |
| Let a creator run ads as you | Ads Manager → **Spark Ads** (see Part 5) |

### Google

| Task | Where |
|---|---|
| What happened on the site/app | **GA4** analytics.google.com (property 514139578) |
| Buy Search/YouTube/Display | **Google Ads** ads.google.com (AW-18365171384) |
| Organic search health, indexing | **Search Console** |
| Tag debugging | **GTM preview** + GA4 DebugView |

---

## PART 3 — HOW TO READ THE NUMBERS

### The four questions worth asking, and where each is answered

**1. "Is anybody finding us?"** → GA4 → Reports → Acquisition → Traffic acquisition.
Look at sessions by *Session default channel group*. Organic Search, Direct, Organic Social,
Paid Social, Referral. If Direct dominates, your links are not tagged — fix the UTMs before
you conclude anything.

**2. "Do they do anything once here?"** → GA4 → Explore → **Funnel exploration**.
Build it once:

```
page_view → view_item → begin_checkout → purchase
```

The drop between `view_item` and `begin_checkout` is your event-page problem.
The drop between `begin_checkout` and `purchase` is your checkout problem.
They have completely different fixes, and conflating them wastes months.

**3. "Is the money working?"** → Ads Manager and Google Ads, column set = *Performance and
clicks*, then add **Cost per result** and **ROAS**.

**4. "Which organizers/cities are actually growing?"** → GA4 → Explore → Free form, with
`campaign_source` / city dimensions. Or the PXI admin dashboard, which knows things GA4
cannot (hype score, organizer ranking, repeat attendance).

### The numbers that lie

| Metric | Why it lies |
|---|---|
| **Impressions / reach** | Costs nothing to inflate. Never a goal. |
| **Clicks** | Half of mobile clicks are accidental. Look at cost per *result*. |
| **Followers** | Zero correlation with ticket sales in this category. |
| **App installs** | An install that never opens an album is worth nothing to us. |
| **Attributed ROAS in Ads Manager** | Meta grades its own homework and counts view-through. Compare against GA4 and against actual Stripe revenue. When they disagree, **Stripe is right.** |
| **"Total revenue" in Ads Manager** | That is GROSS ticket value, not PXI revenue. Our take is about $2.00 net per ticket. A campaign showing "$2,200 revenue" produced about **$200**. This one distinction will save you from a very expensive mistake. |

### The numbers that matter

```
CAC per ORGANIZER        target under $200     (they are worth ~$1,670 — see below)
CAC per ATTENDEE         must be near $0       (they are worth ~$6 — never buy these)
Organizer activation     host_lead → event_create_publish, target 25%+
Checkout completion      begin_checkout → purchase, target 55%+
Album share rate         the free growth engine; watch it weekly
Event Match Quality      Meta's score for our server events; want 6+
```

### Why the CAC targets are so far apart

This is the most important paragraph in this document.

Our take is a 5.49% service fee plus $0.99 per ticket, and the buyer separately pays a
processing fee sized so Stripe's cut nets out — so **PXI keeps the whole $2.09 on a $20
ticket** rather than absorbing payment costs. (Both fee values are env-overridable; the
deployed value is the only proof.) The Monthly Model uses a $0.90 flat fee, giving a round
**$2.00 per ticket**, and that is the number to plan with.

- An **attendee** buys maybe 2–3 tickets a year → worth roughly **$6/year**
- An **organizer** runs 1.0–1.5 paid events a month at 30–55 tickets. At 40 tickets and
  1.25 events that is $100 a month; at 6% monthly churn the average organizer lasts about
  17 months → worth roughly **$1,670**

**An organizer is worth about 280× an attendee.**

So: **never buy attendees.** No paid channel delivers a ticket buyer for under $6. Attendees
must come free, through the album share loop, face-match notifications and invites — which
is exactly what the product is built around.

**Buy organizers all day** — but not yet. See the timing warning below.

> ### ⚠ None of Part 4 applies before month twelve
>
> Under the Monthly Model's ROI ladder there is **$0 of marketing cash until M5 and no real
> ad budget until M12**. Independently, Meta and TikTok need ~50 conversions per ad set per
> week before optimisation works at all. Both say the same date.
>
> Months 1–11 are a zero-cash, hand-sales problem, and there is a specific plan for them:
> **`PXI-operation/Docs/Operations/PXI_EARLY_GROWTH_2026-08-08.md`**. Read that first. Come
> back to Part 4 at month twelve.

---

## PART 4 — HOW TO ACTUALLY RUN CAMPAIGNS

### Campaign 1 — Organizer acquisition (the one that matters)

```
Platform     Meta (Instagram feed + Reels), and Google Search
Objective    Leads  →  optimise for the `Lead` event  (our host_lead)
Audience     Interests: nightlife promotion, event planning, DJ, Eventbrite,
             Dice, Resident Advisor. Ages 21–40. New York and Boston only.
Creative     Show the organizer dashboard. Show the money screen. Show the
             album filling up during the event. Do NOT show a party — every
             competitor shows a party and it reads as consumer.
Landing      /platform  or  /features/event-promoter-analytics
Budget       Start at $30/day per city. Two weeks minimum before judging.
Kill rule    Cost per host_lead above $60 after 100 leads → change the creative,
             not the targeting.
```

Google Search, same objective, exact-match on the intent that already exists:
`sell tickets for my event`, `eventbrite alternative`, `event ticketing platform boston`.
Search is expensive per click and worth it, because someone typing that has already decided.

### Campaign 2 — Retargeting warm traffic (cheap, always on)

```
Platform     Meta + TikTok
Audience     Custom Audience from the pixel:
               • begin_checkout, last 14 days, excluding purchasers  ← best one
               • view_item, last 30 days, excluding purchasers
               • all site visitors, last 90 days
Objective    Sales / Conversions, optimise for Purchase
Budget       $10/day. This is small on purpose; the pool is small.
Why it works This is the only place attendee acquisition is economic, because
             the click is cheap and the intent is already proven.
```

### Campaign 3 — Lookalikes (only after ~100 conversions)

Once the pixel has seen ~100 organizers or purchasers, Ads Manager → Audiences → Create →
**Lookalike**, source = your `host_lead` custom audience, 1% United States.

Do not do this early. A lookalike built off 12 conversions models noise.

### The UTM rule — non-negotiable

Every link PXI publishes anywhere gets tagged, or the analytics is fiction:

```
https://pxispace.com/event/abc?utm_source=instagram&utm_medium=social&utm_campaign=aug_boston&utm_content=reel_01
```

- `utm_source` — where it was seen: instagram, tiktok, x, youtube, newsletter
- `utm_medium` — the kind of placement: social, cpc, email, influencer, qr
- `utm_campaign` — the push it belongs to: aug_boston
- `utm_content` — which specific creative: reel_01

We capture and store these on first touch AND last touch, and they ride through signup, so
you can answer "which post produced organizers who are still active six months later". That
only works if the links are tagged. An untagged link is a permanently lost answer.

We also capture and preserve every click id — `gclid`, `gbraid`, `wbraid`, `fbclid`,
`ttclid`, `twclid`, `msclkid` — so paid clicks stay attributable even when the ad platform
strips UTMs.

---

## PART 5 — INFLUENCERS, CREATORS AND PARTNERSHIPS

### The strategic point first

Do not pay influencers cash for posts. In this category it does not work — the audience
overlap is wrong, the attribution is invisible, and the money is gone whether it worked or
not. What works is **paying in inventory and in attribution**, both of which cost PXI almost
nothing.

Three models, cheapest first.

### Model A — The tracked link (start here, costs $0)

Give every creator, ambassador and organizer a tagged link and, where useful, a promo code.

```
https://pxispace.com/event/abc?utm_source=influencer&utm_medium=influencer&utm_campaign=aug_boston&utm_content=@handle
```

You now see, per creator, in GA4: sessions, `view_item`, `begin_checkout`, `purchase`, and
signups. Pay against **results**, not reach. A creator with 4,000 followers who fills a room
is worth ten with 100,000 who do not.

Promo codes are already built (`PromoCode`, credits, campaign attribution) and are the
cleanest fallback when someone posts a link the platform strips.

### Model B — Spark Ads / Partnership Ads (the actual high-leverage move)

This is the one most people miss and it is the best tool available to you.

**TikTok Spark Ads** and **Meta Partnership Ads** let you take a creator's *organic* post —
posted from *their* handle, with their followers, comments and credibility intact — and put
paid budget behind it.

Why it is better than a normal ad:
- It does not look like an ad, because it is not one; it is a real post
- Engagement accrues to their post, so it keeps growing organically
- Our pixel measures it exactly like any other ad
- It typically outperforms brand-produced creative by a wide margin in this category

How:

1. Creator posts organically about a PXI event
2. **TikTok:** creator goes to Settings → Creator tools → **Ad settings** → Ad authorisation
   → generates a code → sends it to you → you paste it in Ads Manager → Assets → Spark ads
3. **Meta:** creator tags PXI as a business partner on the post, or grants access via
   Business Suite → Collaborations. You then boost it from Ads Manager
4. You pay the ad spend. You often pay the creator nothing, or a small flat fee, because
   they are getting free reach on their own post

Start here with your own organizers. An organizer promoting their own party is the most
credible creative that exists, and they *want* the reach.

### Model C — Paid partnership (only once A and B prove out)

Marketplaces: **TikTok Creator Marketplace**, **Meta Creator Marketplace**
(business.facebook.com → Collaborations).

Rules if you go here:
- Pay per deliverable **plus** a per-ticket bonus, so incentives align
- Require Spark Ads / Partnership Ads rights in the agreement — without them you are buying
  a post that dies in 48 hours instead of an asset you can amplify for months
- Require FTC disclosure (`#ad` or the platform's paid-partnership label). This is legally
  on **you**, not on them
- Cap at one creator per city until one produces measurable sales

### What to actually offer a creator

Ranked by cost to PXI:

1. **Free tickets + guest list** — costs $0, high perceived value
2. **A verified organizer profile + dashboard** — costs $0, makes them a host, not a promoter
3. **Fee waiver on their first three events** — costs about $60 of our revenue, buys an
   organizer worth ~$1,000
4. **Revenue share on tickets they drive** — the existing 7% ambassador plan, capped, 12
   months, revenue-linked so it only pays when it works
5. **Cash** — last resort, and only for someone with proven conversion

### Tracking the whole thing

Give each partner:
- a `utm_content=@handle` link
- a promo code
- if they are an organizer, their own organizer account so their events attribute natively

Then read it in GA4 → Explore → Free form: dimension `campaign_content`, metrics sessions /
`purchase` / revenue. That is your creator leaderboard, and it is honest.

---

## PART 6 — THE DISCOVERY ENGINE (why this compounds)

Paid ads are rented. These are owned, and they are the real reason CAC trends toward zero.

**Programmatic SEO.** Artist, genre and city hub pages generate a page per real entity, each
one a legitimate landing page for a long-tail search. 32 sitemap URLs verified live, every
route carries a valid `og:image`, zero dead internal links.

**The album share loop.** An event album is worth sharing, and a shared album is a landing
page with a face on it. Every share is a free, high-intent acquisition channel. This is the
single highest-ROI thing in the product and it costs nothing per user.

**Face match.** "You're in 14 photos" is the strongest notification in this category. It
brings people back with no media spend at all.

**Song → event search (`EventTrack`).** Built 7 August 2026, migration written and not yet
applied. Every event's playlist is normalised into a searchable song index, so "who is
playing Rush Hour this weekend" becomes answerable. Nobody else in event discovery can do
this, and it maps directly onto how people actually find music — through TikTok sounds,
Instagram audio and Spotify. A song is the most-searched thing in nightlife and it currently
returns nothing anywhere.

**Organic social.** Instagram, TikTok, X and YouTube are all now linked as `sameAs` on the
Organization schema, which is what feeds a Google Knowledge Panel. Post from all four; tag
every link.

The order of operations for the next twelve months:

```
1. Fix CAC to near zero on attendees (loops, SEO, face match)   ← mostly done
2. Spend only on organizers                                     ← ready to start
3. Let organizers bring attendees for free                      ← the product
4. Ship song search and own a query nobody else answers         ← migration pending
```
