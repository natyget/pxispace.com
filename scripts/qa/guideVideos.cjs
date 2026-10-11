/**
 * Short guide videos for the staff screens (PART-7), recorded from the real pages on the deployed API.
 *
 *   SUPER_EMAIL=... SUPER_PASSWORD=... MANAGER_EMAIL=... MANAGER_PASSWORD=... \
 *   AMBASSADOR_EMAIL=... AMBASSADOR_PASSWORD=... FFMPEG=/path/to/ffmpeg node scripts/qa/guideVideos.cjs
 *
 * One clip per sign-in given, about a minute each, 1280x720, no sound: a caption bar says what is happening
 * and a dot shows where the pointer is.
 *
 *   1-super-admin   Admin, Accounts: set a person up in one Save, set up an ambassador, take access away
 *   2-ambassador    Venue claims: raise a claim on a venue
 *   3-manager       Venue claims: add and remove an ambassador, decide a claim
 *
 *   SITE         the web app (default http://localhost:5174, a production build of the deployed commit)
 *   API          the deployed API (default https://dev.pxispace.com)
 *   FFMPEG       an ffmpeg binary. With it each clip is trimmed and written as .mp4; without it the
 *                recorder's own .webm is left as it is, which plays in Chrome and not on a phone.
 *   GUIDE_DIR    where the clips go (default scripts/qa/.artifacts/guide)
 *   ONLY         comma-separated clip names, to record some of them again
 *
 * THIS WRITES to the deployed database, through the screens, the same way a person following the video
 * would: it sets @qa_fan6 up as city admin and regional manager and @qa_fan5 as an ambassador, raises one
 * claim on a venue for @qa_organizer, and adds @qa_fan3 to the manager's team. It then undoes each of them:
 * the two accounts go back to no staff access, the claim is REJECTED (never approved, so nobody gains a
 * venue), and @qa_fan3 leaves the team. A rejected claim and the audit rows stay behind.
 *
 * What a viewer sees of other people: on Accounts the table is blurred until the search has narrowed it to
 * the one account being set up, so no other account's email is on screen. Check the frames before sending a
 * clip to anyone outside the team.
 *
 * Run it headed (README, point 1). Passwords are never printed and no sign-in is recorded: each person signs
 * in off camera and the clip starts on their dashboard.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const SITE = process.env.SITE || 'http://localhost:5174';
const API = (process.env.API || 'https://dev.pxispace.com').replace(/\/$/, '');
const OUT = process.env.GUIDE_DIR || path.join(__dirname, '.artifacts', 'guide');
const FFMPEG = process.env.FFMPEG || '';
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const SIZE = { width: 1280, height: 720 };
const who = (prefix) => (process.env[`${prefix}_EMAIL`] && process.env[`${prefix}_PASSWORD`] ? { email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] } : null);
const SIGN_INS = { superAdmin: who('SUPER'), manager: who('MANAGER'), ambassador: who('AMBASSADOR') };
// Accounts on dev the clips use. The first three must have no staff or sales role when a clip starts.
const T = { setUp: 'qa_fan6', under: 'qa_fan5', added: 'qa_fan3', underManager: 'qa_rm_nyc', vendor: 'qa_organizer' };
// The note typed on camera, and the one left on a claim that has to be rejected off camera.
const SHOWN_NOTE = 'Spoke to the owner, this is their account';
const CLAIM_NOTE = 'Guide video: a test claim';
const OFF = { adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null };
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net|clarity\.ms|tiktok\.com|googlesyndication\.com/;

fs.mkdirSync(OUT, { recursive: true });
const note = (m) => console.log(`NOTE  ${m}`);

/**
 * Drawn inside the page so it is part of the picture: a caption bar, a pointer dot, a full-screen card for
 * the title, a ring around the thing being talked about, and a blur over table rows. What is showing is kept
 * in sessionStorage, so it is still there after the page navigates.
 */
