# QA: Public profile web preview (UI-first)

Manual testing through **browsers and mobile apps only** — no Postman, curl, or direct API clients unless you choose to use them for debugging.

**Related implementation**

- Web route: `src/app/(public)/u/[id]/page.jsx`
- Client UI: `src/views/public/PublicProfileClient.jsx`
- Backend: `GET /api/users/public-profile/:id` in `pxi-backend/src/routes/user.routes.ts`

---

## Prerequisites

| Item | Notes |
|------|--------|
| Backend + web app running | Same as your usual local or staging setup |
| Test user IDs (UUIDs) | Copy from the **mobile app** (e.g. share profile / deep link / dev overlay), **admin user list**, or another **UI** that shows user id — you only need the id to paste into `/u/{id}` |
| Accounts | One user with a **full issued passport** and one **partial** (no passport) if you can get both |
| Optional | Staging/production HTTPS URL for **link unfurl** tests (iMessage, Slack, OG debuggers) |

Record environment and build/commit when filing bugs.

---

## 1. How to open the public profile (UI)

| # | Step | Expected |
|---|------|----------|
| H1 | In the **browser address bar**, go to `{your-web-origin}/u/` and paste a **valid UUID** (e.g. `http://localhost:5173/u/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) | Page loads without needing to log in |
| H2 | From **mobile Safari / Chrome**, open the same URL | Same page; layout fits the screen |
| H3 | (Optional) Paste the URL into **Notes**, **iMessage**, or **Slack** on a **deployed** HTTPS environment | See [Section 5](#5-social--link-previews-ui) for rich previews |

Invalid or unknown ids should show the **“Profile not found”** UI, not a raw JSON error page.

---

## 2. Issued passport (happy path)

| # | Step | Expected |
|---|------|----------|
| W1 | Open `/u/{uuid}` for a user who has completed passport issuance | Dark background; **full PXI Passport** (card, stamps, MRZ-style lines) |
| W2 | Scan the page for **actions** | **No** “Vendor Setup”, **no** follow / friend request / comment controls |
| W3 | **Friends** | A **number** only (read-only); not a button that opens a list or triggers a request |
| W4 | **Vendor** | If applicable, a **badge** only — no link to vendor onboarding |
| W5 | Footer | Copy indicates **preview / app** (not “update your passport here”) |
| W6 | Top of page | Public **navbar** with a way back to **PXI** / home (when the public layout shows the bar) |

---

## 3. Partial account (no passport on web)

| # | Step | Expected |
|---|------|----------|
| P1 | Open `/u/{uuid}` for a **partial** user | Short message that the passport is not shown on the web; **App Store / Play** style CTAs |
| P2 | Confirm | **No** full passport book / MRZ block for this state |

---

## 4. Not found and bad URLs

| # | Step | Expected |
|---|------|----------|
| N1 | Use a **random UUID** that does not exist | Friendly **not found** message + link back (e.g. to home) |
| N2 | Tamper with the URL (e.g. remove a character from the UUID) | Same not-found or empty state — **no** stack trace in the UI |

---

## 5. Responsive layout (UI)

| # | Step | Expected |
|---|------|----------|
| R1 | **Desktop** browser (wide window) | Passport centered; readable; no broken layout |
| R2 | **Resize** the window to phone width or use DevTools device toolbar | Card scales; nothing important clipped |
| R3 | **Real phone** | Same; scrolling works; no horizontal overflow on the main content |

---

## 6. “Open in app” banner (mobile web only)

| # | Step | Expected |
|---|------|----------|
| O1 | On a **narrow** viewport (phone or DevTools mobile emulation) | A **fixed bottom** strip: “Open in PXI” (or similar) |
| O2 | Widen to **tablet/desktop** | Banner **disappears** |
| O3 | Tap **Open** | Navigates to the **HTTPS** profile URL (same profile; Universal Links can take over when configured) |
| O4 | **iPhone** safe area | Banner sits above the home indicator / not obscured awkwardly |

---

## 7. Social & link previews (UI)

Use a **public HTTPS** URL (staging/production). Localhost will not unfurl in most apps.

| # | Step | Expected |
|---|------|----------|
| S1 | Open the profile URL in a **desktop browser** → **View Page Source** (or DevTools → Elements) | Meta tags for title/description and Open Graph / Twitter are present for an issued user |
| S2 | Paste the URL into **[opengraph.xyz](https://www.opengraph.xyz/)** or Meta’s [Sharing Debugger](https://developers.facebook.com/tools/debug/) | Title, description, and image (or fallback) after cache refresh |
| S3 | Send the link in **iMessage** | Rich preview (title + image) when the image URL is publicly reachable |
| S4 | Paste in **Slack** or **Discord** | Unfurl shows title and preview |

---

## 8. Privacy spot-check (browser UI only)

| # | Step | Expected |
|---|------|----------|
| X1 | **DevTools → Network** → reload `/u/{uuid}` → find the **`public-profile`** request → **Response** preview | You should **not** see **`email`**, **`phoneNumber`**, or raw **`birthdate`** in the JSON |
| X2 | **View Page Source** | No obvious secrets beyond public metadata |
| X3 | (Optional) Log into the **same site** in another tab as a **different** user, then open `/u/{someone-else}` | Still **read-only** — no edit controls on the public profile |

---

## 9. Mobile app: open link from the OS UI

No `adb` required unless you prefer it.

| # | Step | Expected |
|---|------|----------|
| M1 | On **Android**, tap `https://pxispace.com/u/{uuid}` from **Chrome**, **Messages**, or **Gmail** | **Installed** app opens to the **user profile** flow when App Links are verified |
| M2 | On **iOS**, tap the same link from **Safari**, **Notes**, or **Messages** | App opens when **Universal Links** + **AASA** are configured for `/u/*` |
| M3 | Confirm in-app | Lands on the **user / passport** screen for that id (not a blank screen) |

If the link stays in Safari, treat as **configuration** (AASA / intent filters), not necessarily a QA fail of the web page itself.

---

## 10. Smoke: performance and console

| # | Step | Expected |
|---|------|----------|
| F1 | Reload the same profile a few times | No wrong user flash; no obvious stuck loading |
| F2 | **DevTools → Console** on happy path | No red uncaught errors |

---

## 11. Sign-off checklist (UI)

- [ ] Issued passport page looks correct and is **read-only**  
- [ ] Partial user sees the **partial** message + store CTAs  
- [ ] Unknown UUID shows **not found** UI  
- [ ] Mobile vs desktop layout OK; **Open in app** banner only on small screens  
- [ ] Link preview smoke-tested on a **public HTTPS** URL (optional but recommended before release)  
- [ ] Optional: Network tab confirms **no** email/phone/birthdate in `public-profile` response  
- [ ] Optional: Universal Links / App Links open the app from a real device  

---

## Bug report template

```
Title: [Public profile] <short description>
Environment: local / staging / prod | browser + OS version
URL: https://.../u/<uuid>
Steps:
1.
2.
Expected:
Actual:
Screenshots / screen recording: (attach)
```
