# Dashboard Positioning — Competitive Analysis & Information Hierarchy

*July 2026. Written to settle one question: what does an organizer see first, and why.*

The thesis this document defends: **sell the dashboard as a ticketing product, win on
the moat second.** A venue evaluating PXI is not comparing us to Instagram. They are
comparing us to Eventbrite and Posh, on four questions — can I make an event fast, does
it sell, do I get paid, do I know who came. If the first screen leads with passports,
stamps and Odyssey XP, the buyer files PXI as "a social app for kids" and never reaches
the part where we beat everyone. Lead with the boring thing we do well; let the moat be
what they discover on screen two and can't unsee.

---

## 1. The competitive set

### Direct — nightlife / independent promoters (who we actually take deals from)

**Posh** — the closest cultural competitor. Nightlife and college-party focused.
Genuinely good at the social layer: RSVP with visible "who's going", guest lists, and
first-class promoter/affiliate tracking with per-promoter attribution links. Organizer
dashboard gives real-time sales and attendee lists. **No content layer, no spatial, no
identity graph.** Their attribution is better than ours today.

**Shotgun** — European nightlife/festival. Strong discovery surface, controlled resale,
competent promoter back office. Similar cultural position, ahead of us on discovery
distribution in EU markets.

**DICE** — mobile-first, curated supply, waiting lists, closed resale at face value
(their real innovation — kills scalping). "DICE for Partners" has the best *fan*
analytics in the category: repeat attendance, fan retention cohorts, and push
notifications direct to fans who follow an artist or venue. Supply is invite-only, which
is why independents can't just sign up. **Closest competitor on audience intelligence.**

**Resident Advisor** — electronic music. Wins on editorial discovery, not on tooling.
Organizer dashboard is thin.

### Incumbent — the default

**Eventbrite** — what the buyer will name unprompted. Event dashboard covers sales,
orders, attendee list, sales-by-ticket-type, promo codes, Eventbrite Ads (search
placement inside Eventbrite only), and Eventbrite Marketing email. Reporting is
transactional: sales report, attendee report, order report, CSV export. Check-in via a
separate scanner app. ~3.7% + $1.79/ticket in the US. **The entire product ends when the
event ends.**

### Adjacent — different buyer, worth knowing

**Luma** — calendar-first, beautiful, community/tech events. Guest list, registration
questions, email blasts, views→registrations conversion. Analytics deliberately shallow.
The UX bar we should be judged against.

**Partiful** — Gen-Z social invites, text-based RSVP, free, viral. Barely a dashboard —
guest list and reminders. Not a threat to venue revenue, but it sets Gen-Z expectations
for how an invite should *feel*.

**Tixr** — enterprise venues and festivals. Bundling, memberships, serious reporting.
Heavy, high-touch. Where big rooms go.

**Long tail** — Ticket Tailor (low flat fee), Skiddle / Fatsoma (UK), Humanitix
(charity), Eventix, Billetto. All transactional dashboards, competing on fee.

**B2B conference stack** — Bizzabo, Cvent, Swapcard. Genuinely rich engagement analytics,
totally different buyer. Ignore except as proof that engagement analytics *do* sell.

### What the whole category shows an organizer

Tickets sold · gross revenue · check-in count · promo code performance · referral source
(sometimes) · an attendee CSV.

That is the category. Every one of them is a **transaction ledger with a scanner
attached.** The event ends, the data stops.

---

## 2. Where PXI actually wins

Ordered by how hard each is to copy.

**1. Verified attendance, not claimed attendance.** Every ticket is a signed PASETO
scanned at the door; `scannedAt` is the scanner's clock. Everyone else infers attendance
from a check-in app that staff skip when there's a queue. This is the difference between
"who said they'd come" and "who was at the door at 9:47 PM" — and it is the foundation
under every other number we show. *Nobody can retrofit this without rebuilding ticketing.*

**2. Spatial intelligence.** DBSCAN over geotagged capture points, projected onto a
calibrated floor plan, scrubbable through the night, with a map-mode fallback when no
plan is uploaded. An organizer sees *where* the room was alive at 11:42 PM. **No
ticketing platform on earth ships this.** It exists because we own the camera.