function overlay(initial) {
    const KEY = 'guide.state';
    if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, JSON.stringify(initial));
    const read = () => JSON.parse(sessionStorage.getItem(KEY) || '{}');
    const write = (patch) => sessionStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
    const CSS = `
        #guide-caption{position:fixed;left:0;right:0;bottom:0;z-index:2147483646;padding:15px 28px 17px;background:rgba(8,8,10,.93);color:#fff;font:600 22px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;pointer-events:none;border-top:1px solid rgba(255,255,255,.14)}
        #guide-caption:empty{display:none}
        #guide-pointer{position:fixed;z-index:2147483647;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:rgba(168,85,247,.62);border:2px solid #fff;pointer-events:none;left:-60px;top:-60px;transition:left .55s ease,top .55s ease}
        #guide-pointer.press{animation:guide-press .5s ease-out}
        @keyframes guide-press{0%{box-shadow:0 0 0 0 rgba(168,85,247,.8)}100%{box-shadow:0 0 0 28px rgba(168,85,247,0)}}
        #guide-card{position:fixed;inset:0;z-index:2147483645;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:#0b0b0d;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;padding:0 90px;pointer-events:none}
        #guide-card.on{display:flex}
        #guide-card b{font-size:46px;line-height:1.14;font-weight:800;letter-spacing:-.01em}
        #guide-card span{font-size:23px;line-height:1.4;color:rgba(255,255,255,.66)}
        #guide-card i{font:600 14px/1 system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#a855f7;font-style:normal}
        .guide-ring{outline:3px solid #a855f7 !important;outline-offset:5px !important;border-radius:12px}
        html.guide-blur tbody{filter:blur(10px)}
    `;
    const apply = () => {
        // A page's scripts first run before the document has an <html> element, let alone a body.
        const root = document.documentElement;
        if (!root) return;
        const s = read();
        root.classList.toggle('guide-blur', Boolean(s.blur));
        if (!document.body || !document.head) return;
        if (!document.getElementById('guide-style')) {
            const style = document.createElement('style');
            style.id = 'guide-style';
            style.textContent = CSS;
            document.head.appendChild(style);
        }
        const el = (id) => {
            let node = document.getElementById(id);
            if (!node) {
                node = document.createElement('div');
                node.id = id;
                document.body.appendChild(node);
            }
            return node;
        };
        const caption = el('guide-caption');
        if (caption.textContent !== (s.caption || '')) caption.textContent = s.caption || '';
        const card = el('guide-card');
        const html = s.card ? `<i>PXI guide</i><b></b><span></span>` : '';
        if (Boolean(s.card) !== card.classList.contains('on') || (s.card && card.dataset.title !== s.card.title)) {
            card.innerHTML = html;
            if (s.card) {
                card.querySelector('b').textContent = s.card.title;
                card.querySelector('span').textContent = s.card.sub || '';
                card.dataset.title = s.card.title;
            }
            card.classList.toggle('on', Boolean(s.card));
        }
        const pointer = el('guide-pointer');
        pointer.style.display = s.card ? 'none' : '';
        if (s.x != null && !pointer.dataset.placed) {
            pointer.style.left = `${s.x}px`;
            pointer.style.top = `${s.y}px`;
            pointer.dataset.placed = '1';
        }
    };
    window.__guide = {
        set(patch) { write(patch); apply(); },
        press() {
            const pointer = document.getElementById('guide-pointer');
            if (!pointer) return;
            pointer.classList.remove('press');
            void pointer.offsetWidth;
            pointer.classList.add('press');
        },
    };
    window.addEventListener('mousemove', (e) => {
        const pointer = document.getElementById('guide-pointer');
        if (pointer) {
            pointer.style.left = `${e.clientX}px`;
            pointer.style.top = `${e.clientY}px`;
            pointer.dataset.placed = '1';
        }
        write({ x: e.clientX, y: e.clientY });
    }, true);
    // Started before the first attempt, so nothing that goes wrong in it can leave the page without the card
    // and the blur. The app also re-renders the document as it loads: this puts back anything it dropped.
    const safely = () => { try { apply(); } catch { /* the document is not ready for it yet */ } };
    document.addEventListener('DOMContentLoaded', safely);
    setInterval(safely, 100);
    safely();
}

