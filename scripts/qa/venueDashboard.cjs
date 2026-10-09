/**
 * VEN-8, the venue dashboard, in a real headed Chromium: sign in through the login form, open each venue
 * the account owns, and check that every card shows what the API actually answered. Nothing is hardcoded
 * about the data: the expectations are read off the responses the page itself received, so the same run
 * works on a venue with nothing, with one night, or with years of them.
 *
 *   QA_EMAIL=... QA_PASSWORD=... node scripts/qa/venueDashboard.cjs
 *
 *   SITE         the web app under test (default http://localhost:5174, a production build: see README)
 *   QA_EMAIL     an account that owns at least one venue (on dev: the QA venue owner)
 *   QA_PASSWORD  its password. Never printed.
 *   LOCAL_API    optional. Answer /api/venue-analytics/* from this origin instead of the deployed API.
 *                For a backend branch that is not deployed yet: PXIStudio-App `npm run venue:local-api`.
 *   NOT_MINE     optional. A venue id the account does not own, to see the refusal.
 *   ONLY         optional. Comma-separated venue names or ids to limit the run to.
 *   PXI_QA_DIR   where screenshots go (default scripts/qa/.artifacts)
 *
 * Run it headed. Cloudflare refuses a headless Chromium on dev.pxispace.com (README, point 1).
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SITE = process.env.SITE || 'http://localhost:5174';
const LOCAL_API = (process.env.LOCAL_API || '').replace(/\/$/, '');
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const EMAIL = process.env.QA_EMAIL;
const PASSWORD = process.env.QA_PASSWORD;
const NOT_MINE = process.env.NOT_MINE || '';
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net|clarity\.ms|tiktok\.com|googlesyndication\.com/;

if (!EMAIL || !PASSWORD) {
    console.error('Set QA_EMAIL and QA_PASSWORD (an account that owns a venue).');
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
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

(async () => {
    // The page's own formatting, so a time or a rate is expected exactly as the page writes it.
    const lib = await import(pathToFileURL(path.join(__dirname, '..', '..', 'src', 'lib', 'venueDashboard.js')).href);

    const browser = await chromium.launch({ headless: false });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());

    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text().slice(0, 240)); });
    page.on('pageerror', (e) => consoleErrors.push(`PAGE ERROR: ${String(e.message).slice(0, 240)}`));

    // What the page was told, keyed by "<venueId>/<what>": the expectations below are read from here.
    const seen = new Map();
    const calls = [];
    const remember = (url, status, body) => {
        const m = url.pathname.match(/\/api\/venue-analytics\/([^/]+)(?:\/(.+))?$/);
        if (!m) return;
        calls.push(`${url.pathname.replace('/api/venue-analytics', '')}${url.search} ${status}`);
        if (status === 200) seen.set(`${m[1]}/${m[2] || 'analytics'}${url.search}`, body);
    };
    if (LOCAL_API) {
        const cors = { 'content-type': 'application/json', 'access-control-allow-origin': SITE, 'access-control-allow-credentials': 'true' };
        await ctx.route(/\/api\/venue-analytics\//, async (route) => {
            const req = route.request();
            const url = new URL(req.url());
            try {
                const res = await ctx.request.fetch(`${LOCAL_API}${url.pathname}${url.search}`, {
                    method: req.method(), headers: { origin: SITE, 'content-type': 'application/json' }, data: req.postData() || undefined, failOnStatusCode: false,
                });
                const body = await res.body();
                try { remember(url, res.status(), JSON.parse(body.toString('utf8'))); } catch { remember(url, res.status(), null); }
                await route.fulfill({ status: res.status(), headers: cors, body });
            } catch (e) {
                calls.push(`${url.pathname} FAILED ${String(e.message).split('\n')[0]}`);
                await route.abort();
            }
        });
        note(`venue requests are answered by ${LOCAL_API}, not by the deployed API`);
    } else {
        page.on('response', async (r) => {
            const url = new URL(r.url());
            if (!/\/api\/venue-analytics\//.test(url.pathname) || r.request().method() !== 'GET') return;
            let body = null;
            try { body = await r.json(); } catch { /* not JSON */ }
            remember(url, r.status(), body);
        });
    }

    const text = async (sel) => ((await page.locator(sel).count()) ? (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim() : '');
    const card = (name) => `[data-venue-card="${name}"]`;
    // Card titles and night names are drawn in capitals by the stylesheet, and innerText follows it.
    const has = (shown, wanted) => shown.toLowerCase().includes(String(wanted).toLowerCase());
    const settle = (ms = 1800) => page.waitForTimeout(ms);
    const open = async (query, wait = 4000) => {
        await page.goto(`${SITE}/dashboard/venue${query}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForSelector('h1:has-text("Venue Dashboard")', { timeout: 60000 }).catch(() => {});
        await settle(wait);
    };
    const tab = async (label) => {
        await page.getByRole('tab', { name: label, exact: true }).click();
        await settle(2500);
    };
    // The dashboard scrolls inside <main>, so a full picture needs the window as tall as the content.
    const shot = async (name) => {
        const size = page.viewportSize();
        const tall = await page.evaluate(() => { const m = document.querySelector('main'); return m ? m.scrollHeight - m.clientHeight : 0; });
        if (tall > 0) { await page.setViewportSize({ width: size.width, height: size.height + tall + 8 }); await page.waitForTimeout(700); }
        await page.screenshot({ path: path.join(OUT, `venue-${name}.png`), fullPage: true });
        if (tall > 0) { await page.setViewportSize(size); await page.waitForTimeout(300); }
    };
    // Saved Segments is a dropdown: nothing is offered until the bar is opened.
    const segmentsBar = () => page.locator(`${card('audience')} [data-audience-segments] > button`);
    const segmentOptions = () => page.locator(`${card('audience')} [data-audience-segments] ul button[aria-pressed]`).allInnerTexts();
    const sideways = () => page.evaluate(() => {
        const main = document.querySelector('main');
        return document.documentElement.scrollWidth > window.innerWidth + 1 || (main && main.scrollWidth > main.clientWidth + 1);
    });

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

    await open('');
    const mine = [...seen.entries()].find(([k]) => k.startsWith('mine/'))?.[1];
    if (!mine?.venues?.length) {
        check('the account owns a venue', false, 'GET /api/venue-analytics/mine listed none; the page sends such an account back to /dashboard');
        await browser.close();
        process.exit(1);
    }
    const features = mine.features || {};
    const venues = mine.venues.filter((v) => !ONLY.length || ONLY.includes(v.id) || ONLY.includes(v.name));
    note(`venues: ${mine.venues.map((v) => v.name).join(', ')} · audiences ${features.crm ? 'on' : 'off'} · forecasts ${features.forecast ? 'released' : 'in shadow mode'}`);
    check('the sidebar offers My Venue', (await page.locator('nav, aside').filter({ hasText: 'My Venue' }).count()) > 0);

    for (const venue of venues) {
        const id = venue.id;
        const tag = slug(venue.name);
        await open(`?venueId=${id}`);
        const home = seen.get(`${id}/home`)?.home;
        const analytics = seen.get(`${id}/analytics`)?.analytics;
        const heatmap = seen.get(`${id}/heatmap`)?.heatmap;
        check(`[${venue.name}] the page got its data`, Boolean(home && analytics && heatmap), `home ${Boolean(home)}, totals ${Boolean(analytics)}, heat map ${Boolean(heatmap)}`);
        if (!home || !analytics || !heatmap) continue;
        const level = home.history.level;
        note(`[${venue.name}] history ${level}: ${home.history.measuredNights} measured nights, ${home.history.people} people · tonight ${home.tonight.length}, upcoming ${home.upcoming.length}, albums ${home.albums.length}`);

        const head = await text('header:has(h1)');
        check(`[${venue.name}] header: Venue Dashboard, the venue and its place`, /Venue Dashboard/i.test(head) && head.includes(venue.name) && head.includes(lib.venuePlace(home.venue)), head);
        check(`[${venue.name}] the page states its history level`, (await page.locator('[data-venue-level]').getAttribute('data-venue-level')) === level);
        const wantTabs = ['Home', 'Overview', ...(features.crm ? ['Audience'] : []), ...(features.forecast ? ['Plan a night'] : []), 'Guarantees'].join('|');
        const tabs = (await page.getByRole('tab').allInnerTexts()).join('|');
        check(`[${venue.name}] screens: ${wantTabs}`, tabs === wantTabs, tabs);

        // Through the Door
        const door = await text(card('door'));
        if (home.door) {
            const d = home.door;
            check(`[${venue.name}] door: ${d.ticketsSold} tickets, ${lib.doorPercent(d)}%`, door.includes(`Tickets Sold ${lib.formatInteger(d.ticketsSold)}`) && new RegExp(`\\b${lib.doorPercent(d)}\\s*%`).test(door), door);
            check(`[${venue.name}] door: LIVE only while a night is running`, /LIVE/.test(door) === (d.state === 'LIVE'));
            check(`[${venue.name}] door: every door with its scans`, d.gates.slice(0, 4).every((g) => door.includes(g.gate) && door.includes(`${lib.formatInteger(g.scans)} Scanned (${Math.round(g.share * 100)}%)`)), door);
        } else {
            check(`[${venue.name}] door: 0 and "Host an Event to Access"`, /Tickets Sold 0/.test(door) && /0\s*%/.test(door) && /Host an Event to Access/.test(door) && !/LIVE/.test(door), door);
        }

        // Recent Night Activity
        const activity = await text(card('activity'));
        const curves = await page.locator(`${card('activity')} svg path.recharts-curve`).count();
        const expectLines = (home.activity.night ? 1 : 0) + (home.activity.average || home.activity.previous ? 1 : 0);
        const hasPoints = lib.activitySeries(home.activity).rows.length > 0;
        check(`[${venue.name}] activity: ${hasPoints ? `${expectLines} line(s)` : 'no line, and the reason'}`, hasPoints ? curves === expectLines : curves === 0 && /Host an Event to Access|Limited History/.test(activity), `${curves} drawn · ${activity}`);
        const mix = lib.mixSegments(home.activity.mix);
        check(`[${venue.name}] activity: first time ${mix[0].percent}%, returning ${mix[1].percent}%`, activity.includes(`First Time (${mix[0].percent}%)`) && activity.includes(`Returning (${mix[1].percent}%)`));
        if (level === 'LIMITED' && hasPoints) check(`[${venue.name}] activity: marked Limited History`, /Limited History/.test(activity));
        if (level === 'FULL') check(`[${venue.name}] activity: not marked limited`, !/Limited History/.test(activity));

        // Tonight and upcoming
        const nights = await text(card('nights'));
        check(`[${venue.name}] tonight: ${home.tonight.length ? home.tonight[0].name : '"No Events Tonight"'}`, home.tonight.length ? has(nights, home.tonight[0].name) && /TONIGHT/.test(nights) && nights.includes(lib.formatTimeRange(home.tonight[0].startDate, home.tonight[0].endDate, home.tonight[0].timeZone)) : /No Events Tonight/.test(nights), nights);
        const later = [...home.tonight.slice(1), ...home.upcoming];
        check(`[${venue.name}] upcoming: ${later.length ? `${later.length} night(s)` : 'the empty line'}`, later.length ? later.every((n) => has(nights, n.name)) : /No Upcoming Events/.test(nights), nights);
        const ownNights = [...home.tonight, ...home.upcoming].filter((n) => n.hostedByVenue).length;
        check(`[${venue.name}] a host is named only on the venue's own nights (${ownNights})`, (nights.match(/Host:/g) || []).length === ownNights && (nights.match(/Host: You/g) || []).length === ownNights);

        // Come back, insights, albums
        const comeBack = await text(card('come-back'));
        const rate = analytics.totalAttendance > 0 && analytics.firstTimeVsRepeat.repeatRate !== null ? lib.toPercent(analytics.firstTimeVsRepeat.repeatRate) : null;
        check(`[${venue.name}] come back: ${rate === null ? 'the empty line' : `${rate}%`}`, rate === null ? /Host an Event to Access your Come Back Percentage/.test(comeBack) : new RegExp(`\\b${rate}\\s*%`).test(comeBack) && comeBack.includes(`${lib.formatInteger(analytics.firstTimeVsRepeat.repeat)} of ${lib.formatInteger(analytics.totalAttendance)}`), comeBack);
        const lines = lib.buildInsights({ home, analytics, heatmap });
        const insights = await text(card('insights'));
        check(`[${venue.name}] insights: ${lines.length ? `${lines.length} line(s), each from a figure` : '"No Current Venue Insights"'}`, lines.length ? lines.every((l) => insights.includes(l)) : /No Current Venue Insights/.test(insights), insights);
        const albums = await text(card('albums'));
        check(`[${venue.name}] albums: ${home.albums.length || '"No Active Photo Albums"'}`, home.albums.length ? home.albums.slice(0, 3).every((a) => albums.includes(a.name)) : /No Active Photo Albums/.test(albums), albums);

        // Net payout: the signed-in account's own, or nothing
        const payout = await text(card('payout'));
        check(`[${venue.name}] net payout: a week, Monday to Sunday, and the Stripe line`, /Net Payout/i.test(payout) && /\$[\d,]+/.test(payout) && /MON TUE WED THU FRI SAT SUN/.test(payout) && /Paid directly to you via Stripe/.test(payout), payout);

        // Forecast
        const forecast = await text(card('forecast'));
        const week = seen.get(`${id}/forecast/week`);
        check(`[${venue.name}] forecast: ${week ? 'a range, never one number' : '"No Current Suggestions"'}`, week && (week.nights.some((n) => n.forecast) || week.typical) ? /\d[\d,]* to \d[\d,]* people/.test(forecast) : /No Current Suggestions|Not enough history yet/.test(forecast), forecast);

        // Audience (home card)
        if (features.crm) {
            const audience = await text(card('audience'));
            const all = [...seen.entries()].find(([k]) => k.startsWith(`${id}/audience?`) && !/[?&](q|minEvents|maxEvents|eventId|weekday|ticketTier|minEngagementTier)=/.test(k))?.[1];
            check(`[${venue.name}] audience: the count`, Boolean(all) && audience.includes(`Attendance Count: ${lib.formatInteger(all.total)}`), audience);
            const own = (seen.get(`${id}/segments`)?.segments || []).map((s) => s.name);
            const offered = [...lib.AUDIENCE_PRESETS.map((x) => x.label), ...own];
            check(`[${venue.name}] saved segments: a closed dropdown on the home card`, (await text(`${card('audience')} [data-audience-segments] > button`)) === 'Saved Segments' && (await segmentOptions()).length === 0);
            if (all && all.total < lib.AUDIENCE_MIN_PEOPLE) {
                check(`[${venue.name}] audience: under ${lib.AUDIENCE_MIN_PEOPLE} people, nobody is listed on the home card`, /Not enough people to show audience details\./.test(audience) && (await page.locator(`${card('audience')} [data-audience-rows]`).count()) === 0);
                check(`[${venue.name}] saved segments: switched off on the home card with the rest, under ${lib.AUDIENCE_MIN_PEOPLE} people`, await segmentsBar().isDisabled());
            } else if (all) {
                check(`[${venue.name}] audience: people are listed by handle`, (await page.locator(`${card('audience')} [data-audience-rows] li`).count()) === Math.min(all.rows.length, 6));
                await segmentsBar().click();
                await settle(400);
                const options = await segmentOptions();
                check(`[${venue.name}] saved segments: the home dropdown opens with ${offered.length} option(s), and nothing to make or delete`, options.join('|') === offered.join('|') && (await page.locator(`${card('audience')} [data-audience-segments] :is(button:has-text("New segment"), button[aria-label^="Delete"])`).count()) === 0, options.join('|'));
                await shot(`${tag}-home-segments-open`);
                await page.keyboard.press('Escape');
                await settle(300);
                check(`[${venue.name}] saved segments: Escape closes it`, (await segmentOptions()).length === 0);
            }
        }

        // Spatial intel
        const spatial = await text(card('spatial'));
        const emptyRoom = heatmap.nights === 0 && !lib.hasRoomView(heatmap);
        check(`[${venue.name}] spatial intel: ${emptyRoom ? '"Host an event for spatial intel"' : `${heatmap.nights} night(s) combined`}`, emptyRoom ? /Host an event for spatial intel/.test(spatial) : spatial.includes(`${heatmap.nights} ${heatmap.nights === 1 ? 'night' : 'nights'} combined`) && spatial.includes(lib.formatInteger(heatmap.media.geotagged)), spatial);

        check(`[${venue.name}] no email address or phone number anywhere on the page`, !/[\w.+-]+@[\w-]+\.[a-z]{2,}|\+\d{10,}/i.test((await page.locator('main').innerText()).replace(EMAIL, '')));
        await shot(`${tag}-home`);

        // ── Overview ─────────────────────────────────────────────────────────────────────────────────────
        await tab('Overview');
        check(`[${venue.name}] the screen is in the address`, /tab=overview/.test(page.url()), page.url());
        const table = await text(card('night-by-night'));
        const rows = lib.comparisonRows(home.comparison);
        check(`[${venue.name}] night by night: the four rows`, rows.every((r) => table.includes(r.metric)), table);
        check(`[${venue.name}] night by night: the night's figures`, rows.every((r) => r.night === null || table.includes(r.night)), table);
        if (home.comparison.night && !home.comparison.average) check(`[${venue.name}] night by night: "Limited History" where the average would be`, (table.match(/Limited History/g) || []).length === 2);
        if (home.comparison.average) check(`[${venue.name}] night by night: the average and a signal on every row`, rows.every((r) => (r.average === null || table.includes(r.average)) && (r.signal === null || table.includes(r.signal))), table);
        if (!home.comparison.night) check(`[${venue.name}] night by night: no figure is invented`, !/scans\/min|\d%|Limited History/.test(table), table);
        const all = await text(card('all-nights'));
        check(`[${venue.name}] all nights: the room's totals`, all.includes(`People through the door ${lib.formatInteger(analytics.totalAttendance)}`) && all.includes(`Tickets ${lib.formatInteger(analytics.ticketsSold)}`) && all.includes(`Photos and videos ${lib.formatInteger(analytics.captureVolume)}`) && all.includes(`Nights ${lib.formatInteger(analytics.eventCount)}`), all);
        check(`[${venue.name}] who comes: ${analytics.demographics.withheld ? 'withheld, with the reason' : 'age bands and cities'}`, analytics.demographics.withheld ? all.includes(analytics.demographics.reason) : analytics.demographics.ageBands.every((b) => all.includes(b.band)), all);
        if (home.nights.length) {
            await page.locator(`${card('activity')} button:has-text("Filter")`).click();
            await settle(400);
            await page.locator(`${card('activity')} .dashboard-popover-surface button:has-text("Individual Night")`).click();
            await settle(2500);
            const options = await page.locator(`${card('activity')} select[aria-label="Night"] option`).allInnerTexts();
            check(`[${venue.name}] the chart's filter lists the ${home.nights.length} measured night(s)`, options.length === home.nights.length, options.join(' | '));
            check(`[${venue.name}] one night is drawn when picked`, (await page.locator(`${card('activity')} svg path.recharts-curve`).count()) >= 1);
        }
        await shot(`${tag}-overview`);

        // ── Audience ─────────────────────────────────────────────────────────────────────────────────────
        if (features.crm) {
            await tab('Audience');
            const listed = [...seen.entries()].filter(([k]) => k.startsWith(`${id}/audience?`) && /take=50/.test(k) && !/[?&](q|minEvents|maxEvents|eventId|weekday|ticketTier|minEngagementTier)=/.test(k)).pop()?.[1];
            const aud = await text(card('audience'));
            check(`[${venue.name}] audience screen: the count`, Boolean(listed) && aud.includes(`Attendance Count: ${lib.formatInteger(listed.total)}`), aud);
            if (listed?.total > 0) {
                const heads = (await page.locator(`${card('audience')} thead th`).allInnerTexts()).join('|');
                check(`[${venue.name}] audience screen: only the approved columns`, heads === 'Person|Events here|Last check-in|Ticket|Engagement', heads);
                check(`[${venue.name}] audience screen: ${listed.rows.length} listed, ${listed.hiddenCount} counted but not shown`, (await page.locator(`${card('audience')} tbody tr`).count()) === listed.rows.length && (!listed.hiddenCount || aud.includes(`${lib.formatInteger(listed.hiddenCount)} ${listed.hiddenCount === 1 ? 'is' : 'are'} counted but not listed`)));
                const keys = new Set(listed.rows.flatMap((r) => Object.keys(r)));
                const approved = ['id', 'name', 'username', 'avatarUrl', 'eventsAttended', 'lastCheckInAt', 'ticketTier', 'engagementTier'];
                check(`[${venue.name}] audience rows carry only the approved fields`, [...keys].every((k) => approved.includes(k)), [...keys].join(','));
                const own = (seen.get(`${id}/segments`)?.segments || []).map((s) => s.name);
                const offered = [...lib.AUDIENCE_PRESETS.map((x) => x.label), ...own];
                check(`[${venue.name}] saved segments: a closed dropdown on the audience screen`, (await text(`${card('audience')} [data-audience-segments] > button`)) === 'Saved Segments' && (await segmentOptions()).length === 0);
                await segmentsBar().click();
                await settle(400);
                const options = await segmentOptions();
                check(`[${venue.name}] saved segments: opens with ${offered.length} option(s) and "New segment"`, options.join('|') === offered.join('|') && (await page.locator(`${card('audience')} [data-audience-segments] button:has-text("New segment")`).count()) === 1, options.join('|'));
                await shot(`${tag}-audience-segments-open`);
                await page.getByRole('button', { name: 'Friday Crowd', exact: true }).click();
                await settle(2500);
                const friday = await text(card('audience'));
                check(`[${venue.name}] a night or weekday filter gives a count and no names`, /(people match|person matches) this audience/.test(friday) && /Names are hidden while targeting filters are active\./.test(friday) && (await page.locator(`${card('audience')} tbody tr`).count()) === 0, friday.slice(-200));
                check(`[${venue.name}] saved segments: picking one closes the dropdown and the bar names it`, (await segmentOptions()).length === 0 && (await text(`${card('audience')} [data-audience-segments] > button`)) === 'Friday Crowd');
                await segmentsBar().click();
                await settle(400);
                await page.getByRole('button', { name: 'Friday Crowd', exact: true }).click();
                await settle(1500);
                check(`[${venue.name}] saved segments: picking it again clears it`, (await text(`${card('audience')} [data-audience-segments] > button`)) === 'Saved Segments' && (await page.locator(`${card('audience')} tbody tr`).count()) === listed.rows.length);
            } else {
                check(`[${venue.name}] audience screen: "No Attendance History"`, /No Attendance History/.test(aud), aud);
            }
            await shot(`${tag}-audience`);
        }

        // ── Guarantees ───────────────────────────────────────────────────────────────────────────────────
        await tab('Guarantees');
        const g = await text(card('guarantees'));
        const promised = seen.get(`${id}/guarantees`)?.guarantees || [];
        check(`[${venue.name}] guarantees: the five sections`, ['What is Guaranteed', 'How it Works', 'What counts', 'What guarantee applies', "What happens if a guarantee isn't met"].every((s) => has(g, s)));
        check(`[${venue.name}] guarantees: ${promised.length ? `${promised.length} on this venue` : 'none, said plainly'}`, promised.length ? promised.every((x) => g.includes(x.event?.name || 'A night here')) : /No guarantee on this venue yet/.test(g));
        await shot(`${tag}-guarantees`);

        // ── phone width ──────────────────────────────────────────────────────────────────────────────────
        await page.setViewportSize({ width: 390, height: 844 });
        for (const screen of ['', 'overview', ...(features.crm ? ['audience'] : [])]) {
            await page.goto(`${SITE}/dashboard/venue?venueId=${id}${screen ? `&tab=${screen}` : ''}`, { waitUntil: 'domcontentloaded' });
            await settle(3500);
            check(`[${venue.name}] phone, ${screen || 'home'}: no sideways scroll`, !(await sideways()));
        }
        await shot(`${tag}-phone`);
        await page.setViewportSize({ width: 1440, height: 1000 });
    }

    if (NOT_MINE) {
        await open(`?venueId=${NOT_MINE}`, 3000);
        check('a venue the account does not own: "You do not have access to this venue."', /You do not have access to this venue\./.test(await page.locator('main').innerText()));
    }

    const refused = calls.filter((c) => !/ (200|304)$/.test(c));
    const expected = refused.filter((c) => /\/(forecast\/week|suggestions)(\?\S*)? 404$/.test(c) || (NOT_MINE && c.includes(NOT_MINE) && / 40[34]$/.test(c)));
    check('venue requests: only the expected refusals', refused.length === expected.length, refused.filter((c) => !expected.includes(c)).join(' ; ') || `${calls.length} calls, ${expected.length} expected refusals (forecasts in shadow mode, a venue not owned)`);
    check('browser console: no errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));

    await browser.close();
    fs.writeFileSync(path.join(OUT, 'venue-results.txt'), results.join('\n'));
    console.log(failures === 0 ? `\nALL PASS (${results.length} checks)` : `\n${failures} FAILURE(S) of ${results.length}`);
    process.exitCode = failures ? 1 : 0;
})().catch((err) => { console.log(`FAILED: ${String(err.message).split('\n')[0]}`); process.exit(1); });