**3. The content byproduct.** The album/scrapbook means attendees shoot the event for
us. The organizer wakes up to a marketing asset library ranked by Wilson score ("Top
moments" → Marketing kit) instead of paying a photographer and waiting a week. This
inverts the cost structure of event marketing.

**4. Face-matched identity.** Attendees find themselves in their own photos; the
organizer gets consented reach to people who provably attended. (Deliberately never a
marketing/targeting signal — App Review 5.1.2(vi) and our own privacy promise.)

**5. The behavioural arc.** Pre-event chat hype → door scan → in-room capture and
reaction velocity → grace-window decay → stamps earned. Competitors get one slice, and
it's usually the transaction. We own the whole night and the week either side.

**6. Closed-loop economics.** `consumerTotal` / `vendorPayout` / `pxiRetained` itemized
per ticket, joinable to what that buyer then *did* inside the room. Spend → outcome is
one query. Ticketing platforms see only the spend.

**7. Portable attendee reputation.** Passport + Odyssey XP means a CRM segment carries
meaning across venues. "Luminary who has attended three of your events" is a different
person from a one-time Partial, and only we can tell them apart.

**8. An owned social feed to advertise into.** Organizers buy placement in front of
lookalike attendees on the Wall. Eventbrite Ads only ranks you inside Eventbrite search.

**9. Music taste graph.** Spotify/Apple ingest → genre affinity per attendee, matched
against lineup. Nobody else has consented taste data tied to verified attendance.

### Where we are behind — worth saying out loud

- **Promoter/affiliate attribution.** Posh does this properly; we don't have
  `promoter_links` end-to-end. This is the #1 feature a nightlife promoter asks for and
  it is table stakes in our own segment.
- **Discovery distribution.** RA and Shotgun bring an audience. We ask organizers to
  bring their own.
- **Resale.** DICE's face-value closed resale is a genuine trust feature we lack.
- **Self-serve speed.** Eventbrite gets you to a live paid event in minutes with no
  verification wall. Our Stripe KYC gate is correct but it is friction they don't have.

---

## 3. The hierarchy this implies

The Command Center reads top to bottom as a sales argument, not as a feature list.

**Tier 1 — Am I making money?** (above the fold, first screen, no scrolling)
Net revenue, tickets sold, conversion, live-now count. The next event with its sell-through.
One primary action: publish an event. This tier must be indistinguishable in quality from
the best ticketing dashboard on the market, because this is the comparison the buyer is
actually running.

**Tier 2 — Do I know my room?** (one scroll)
Verified attendance vs sold. Repeat-guest rate. Who to follow up with. Capture and hype
velocity through the night. This is where we quietly stop being Eventbrite — every number
here is one they cannot produce.

**Tier 3 — The things they didn't know to ask for.** (visible, clearly framed, not hidden)
Spatial heat map, content library, passport/identity depth, taste graph. Framed
explicitly as *what you get here and nowhere else* — because an organizer who has never
seen a venue heat map will not go looking for one in a nav menu.

**What this is not.** Tier 3 is not "hidden" or "later" in the sense of buried. It is
later in the *reading order*. The moat is the reason they stay; the ticketing dashboard
is the reason they arrive.

### Vocabulary discipline (this is a positioning issue, not a copy nit)

Two ladders exist and they must never be spoken as one:

| | What it is | Values | Earned by |
|---|---|---|---|
| **Access tier** | KYC / capability ladder | Partial → Citizen → Diplomat | Verifying |
| **Passport level** | XP rank on the passport | Wanderer → Seeker → Voyager → Pathfinder → Luminary → Odyssey | Doing things |

A Wanderer can be a Diplomat. A Luminary can be a plain Citizen. Calling Citizen a
"passport level" makes the KYC ladder sound like a game and makes the game sound like a
permission system — it undermines both. Access tier lives in `src/lib/accountTier.js`;
passport level lives in `src/utils/odysseyTier.js`.

### The conversion ladder is the business

- **Partial** — web only, no app. Can buy and attend. *This is the top of the funnel and
  the dashboard must work completely for them,* because they are the venue owner who just
  signed up on a laptop.
- **Citizen** — installed the app, passport issued. Now has stamps, vault, face-matching.
- **Diplomat** — Citizen who cleared Stripe verification. Can sell.

Every Partial who lands on the dashboard is a prospective Diplomat. The job of the
Citizen/Partial Command Center is one conversion, clearly argued, without pretending the
rest of the product doesn't exist.