(async () => {
    const browser = await chromium.launch({ headless: false });
    const made = [];
    let touched = false; // a clip changed something on the API
    let claimed = null; // the venue the ambassador's clip raised a claim on

    /** Signs in through the login form, off camera, and returns the session to start a clip from. */
    async function session(label, creds) {
        const ctx = await browser.newContext({ viewport: SIZE });
        const page = await ctx.newPage();
        await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());
        await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(3000);
        const e = page.locator('input[type="email"]').first();
        await e.click(); await e.pressSequentially(creds.email, { delay: 8 });
        const p = page.locator('input[type="password"]').first();
        await p.click(); await p.pressSequentially(creds.password, { delay: 8 });
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 45000 }).catch(() => {});
        await page.waitForTimeout(2500);
        if (/\/login/.test(new URL(page.url()).pathname)) throw new Error(`${label}: the sign-in was refused`);
        const state = await ctx.storageState();
        await ctx.close();
        return state;
    }

    /** One clip: a recorded page that starts signed in, with the title card up while the first page loads. */
    async function clip(name, card, state, startPath, body) {
        const dir = path.join(OUT, `.raw-${name}`);
        fs.rmSync(dir, { recursive: true, force: true });
        const ctx = await browser.newContext({ viewport: SIZE, storageState: state, recordVideo: { dir, size: SIZE } });
        await ctx.addInitScript(overlay, { card, caption: '', blur: Boolean(card.blur) });
        const t0 = Date.now();
        const page = await ctx.newPage();
        await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());
        const wait = (ms) => page.waitForTimeout(ms);
        const until = async (fn, timeout = 20000) => {
            const end = Date.now() + timeout;
            for (;;) {
                if (await fn().catch(() => false)) return true;
                if (Date.now() > end) throw new Error(`${name}: waited ${timeout / 1000}s for something that did not happen`);
                await wait(200);
            }
        };
        const set = (patch) => page.evaluate((p) => window.__guide.set(p), patch);
        const g = {
            page, wait, until,
            /** The browser's own request to the API, as the signed-in person. */
            call: (method, pathname, data) => page.evaluate(async (a) => {
                const res = await fetch(a.api + a.pathname, {
                    method: a.method,
                    headers: { 'content-type': 'application/json', authorization: `Bearer ${localStorage.getItem('pxi_token')}` },
                    body: a.data === undefined ? undefined : JSON.stringify(a.data),
                });
                return { status: res.status, body: await res.json().catch(() => ({})) };
            }, { api: API, method, pathname, data }),
            /** A caption, held long enough to read. */
            say: async (text, hold) => { await set({ caption: text }); await wait(hold ?? Math.max(2600, text.length * 68)); },
            blur: (on) => set({ blur: on }),
            /** Scrolls to the thing and glides the pointer onto it. */
            to: async (locator) => {
                await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                await wait(700);
                const box = await locator.boundingBox();
                await page.mouse.move(box.x + Math.min(box.width / 2, 260), box.y + box.height / 2, { steps: 2 });
                await wait(750);
            },
            ring: async (locator, ms = 1800) => {
                await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                await wait(500);
                await locator.evaluate((el) => el.classList.add('guide-ring'));
                await wait(ms);
                await locator.evaluate((el) => el.classList.remove('guide-ring')).catch(() => {});
            },
            click: async (locator) => {
                await g.to(locator);
                await page.evaluate(() => window.__guide.press());
                await wait(260);
                await locator.click();
                await wait(500);
            },
            type: async (locator, text) => {
                await g.to(locator);
                await locator.click();
                await locator.pressSequentially(text, { delay: 85 });
                await wait(500);
            },
            choose: async (locator, option) => {
                await g.to(locator);
                await page.evaluate(() => window.__guide.press());
                await wait(300);
                await locator.selectOption(option);
                await wait(900);
            },
        };

        let from = 0;
        let length = 0;
        try {
            await page.goto(`${SITE}${startPath}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
            await wait(4500); // the page loads under the title card
            from = (Date.now() - t0) / 1000;
            await wait(3000);
            await set({ card: null });
            await wait(900);
            await body(g);
            await set({ caption: '', card: { title: card.end || 'That is all.', sub: card.endSub || '' } });
            await wait(2600);
            length = (Date.now() - t0) / 1000 - from;
        } finally {
            const video = page.video();
            await ctx.close();
            const raw = await video.path();
            if (length > 0) {
                const webm = path.join(OUT, `${name}.webm`);
                fs.copyFileSync(raw, webm);
                let file = webm;
                if (FFMPEG) {
                    file = path.join(OUT, `${name}.mp4`);
                    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', from.toFixed(2), '-i', webm, '-t', length.toFixed(2), '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', '25', '-movflags', '+faststart', '-an', file]);
                    fs.rmSync(webm, { force: true });
                }
                made.push(`${path.basename(file)}  ${Math.round(length)}s  ${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} MB`);
            }
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }

    const wanted = (name) => !ONLY.length || ONLY.includes(name);
    const states = {};
    try {
        for (const [key, creds] of Object.entries(SIGN_INS)) if (creds) states[key] = await session(key, creds);

        // ═════ 1. super admin: Accounts ═══════════════════════════════════════════════════════════════════
        if (states.superAdmin && wanted('1-super-admin')) {
            await clip('1-super-admin', {
                title: 'Set up a city admin, a regional manager or an ambassador',
                sub: 'For a super admin. Admin, Accounts.',
                blur: true,
                end: 'One choice, one Save.',
                endSub: 'To change someone later, open their account and pick again.',
            }, states.superAdmin, '/dashboard/admin/users', async (g) => {
                const { page } = g;
                const staffOf = async (username) => ((await g.call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`)).body.users || []).find((u) => u.username === username);
                const start = { [T.setUp]: await staffOf(T.setUp), [T.under]: await staffOf(T.under) };
                for (const [username, u] of Object.entries(start)) {
                    if (!u || u.adminRole !== 'NONE' || u.salesRole !== 'NONE' || u.adminCityCode) throw new Error(`@${username} is missing or already has staff access: nothing was changed`);
                }
                touched = true;
                const managerId = ((await g.call('GET', '/api/admin/sales/managers')).body.managers || []).find((m) => m.username === T.underManager)?.id;
                if (!managerId) throw new Error(`@${T.underManager} is not a regional manager on this API`);

                const rowOf = (username) => page.locator('tbody tr').filter({ has: page.getByRole('cell', { name: username, exact: true }) }).first();
                const setup = page.locator('[data-staff-setup]');
                const choice = setup.getByLabel('Set up as');
                const save = setup.getByRole('button', { name: 'Save', exact: true });
                const search = page.locator('input[type="search"]').first();
                const notice = page.locator('[data-admin-notice]');
                // Other people's rows are never shown: the table stays blurred until the search has one answer.
                const find = async (username) => {
                    await g.blur(true);
                    await g.to(search);
                    await search.click();
                    await search.fill('');
                    await search.pressSequentially(username, { delay: 85 });
                    await g.until(async () => (await rowOf(username).count()) === 1 && (await page.locator('tbody tr').count()) === 1);
                    await g.wait(300);
                    await g.blur(false);
                    await g.wait(700);
                };
                const savedAs = (pattern) => g.until(async () => pattern.test((await notice.innerText().catch(() => '')) || '') && (await setup.count()) === 0);

                await g.say('Go to Admin, then Accounts.', 900);
                const nav = page.locator('a[href="/dashboard/admin/users"]').first();
                if (await nav.count()) await g.ring(nav, 2000);
                await g.say('Find the person. Search by email or username.', 1200);
                await find(T.setUp);
                await g.say('Click their row to open it.', 1400);
                await g.click(rowOf(T.setUp));
                await g.until(async () => (await setup.count()) === 1);
                await g.wait(900);
                await g.say('Staff access shows what this account can do right now.', 1200);
                await g.ring(setup.locator('[data-staff-now]'), 2200);
                await g.say('Under "Set up as", pick what this person is.', 1400);
                await g.choose(choice, { label: 'City admin and regional manager' });
                await g.say('Pick their city.', 1000);
                await g.choose(setup.getByLabel('City', { exact: true }), { label: 'New York' });
                await g.say('The line below says what they will be able to do.', 800);
                await g.ring(setup.locator('[data-staff-hint]'), 2600);
                await g.say('Press Save. The role, the city and the sales role are set together.', 1500);
                await g.click(save);
                await savedAs(new RegExp(`@${T.setUp} is now: city admin and regional manager`));
                await g.say('Saved. The page says who is now what, and the row shows both roles.', 800);
                await g.ring(notice, 2400);
                await g.ring(rowOf(T.setUp), 2200);

                await g.say('An ambassador is set up the same way. Find them and open their row.', 1800);
                await find(T.under);
                await g.click(rowOf(T.under));
                await g.until(async () => (await setup.count()) === 1);
                await g.wait(900);
                await g.say('Choose Ambassador, then the regional manager they work under.', 1200);
                await g.choose(choice, { label: 'Ambassador' });
                await g.choose(setup.getByLabel('Regional manager', { exact: true }), { value: managerId });
                await g.say("An ambassador works in their manager's city. Press Save.", 1600);
                await g.click(save);
                await savedAs(new RegExp(`@${T.under} is now: ambassador`));
                await g.ring(rowOf(T.under), 2400);

                await g.say('To take staff access away, open the account and choose "No staff access".', 2000);
                await g.click(rowOf(T.under));
                await g.until(async () => (await setup.count()) === 1);
                await g.wait(700);
                await g.choose(choice, { label: 'No staff access' });
                await g.click(save);
                await savedAs(new RegExp(`@${T.under} has no staff access now`));
                await g.say('Done. It is an ordinary account again.', 2600);
            });
        }

        // ═════ 2. ambassador: raise a claim ═══════════════════════════════════════════════════════════════
        if (states.ambassador && wanted('2-ambassador')) {
            await clip('2-ambassador', {
                title: 'Raise a claim on a venue',
                sub: 'For an ambassador. Venue Claims.',
                end: 'Your regional manager decides it.',
                endSub: 'Once approved, the venue account sees its venue on PXI.',
            }, states.ambassador, '/dashboard', async (g) => {
                const { page } = g;
                const venues = (await g.call('GET', '/api/sales/venues')).body.venues || [];
                const free = venues.filter((v) => !v.claimed && !v.claimPending && v.name);
                const venue = free.find((v) => v.address && v.name.length <= 32) || free.find((v) => v.name.length <= 32) || free[0];
                if (!venue) throw new Error('no venue in this territory is free to claim: nothing was changed');
                const typed = venue.name.split(/\s+/).slice(0, 2).join(' ');
                touched = true;

                await g.say('Open Venue Claims in the sidebar.', 1200);
                await g.click(page.locator('a[href="/dashboard/sales"]').first());
                await g.until(async () => /raise a claim/i.test(await page.locator('main').innerText()));
                await g.wait(1200);
                await g.say('Here you put a venue forward for its owner. Your regional manager approves it.', 3600);
                const panel = page.locator('section', { has: page.getByRole('heading', { name: /raise a claim/i }) }).first();
                const venueSearch = panel.locator('input[type="search"]');
                await g.say('Search for the venue. Only venues in your city are listed.', 1200);
                await g.type(venueSearch, typed);
                const pick = panel.getByRole('button', { name: new RegExp(venue.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
                await g.until(async () => (await pick.count()) === 1);
                await g.wait(700);
                await g.say('Pick it from the list.', 1000);
                await g.click(pick);
                const vendorBox = panel.getByPlaceholder('Vendor account username (exact)');
                await g.until(async () => (await vendorBox.count()) === 1);
                await g.say("Type the username of the venue's own PXI account, exactly.", 1400);
                await g.type(vendorBox, T.vendor);
                await g.say('Add a note for your manager if it helps.', 1000);
                await g.type(panel.getByPlaceholder('Note for the approver (optional)'), SHOWN_NOTE);
                await g.say('Press Send for approval.', 1200);
                await g.click(panel.getByRole('button', { name: /send for approval/i }));
                await g.until(async () => /sent for approval/i.test(await panel.innerText()));
                claimed = venue;
                await g.say('Sent. It now waits for your regional manager.', 2400);
                const mine = page.locator('section', { has: page.getByRole('heading', { name: /claims you raised/i }) }).first();
                await g.say('Follow it under "Claims you raised".', 800);
                await g.ring(mine.locator('li', { hasText: venue.name }).first(), 3000);
            });
        }

        // ═════ 3. regional manager: the team, and deciding a claim ════════════════════════════════════════
        if (states.manager && wanted('3-manager')) {
            await clip('3-manager', {
                title: 'Run your team and decide its claims',
                sub: 'For a regional manager. Venue Claims.',
                end: 'Your team, your city.',
                endSub: 'You add your own ambassadors and decide the claims they raise.',
            }, states.manager, '/dashboard', async (g) => {
                const { page } = g;
                const teamBefore = ((await g.call('GET', '/api/sales/team')).body.ambassadors || []).map((a) => a.username);
                if (teamBefore.includes(T.added)) throw new Error(`@${T.added} is already on this team: nothing was changed`);
                touched = true;
                const queue = (await g.call('GET', '/api/sales/claims?view=queue')).body.claims || [];
                // Only ever the claim this run raised itself: another waiting claim is somebody's real work.
                const waiting = claimed ? queue.find((c) => c.venue.id === claimed.id && !c.raisedByMe) : null;

                await g.say('Open Venue Claims in the sidebar.', 1200);
                await g.click(page.locator('a[href="/dashboard/sales"]').first());
                const team = page.locator('[data-sales-team]');
                await g.until(async () => (await team.count()) === 1 && (await team.locator('[data-sales-team-member]').count()) === teamBefore.length);
                await g.wait(1000);
                await g.say('Two jobs here: keep your team, and decide the claims they raise.', 3200);

                const teamPanel = page.locator('section', { has: team }).first();
                await g.say('"Your ambassadors" is your team. They raise claims in your city.', 800);
                await g.ring(teamPanel, 2800);
                await g.say('To add someone, type their exact PXI username.', 1200);
                await g.type(team.getByLabel('Ambassador username'), T.added);
                await g.say('Press Add ambassador.', 1000);
                await g.click(team.getByRole('button', { name: /add ambassador/i }));
                const added = team.locator(`[data-sales-team-member="${T.added}"]`);
                await g.until(async () => (await added.count()) === 1);
                await g.say('They are on your team and can raise claims right away.', 800);
                await g.ring(added, 2600);
                await g.say('To take someone off your team, press Remove, then confirm. Their claims stay.', 1800);
                await g.click(added.getByRole('button', { name: 'Remove', exact: true }));
                await g.wait(900);
                await g.click(added.getByRole('button', { name: /yes, remove/i }));
                await g.until(async () => (await added.count()) === 0);
                await g.wait(1200);

                if (waiting) {
                    const row = page.locator('section', { has: page.getByRole('heading', { name: /waiting for your approval/i }) }).first().locator('li', { hasText: waiting.venue.name }).first();
                    await g.until(async () => (await row.count()) === 1);
                    await g.say('Claims your ambassadors raise wait here for you.', 800);
                    await g.ring(row, 2800);
                    await g.say("Check the account really is the venue. Approve gives that account the venue's analytics.", 1200);
                    await g.to(row.getByRole('button', { name: 'Approve', exact: true }));
                    await g.wait(2600);
                    await g.say('If it is not the venue, add a note and press Reject.', 1200);
                    await g.type(row.getByPlaceholder('Note (optional)'), 'Not the venue');
                    await g.click(row.getByRole('button', { name: 'Reject', exact: true }));
                    await g.until(async () => (await row.count()) === 0);
                    await g.say('Either way, a decided claim leaves this list.', 2800);
                } else {
                    note('3-manager: no claim was waiting, so the clip has no deciding part');
                }
            });
        }
    } catch (err) {
        console.log(`FAIL  ${String(err && err.message ? err.message : err).split('\n')[0]}`);
        process.exitCode = 1;
    } finally {
        // Put back whatever a clip changed and did not undo on camera. Each one needs its own signed-in page.
        if (touched) {
            const run = async (state, fn) => {
                const ctx = await browser.newContext({ viewport: SIZE, storageState: state });
                const page = await ctx.newPage();
                await page.goto(`${SITE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
                await page.waitForTimeout(2500);
                const call = (method, pathname, data) => page.evaluate(async (a) => {
                    const res = await fetch(a.api + a.pathname, { method: a.method, headers: { 'content-type': 'application/json', authorization: `Bearer ${localStorage.getItem('pxi_token')}` }, body: a.data === undefined ? undefined : JSON.stringify(a.data) });
                    return { status: res.status, body: await res.json().catch(() => ({})) };
                }, { api: API, method, pathname, data });
                const out = await fn(call).catch((e) => `could not check: ${String(e.message).split('\n')[0]}`);
                await ctx.close();
                return out;
            };
            if (states.manager) {
                note(await run(states.manager, async (call) => {
                    const done = [];
                    const team = ((await call('GET', '/api/sales/team')).body.ambassadors || []).map((a) => a.username);
                    if (team.includes(T.added)) done.push(`@${T.added} taken off the team (${(await call('DELETE', `/api/sales/team/${T.added}`)).status})`);
                    for (const c of ((await call('GET', '/api/sales/claims?view=queue')).body.claims || []).filter((x) => claimed && x.venue.id === claimed.id)) {
                        done.push(`a test claim on ${c.venue.name} rejected (${(await call('POST', `/api/sales/claims/${c.id}/reject`, { note: CLAIM_NOTE })).status})`);
                    }
                    return `manager, after the clips: ${done.join('; ') || 'nothing left to undo'}; team is ${JSON.stringify(((await call('GET', '/api/sales/team')).body.ambassadors || []).map((a) => a.username))}`;
                }));
            }
            if (states.superAdmin) {
                note(await run(states.superAdmin, async (call) => {
                    const done = [];
                    for (const username of [T.under, T.setUp]) {
                        const u = ((await call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`)).body.users || []).find((x) => x.username === username);
                        if (u && (u.adminRole !== 'NONE' || u.salesRole !== 'NONE' || u.adminCityCode)) done.push(`@${username} set back to no staff access (${(await call('POST', `/api/admin/users/${u.id}/staff-access`, OFF)).status})`);
                    }
                    const after = [];
                    for (const username of [T.setUp, T.under, T.added]) {
                        const u = ((await call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`)).body.users || []).find((x) => x.username === username);
                        after.push(`@${username}: ${u ? `${u.accountTier}/${u.adminRole}/${u.salesRole}` : 'not found'}`);
                    }
                    return `super admin, after the clips: ${done.join('; ') || 'nothing left to undo'}; ${after.join(', ')}`;
                }));
            }
        }
        for (const line of made) console.log(`CLIP  ${line}`);
        console.log(`\n${made.length} clip(s) in ${OUT}`);
        await browser.close().catch(() => {});
    }
})();
