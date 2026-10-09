/**
 * PART-3, floor plans are for venue accounts, in a real headed Chromium: sign in through the login form and
 * check that every screen offers exactly what the API says this account may do. Nothing is hardcoded about
 * the account: the expectations are read off the GET /api/floor-plans answer the page itself received.
 *
 *   QA_EMAIL=... QA_PASSWORD=... node scripts/qa/floorPlanGate.cjs
 *
 *   SITE              the web app under test (default http://localhost:5174, a production build: see README)
 *   QA_EMAIL          a vendor account. Its own answer from the deployed API is the case that is checked.
 *   QA_PASSWORD       its password. Never printed.
 *   FLOOR_PLAN_APIS   optional. Comma-separated origins that answer /api/floor-plans instead of the deployed
 *                     API, one case each: PXIStudio-App `npm run floorplan:local-api`, which serves a backend
 *                     checkout as a named account and writes nothing. Run one as a venue account, one as an
 *                     account that kept a venue from before the rule, and one as an account with neither.
 *   PXI_QA_DIR        where screenshots go (default scripts/qa/.artifacts)
 *
 * A create is only ever attempted for an account the API says cannot create, so the run writes nothing.
 * Run it headed. Cloudflare refuses a headless Chromium on dev.pxispace.com (README, point 1).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITE = process.env.SITE || 'http://localhost:5174';
const APIS = (process.env.FLOOR_PLAN_APIS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const EMAIL = process.env.QA_EMAIL;
const PASSWORD = process.env.QA_PASSWORD;
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net|clarity\.ms|tiktok\.com|googlesyndication\.com/;

if (!EMAIL || !PASSWORD) {
    console.error('Set QA_EMAIL and QA_PASSWORD (a vendor account).');
    process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const results = [];
const check = (name, ok, detail = '') => {
    if (!ok) failures += 1;
    const line = `${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${String(detail).slice(0, 220)}` : ''}`;
    results.push(line);
    console.log(line);
};
const note = (m) => console.log(`NOTE  ${m}`);

(async () => {
    const browser = await chromium.launch({ headless: false });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());

    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text().slice(0, 240)); });
    page.on('pageerror', (e) => consoleErrors.push(`PAGE ERROR: ${String(e.message).slice(0, 240)}`));

    // The last GET /api/floor-plans answer the page was given, and where floor plan requests go.
    let answer = null;
    let origin = '';
    const cors = { 'content-type': 'application/json', 'access-control-allow-origin': SITE, 'access-control-allow-credentials': 'true' };
    await ctx.route(/\/api\/floor-plans(\?|$)/, async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (!origin) {
            const res = await route.fetch();
            if (req.method() === 'GET' && res.ok()) answer = await res.json().catch(() => null);
            return route.fulfill({ response: res });
        }
        const res = await ctx.request.fetch(`${origin}${url.pathname}${url.search}`, {
            method: req.method(), headers: { origin: SITE, 'content-type': 'application/json' }, data: req.postData() || undefined, failOnStatusCode: false,
        });
        const body = await res.body();
        if (req.method() === 'GET' && res.ok()) { try { answer = JSON.parse(body.toString('utf8')); } catch { answer = null; } }
        return route.fulfill({ status: res.status(), headers: cors, body });
    });

    const settle = (ms = 1800) => page.waitForTimeout(ms);
    const open = async (pathAndQuery, wait = 3500) => {
        await page.goto(`${SITE}${pathAndQuery}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await settle(wait);
    };
    const mainText = async () => ((await page.locator('main').count()) ? (await page.locator('main').first().innerText()).replace(/\s+/g, ' ').trim() : '');
    const count = (selector) => page.locator(selector).count();

    // ── sign in, by typing into the real form ────────────────────────────────────────────────────────────
    await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);
    const e = page.locator('input[type="email"]').first();
    await e.click(); await e.pressSequentially(EMAIL, { delay: 8 });
    const p = page.locator('input[type="password"]').first();
    await p.click(); await p.pressSequentially(PASSWORD, { delay: 8 });
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2500);
    check('signed in through the login form', !/\/login/.test(new URL(page.url()).pathname), page.url());

    for (const [index, api] of (APIS.length ? APIS : ['']).entries()) {
        origin = api;
        answer = null;
        if (api) note(`case ${index + 1}: floor plan requests are answered by ${api}, not by the deployed API`);

        // ── the Command Center: the sidebar, and the card that leads to venues ───────────────────────────
        await open('/dashboard', 5000);
        if (!answer) {
            check('the dashboard asked the API what this account may do with floor plans', false, 'no GET /api/floor-plans answer was seen; is the account a vendor?');
            continue;
        }
        const plans = Array.isArray(answer.floorPlans) ? answer.floorPlans : [];
        const canCreate = answer.canCreate !== false;
        const canOpen = canCreate || plans.length > 0;
        const who = canCreate ? 'a venue account' : plans.length ? 'not a venue account, with a venue saved before the rule' : 'not a venue account, nothing saved';
        const tag = canCreate ? 'venue-account' : plans.length ? 'kept' : 'none';
        const T = `[${who}]`;
        note(`${T} the API said canCreate=${answer.canCreate}, ${plans.length} saved`);

        check(`${T} sidebar: Venues is ${canOpen ? 'offered' : 'not offered'}`, ((await count('aside a[href="/dashboard/floor-plans"], nav a[href="/dashboard/floor-plans"]')) > 0) === canOpen);
        const moat = page.locator('main a', { hasText: 'Where the room was alive' }).first();
        if (await moat.count()) {
            const href = await moat.getAttribute('href');
            check(`${T} Command Center: the heat map card leads to ${canOpen ? 'Venues' : 'the heat map, not to Venues'}`, href === (canOpen ? '/dashboard/floor-plans' : '/dashboard/analytics'), href);
        } else {
            note(`${T} the Command Center shows no "Where the room was alive" card for this account`);
        }

        // ── the Venues page ──────────────────────────────────────────────────────────────────────────────
        await open('/dashboard/floor-plans');
        const venues = await mainText();
        check(`${T} Venues: "New venue" is ${canCreate ? 'offered' : 'not offered'}`, ((await page.getByRole('button', { name: 'New venue', exact: true }).count()) > 0) === canCreate);
        if (!canOpen) {
            check(`${T} Venues: says it is for venue accounts, and offers nothing else`, (await count('[data-floor-plans="venue-accounts-only"]')) === 1 && /Venues are for venue accounts/i.test(venues) && !/No venues yet/i.test(venues), venues);
        } else if (!canCreate) {
            check(`${T} Venues: the saved venues are listed and can still be edited`, plans.every((plan) => venues.includes(plan.name)) && (await page.getByRole('button', { name: 'Edit', exact: true }).count()) === plans.length, venues);
            check(`${T} Venues: says the saved venues keep working`, (await count('[data-floor-plans="kept"]')) === 1);
        } else if (plans.length) {
            check(`${T} Venues: the saved venues are listed`, plans.every((plan) => venues.includes(plan.name)), venues);
        } else {
            check(`${T} Venues: "No venues yet."`, /No venues yet/i.test(venues), venues);
        }
        await page.screenshot({ path: path.join(OUT, `floor-plans-${tag}.png`), fullPage: true });

        // A link from the heat map ("turn this into a venue") must not open the form for someone who cannot save it.
        await open('/dashboard/floor-plans?seedLat=40.7093&seedLng=-73.9231');
        check(`${T} Venues, from a "turn this into a venue" link: the form ${canCreate ? 'opens' : 'stays shut'}`, /Step \d of 3/i.test(await mainText()) === canCreate);

        // ── creating an event ────────────────────────────────────────────────────────────────────────────
        await open('/dashboard/events/new', 4500);
        const create = await mainText();
        check(`${T} new event: "Use a saved venue" is ${canOpen ? 'offered' : 'not offered'}`, /Use a saved venue/i.test(create) === canOpen);
        if (canOpen && plans.length) check(`${T} new event: the saved venues can be picked`, plans.every((plan) => create.includes(plan.name)));

        // ── the heat map on Analytics, when this account has an event to draw one for ────────────────────
        await open('/dashboard/analytics', 8000);
        if (/spatial intelligence/i.test(await mainText())) {
            const createLinks = await count('main a[href^="/dashboard/floor-plans?eventId="]');
            const attach = await page.getByRole('button', { name: 'Attach a saved venue', exact: true }).count();
            const attached = (await page.getByRole('link', { name: 'Recalibrate', exact: true }).count()) > 0;
            if (!canCreate) check(`${T} heat map: no way to add a venue is offered`, createLinks === 0, `${createLinks} link(s) to add one`);
            if (attached) note(`${T} heat map: the event already has a venue attached, so attaching is not on offer to anyone`);
            else check(`${T} heat map: "Attach a saved venue" is ${canOpen ? 'offered' : 'not offered'}`, (attach > 0) === canOpen);
        } else {
            note(`${T} heat map: this account has no event with analytics, so the card was not on the page`);
        }

        // ── the API itself, for an account that may not create ───────────────────────────────────────────
        if (!canCreate && origin) {
            const res = await ctx.request.fetch(`${origin}/api/floor-plans`, {
                method: 'POST', headers: { 'content-type': 'application/json' }, data: JSON.stringify({ name: 'QA', address: '1 QA St', venueLat: 40.7, venueLng: -74 }), failOnStatusCode: false,
            });
            const body = await res.json().catch(() => ({}));
            check(`${T} API: creating a floor plan is refused as VENUE_ACCOUNT_REQUIRED`, res.status() === 403 && body.code === 'VENUE_ACCOUNT_REQUIRED', `${res.status()} ${body.code || ''}`);
        } else if (!canCreate) {
            note(`${T} the refusal itself was not called: against the deployed API that needs this account's token (npm run test:floorplan-gate covers it)`);
        }
    }

    check('browser console: no errors', consoleErrors.length === 0, consoleErrors.join(' | '));
    fs.writeFileSync(path.join(OUT, 'floor-plan-gate-results.txt'), `${results.join('\n')}\n`);
    console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL PASS'} of ${results.length}`);
    await browser.close();
    process.exit(failures ? 1 : 0);
})().catch((err) => {
    console.error('RUN FAILED:', err.message);
    process.exit(1);
});
