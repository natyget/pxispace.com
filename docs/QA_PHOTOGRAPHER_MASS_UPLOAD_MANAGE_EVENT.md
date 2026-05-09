# QA — Photographer mass upload (Manage Event / gallery)

**Feature:** Bulk add photos and videos to the **album gallery** (not the side thread).  
**Primary surface (current build):** Web dashboard — event detail (“manage event”) page.

> **Platform note:** Mass upload is implemented on **web** (`/dashboard/events/[id]`). If acceptance criteria also apply to **mobile** “Manage Event”, run a separate smoke pass when that UI ships; it is not covered by this build.

---

## Prerequisites

| Item | Notes |
|------|--------|
| Accounts | At least **four** test users (or use role-switching if your env supports it). |
| Event | An event with a linked **album** (normal flow after create). |
| Roles on album | Assign participants so you can test **OWNER**, **ADMIN**, plain **member**, and a user **not** on the album. |
| Event creator | One user who **created** the event (may or may not match album OWNER). |
| Data | Mixed **images** and **videos**; a folder with **50+** files for limit tests; a few **large** videos for slow progress. |
| Browser | Desktop Chrome (or primary supported browser); keep the tab **focused** during long uploads (copy warns users to keep tab open). |

---

## Locating the UI (web)

1. Sign in as a user who is **event creator** **or** album **OWNER** **or** album **ADMIN**.
2. Open **Dashboard → My events** (`/dashboard/events`).
3. Open the target event: **`/dashboard/events/{eventId}`** (click the event from the list).
4. At the **top** of the page (above “Invite people”), find the card titled **`Gallery · Mass upload`** (purple icon, uppercase heading).

**Pass:** Section is visible with explanatory copy, **Choose files** button, and text stating uploads go to the **album gallery**, not the thread.

---

## AC1 — Mass upload accessible from Manage Event section

| ID | Steps | Expected |
|----|--------|----------|
| AC1-1 | As **event creator**, open `/dashboard/events/{id}` | **`Gallery · Mass upload`** block is present. |
| AC1-2 | As album **OWNER** (not necessarily creator), same URL | Block **present**. |
| AC1-3 | As album **ADMIN**, same URL | Block **present**. |
| AC1-4 | As **member** (or bouncer / line-up only — no OWNER/ADMIN/creator) | Block **absent** (entire section not rendered). |
| AC1-5 | As user **not** invited to album | Block **absent** (and page may still show invite UI per product rules). |

---

## AC2 — Multi-file selection (bulk pick)

| ID | Steps | Expected |
|----|--------|----------|
| AC2-1 | Click **Choose files**; OS file picker opens | `accept` includes **images and videos**; **multiple** selection allowed. |
| AC2-2 | Select **3** images, confirm | Upload starts; progress appears (see AC4). |
| AC2-3 | Select **3** videos (or mixed image+video) | Same; no crash; each file processed. |
| AC2-4 | Select **41+** files in one picker | Only the **first 40** are queued; red error text indicates **limit per batch** (wording may mention “first 40”). |
| AC2-5 | Cancel file picker without choosing files | No upload; no stuck “Uploading…” state. |
| AC2-6 | **Camera roll / filesystem** | Web uses OS picker (Finder / Explorer / etc.); pass if multi-select works from a local folder and from “Downloads” / SD import as applicable. |

---

## AC3 — Uploads go to album gallery, not thread

| ID | Steps | Expected |
|----|--------|----------|
| AC3-1 | Upload **2** identifiable files (unique filename or solid color test image). | Success message: uploaded to **album gallery** (green confirmation line). |
| AC3-2 | Open the **album gallery** view where guests see the grid (web or mobile **album** screen — same event/album). | New items appear in the **gallery grid** (same surface as other guest-visible gallery media). |
| AC3-3 | Open the event **thread / chat** side (if separate from gallery in your product). | **No** expectation of **N** separate chat messages for the bulk (bulk should **not** flood thread as individual chat posts). If product still mirrors some activity elsewhere, log **bug** with screenshot and clarify intended behavior with PM. |
| AC3-4 | Optional API/network check | `createFeedItem` (or equivalent) uses **album / gallery** context (e.g. `context: ALBUM`, linked album id) — for QA who use DevTools, confirm requests align with gallery pipeline, not thread-only endpoints. |

---

## AC4 — Progress indicator for large batches

| ID | Steps | Expected |
|----|--------|----------|
| AC4-1 | Upload **10+** files | While busy: **progress bar** fills; caption shows **`done` / `total` · `%` · current filename**. |
| AC4-2 | Upload **1** small file | Progress may be brief; ends with success state, no spinner stuck. |
| AC4-3 | Large / slow network simulation (throttle in DevTools) | Bar and counts **advance**; button shows **Uploading…** with spinner; **Choose files** disabled until batch completes. |
| AC4-4 | After completion | Busy state clears; bar hidden or at 100%; button returns to **Choose files**. |

---

## AC5 — Only event organizers / photographers have access

Map product language to **implemented** roles for this build:

| Role (test user) | Access to **Gallery · Mass upload** |
|------------------|--------------------------------------|
| Event **creator** (`createdBy` = user) | **Yes** |
| Album **OWNER** | **Yes** |
| Album **ADMIN** | **Yes** |
| Member / co-host / bouncer / line-up (no OWNER/ADMIN, not creator) | **No** |
| Not on album | **No** |

| ID | Steps | Expected |
|----|--------|----------|
| AC5-1 | Creator who is **demoted** or loses album role — still creator | Still **has** access (creator path). |
| AC5-2 | Non-creator **ADMIN** | **Has** access. |
| AC5-3 | Non-creator **member** with no ADMIN/OWNER | **No** access. |
| AC5-4 | If product defines **“photographer”** as a distinct role | Confirm with engineering whether photographer = **ADMIN** or a future role; file gap if photographers should have access but **ADMIN** is not assigned in your invite flow. |

---

## Negative & edge cases

| ID | Steps | Expected |
|----|--------|----------|
| N1 | Start upload; **refresh** mid-batch | Document behavior (partial gallery items vs retry); note if UX should warn. |
| N2 | Revoke session / **logout** in another tab during upload | Second tab behavior documented; no silent data corruption. |
| N3 | Invalid / zero-byte file | Error summary (red line); partial success message lists failed files (up to shown limit). |
| N4 | R2 / network **failure** for one file in a batch | Others continue; **partial** error text; success count matches gallery. |
| N5 | **Disabled** state when `disabled` (e.g. no user id edge case) | Button not clickable. |

---

## Sign-off checklist

- [ ] AC1 — Location and visibility on event detail page  
- [ ] AC2 — Multi-select, images + videos, 40-file cap messaging  
- [ ] AC3 — Items visible in **gallery**; thread not spammed  
- [ ] AC4 — Progress bar + counts + filename during batch  
- [ ] AC5 — Creator, OWNER, ADMIN only; others denied  

**Tester:** _________________ **Date:** _________________ **Build / commit:** _________________  

**Notes / defects:**

________________________________________________________________________________

________________________________________________________________________________
