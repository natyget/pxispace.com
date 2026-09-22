/**
 * PXI-WEB, end to end, for real.
 *
 *   node scripts/qa/webDeep.js
 *
 * Local web (`npm run dev`, :5173) against the LIVE dev API. No request interception except
 * where a network failure is deliberately being simulated — the app does its own fetching,
 * its own CORS, its own error handling. Sessions are established by typing into the real
 * login form, not by writing localStorage.
 *
 * Cloudflare challenges Node's `fetch` from some networks but not a real browser, so every
 * API call here is made from inside the page. That is also the honest thing to test: it is
 * the request the app actually makes.
 *
 * **It runs headed on purpose.** Cloudflare lets a headed Chromium through and refuses the
 * same request from a headless one — `net::ERR_FAILED`, before any CORS evaluation, so it
 * reads as a CORS bug and is not one. Running headed is what makes it possible to test with
 * no proxy at all. Set HEADLESS=1 to see it fail.
 *
 * WEB-2's reported bug needs a cookie that predates the access it is testing. Both ways of
 * getting one are exercised, and neither is faked:
 *   - an event created "elsewhere" while this browser sits on an older token;
 *   - a co-host invite accepted after the session was minted.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = process.env.SITE || 'http://localhost:5173';
const API = process.env.API || 'https://dev.pxispace.com';
// A server that CANNOT seed the hubs, for the two states the client still owns.
const UNSEEDED = process.env.UNSEEDED || 'http://localhost:5173';
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const SHOTS = path.join(OUT, 'deep');

const ORGANIZER = { email: 'pxiqa.relay.tester@example.com', password: 'RelayQa2026Test!' };
const CITIZEN = {
    email: 'pxiqa.web.citizen@example.com',
    password: 'WebCitizen2026Qa!',
    username: 'qa_web_citizen',
};
// An event created by somebody else, for the refusal cases.
const FOREIGN_EVENT = '809ce876-c6c8-43f6-9db3-9404a3e5960b';

fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];
function check(name, ok, detail) {
    if (ok) {
        pass += 1;
        console.log(`  PASS  ${name}`);
    } else {
        fail += 1;
        failures.push(name);
        console.log(`  FAIL  ${name}${detail === undefined ? '' : `  → ${JSON.stringify(detail)}`}`);
    }
}
const section = (t) => console.log(`\n${t}\n${'─'.repeat(t.length)}`);

/** The PASETO's claims, so "this cookie cannot know about that event" can be asserted, not assumed. */
function claims(token) {
    try {
        const raw = Buffer.from(token.split('.')[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        return JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
    } catch {
        return null;
    }
}

const textOf = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`) });

/** An API call made from inside the page: the app's origin, the app's token, real CORS. */
function apiCall(page, pathname, { method = 'GET', body = null, auth = true } = {}) {
    return page.evaluate(
        async ({ api, p, m, b, useAuth }) => {
            const headers = { 'Content-Type': 'application/json' };
            if (useAuth) {
                const t = localStorage.getItem('pxi_token');
                if (t) headers.Authorization = `Bearer ${t}`;
            }
            const r = await fetch(`${api}${p}`, { method: m, headers, body: b ? JSON.stringify(b) : undefined });
            const text = await r.text();
            let json = null;
            try {
                json = JSON.parse(text);
            } catch {
                /* not json */
            }
            return { status: r.status, json, text: text.slice(0, 300) };
        },
        { api: API, p: pathname, m: method, b: body, useAuth: auth },
    );
}

/**
 * Sign in by typing into the real form. Returns the token the app ended up holding.
 *
 * Typed rather than `fill`ed, and the submit button is waited on rather than clicked
 * immediately: the form is controlled React and only enables submit once its own state has
 * caught up, so a fast fill-and-click hits a disabled button.
 */
async function loginThroughForm(page, { email, password }, { expectLanding = null } = {}) {
    if (!/\/login/.test(page.url())) {
        await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    }
    const emailField = page.locator('input[type="email"]').first();
    await emailField.waitFor({ state: 'visible', timeout: 60000 });
    await emailField.click();
    await emailField.pressSequentially(email, { delay: 15 });
    const pw = page.locator('input[type="password"]').first();
    await pw.click();
    await pw.pressSequentially(password, { delay: 15 });
    const submit = page.locator('button[type="submit"]').first();
    await submit.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(
        () => {
            const b = document.querySelector('button[type="submit"]');
            return b && !b.disabled;
        },
        { timeout: 30000 },
    );
    await Promise.all([
        page.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 }).catch(() => {}),
        submit.click(),
    ]);
    await page.waitForTimeout(5000);
    const token = await page.evaluate(() => localStorage.getItem('pxi_token'));
    if (!token) throw new Error(`login failed for ${email} — landed on ${page.url()}`);
    if (expectLanding) check(`login lands on ${expectLanding}`, page.url().includes(expectLanding), page.url());
    return token;
}

async function newContext(browser, opts = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, ...opts });
    const page = await ctx.newPage();
    return { ctx, page };
}

(async () => {
    console.log(`web ${SITE}\napi ${API}\n`);
    const browser = await chromium.launch({ headless: process.env.HEADLESS === '1' });

    // ── Phase 0 · a real Citizen to test with ───────────────────────────────────────────────
    section('Phase 0 · accounts');
    {
        const { ctx, page } = await newContext(browser);
        await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        const reg = await apiCall(page, '/api/auth/register', {
            method: 'POST',
            auth: false,
            body: { email: CITIZEN.email, password: CITIZEN.password, username: CITIZEN.username },
        });
        const already = reg.status === 409 || /already|taken|exists/i.test(reg.text);
        check('a Citizen account exists to test with', reg.status === 201 || reg.status === 200 || already, {
            status: reg.status,
            body: reg.text.slice(0, 120),
        });
        console.log(`        (${already ? 'reused from an earlier run' : 'registered now'})`);
        await ctx.close();
    }

    // ── Phase 1 · WEB-1, signed out, against the real API ───────────────────────────────────
    section('Phase 1 · WEB-1 discovery, real data');
    {
        const { ctx, page } = await newContext(browser);

        await page.goto(`${SITE}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(8000);
        let body = await textOf(page);
        await shot(page, '01-city-empty');
        check('an empty city says it is empty', /No live events in New York yet/.test(body), body.slice(0, 140));
        check('…and offers to create one', /Create an event/.test(body));
        check('…linking at the create flow', (await page.locator('a[href="/dashboard/events/new"]').count()) > 0);
        check('…with the skeletons gone', (await page.locator('.animate-pulse').count()) === 0);
        check('…and no error copy anywhere near it', !/Could not load events/.test(body));

        await page.goto(`${SITE}/discover/boston`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(8000);
        body = await textOf(page);
        await shot(page, '02-city-with-events');
        check('a city with events lists the real event', /QA Cambridge Night/i.test(body), body.slice(0, 160));
        check('…and does not pitch creating one instead', !/No live events in Boston/.test(body));

        await page.goto(`${SITE}/discover/boston/afrohouse`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(5000);
        body = await textOf(page);
        await shot(page, '03-genre-empty');
        check('the genre sub-hub has its own empty heading', /No Afro House events in Boston yet/.test(body));
        check('…and its own CTA', (await page.locator('a[href="/dashboard/events/new"]').count()) > 0);
        await ctx.close();
    }

    // Error and loading, by breaking the network the app actually uses.
    //
    // These two states only exist when the SERVER could not seed the hub — when it could, the
    // answer is already in the first response and the client does not fetch at all. So they
    // run against the unseeded server (`next dev` here, whose Node fetch Cloudflare refuses,
    // which is the same shape as the upstream being down in production).
    section('Phase 1b · WEB-1 states the client still owns');
    console.log(`        (against ${UNSEEDED}, which cannot seed)`);
    {
        const { ctx, page } = await newContext(browser);
        let block = true;
        await ctx.route(`${API}/api/events**`, (route) => (block ? route.abort('failed') : route.continue()));
        await page.goto(`${UNSEEDED}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(8000);
        let body = await textOf(page);
        await shot(page, '04-error');
        check('a failed fetch says the fetch failed', /Could not load events/.test(body), body.slice(0, 140));
        check('…and offers Try again', /Try again/.test(body));
        check('…and does NOT tell the reader the city is empty', !/No live events/.test(body));
        check('…and does not pitch creating an event on an error', !/Create an event/.test(body));

        block = false;
        await page.getByRole('button', { name: /Try again/i }).click();
        await page.waitForTimeout(8000);
        body = await textOf(page);
        await shot(page, '05-retried');
        check('Try again really re-asks, and the answer replaces the error', !/Could not load events/.test(body), body.slice(0, 140));
        check('…resolving to the empty state', /No live events in New York yet/.test(body) && /Create an event/.test(body));
        await ctx.close();
    }
    {
        const { ctx, page } = await newContext(browser);
        await ctx.route(`${API}/api/events**`, async (route) => {
            await new Promise((r) => setTimeout(r, 120000));
            await route.abort();
        });
        await page.goto(`${UNSEEDED}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(6000);
        const skeletons = await page.locator('.animate-pulse').count();
        const body = await textOf(page);
        await shot(page, '06-loading');
        check('while it is still loading, skeletons', skeletons > 0, { skeletons });
        check('…and neither of the other two states', !/Could not load events/.test(body) && !/No live events/.test(body));
        await ctx.close();
    }

    // TC-7, the whole round trip: CTA → login → the create form.
    {
        const { ctx, page } = await newContext(browser);
        await page.goto(`${SITE}/discover/boston/afrohouse`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(4000);
        await page.locator('a[href="/dashboard/events/new"]').first().click();
        await page.waitForURL(/\/login/, { timeout: 60000 }).catch(() => {});
        await page.waitForTimeout(3000);
        await shot(page, '07-cta-to-login');
        check(
            'signed out, the CTA sends you to login with the return path intact',
            /\/login\?redirect=(%2F)?dashboard/.test(page.url()),
            page.url(),
        );
        await loginThroughForm(page, ORGANIZER);
        await page.waitForTimeout(6000);
        await shot(page, '08-landed-on-create');
        check('…and after signing in you land on the create form, not the dashboard home', /\/dashboard\/events\/new/.test(page.url()), page.url());
        await ctx.close();
    }

    // ── Phase 2 · WEB-2, real sessions and genuinely stale cookies ──────────────────────────
    section('Phase 2 · WEB-2 dashboard access');

    // 2a. An event created elsewhere, while this browser holds an older token.
    let freshEventId = null;
    {
        const { ctx, page } = await newContext(browser);
        await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        const token = await loginThroughForm(page, ORGANIZER);
        const before = claims(token);
        console.log(`        session minted with ${(before?.ownedEventIds || []).length} owned / ${(before?.staffEventIds || []).length} staff claims`);

        // "Another device": a separate browser, same account, creates an event. The session
        // above never sees the refreshed token — which is the entire bug.
        const other = await newContext(browser);
        await other.page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await loginThroughForm(other.page, ORGANIZER);
        const created = await apiCall(other.page, '/api/events', {
            method: 'POST',
            body: {
                name: `PXI-WEB deep QA ${new Date().toISOString().slice(0, 16)}`,
                location: 'Boston, MA',
                startDate: '2026-12-05T23:00:00Z',
                endDate: '2026-12-06T04:00:00Z',
                visibility: 'PRIVATE',
                ticketType: 'FREE',
            },
        });
        freshEventId = created.json?.event?.id;
        check('an event was created on the "other device"', Boolean(freshEventId), { status: created.status });
        await other.ctx.close();

        const stale = await page.evaluate(() => localStorage.getItem('pxi_token'));
        check(
            'this browser\'s token genuinely cannot know about it',
            !JSON.stringify(claims(stale) || {}).includes(freshEventId || 'x'),
            { owned: (claims(stale)?.ownedEventIds || []).length },
        );

        await page.goto(`${SITE}/dashboard/events/${freshEventId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(14000);
        const body = await textOf(page);
        await shot(page, '09-own-event-stale-cookie');
        check('the creator is NOT bounced to /403', !page.url().includes('/403'), page.url());
        check('the event management page renders the event', /PXI-WEB deep QA/i.test(body), body.slice(0, 180));
        check('…and does not claim it is missing', !/Event not found/i.test(body));

        const after = claims(await page.evaluate(() => localStorage.getItem('pxi_token')));
        check(
            'the session healed itself: the refreshed token now carries the event',
            JSON.stringify(after || {}).includes(freshEventId),
            { owned: (after?.ownedEventIds || []).length },
        );
        const cookies = await ctx.cookies();
        const pxi = cookies.filter((c) => c.name.startsWith('pxi_'));
        check('the stale-claims flag was consumed', !pxi.some((c) => c.name === 'pxi_claims_stale'), pxi.map((c) => c.name));
        check(
            'no PXI cookie carries an event id',
            !pxi.some((c) => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(c.value)),
            pxi.map((c) => c.name),
        );
        await ctx.close();
    }

    // 2b. The reported bug itself: a co-host accepted AFTER their session was minted.
    {
        const host = await newContext(browser);
        await host.page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await loginThroughForm(host.page, ORGANIZER);

        const guest = await newContext(browser);
        await guest.page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        const guestToken = await loginThroughForm(guest.page, CITIZEN);
        const guestClaims = claims(guestToken);
        check(
            "the co-host's session is minted BEFORE the invite exists",
            !(guestClaims?.staffEventIds || []).includes(freshEventId),
            { staff: (guestClaims?.staffEventIds || []).length },
        );

        // Invite, then accept — through the product, not the database.
        const ev = await apiCall(host.page, `/api/events/${freshEventId}`);
        const albumId = ev.json?.event?.albums?.[0]?.id || ev.json?.event?.albumId;
        const invited = await apiCall(host.page, `/api/albums/${albumId}/invite-user`, {
            method: 'POST',
            body: { username: CITIZEN.username, role: 'cohost' },
        });
        check('the host can invite a co-host', invited.status < 400, { status: invited.status, body: invited.text.slice(0, 140) });

        const notes = await apiCall(guest.page, '/api/notifications?limit=20');
        const list = notes.json?.notifications || notes.json?.data || [];
        const invite = list.find((n) => /invite/i.test(n.type || '') || n.inviteListId);
        const accepted = invite
            ? await apiCall(guest.page, `/api/notifications/${invite.id}/accept`, { method: 'POST', body: {} })
            : { status: 0, text: 'no invite notification found' };
        check('the co-host accepts it from their notifications', accepted.status < 400, {
            status: accepted.status,
            body: String(accepted.text).slice(0, 140),
        });

        // The cookie in this browser still predates the membership. That is the bug.
        await guest.page.goto(`${SITE}/dashboard/events/${freshEventId}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await guest.page.waitForTimeout(14000);
        const body = await textOf(guest.page);
        await shot(guest.page, '10-cohost-stale-cookie');
        check('THE REPORTED BUG: an accepted co-host reaches the event', !guest.page.url().includes('/403'), guest.page.url());
        check('…and sees it', /PXI-WEB deep QA/i.test(body), body.slice(0, 180));
        check('…without being told it does not exist', !/Event not found/i.test(body));
        await host.ctx.close();
        await guest.ctx.close();
    }

    // 2c. A stranger, the same three refusals, and the API behind them.
    {
        const { ctx, page } = await newContext(browser);
        await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await loginThroughForm(page, CITIZEN);

        await page.goto(`${SITE}/dashboard/events/${FOREIGN_EVENT}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(14000);
        let body = await textOf(page);
        await shot(page, '11-stranger-refused');
        check('a stranger is refused in words, not by a redirect', /do not have access/i.test(body), body.slice(0, 200));
        check('…and no event data is rendered', !/QA Autolink/i.test(body));

        const read = await apiCall(page, `/api/events/${FOREIGN_EVENT}`);
        check('the API says canManage: false for them', read.json?.event?.canManage === false, read.json?.event?.canManage);
        const write = await apiCall(page, `/api/events/${FOREIGN_EVENT}`, { method: 'PUT', body: { name: 'should not be allowed' } });
        check('…and refuses the write outright', write.status === 403, { status: write.status, body: write.text.slice(0, 120) });

        // A deleted or invented event must not look like a permission problem.
        await page.goto(`${SITE}/dashboard/events/00000000-0000-4000-8000-000000000000`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(12000);
        body = await textOf(page);
        await shot(page, '12-missing-event');
        check('a missing event reads differently from a refusal', /not found|no longer/i.test(body) && !/do not have access/i.test(body), body.slice(0, 200));
        await ctx.close();
    }

    // 2d. TC-9 with a REAL Citizen: the vendor bounce, and what stays open.
    {
        const { ctx, page } = await newContext(browser);
        await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        const token = await loginThroughForm(page, CITIZEN);
        check('the test account really is a non-vendor', claims(token)?.isVendor !== true, claims(token)?.role);

        await page.goto(`${SITE}/dashboard/analytics`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(10000);
        const body = await textOf(page);
        await shot(page, '13-vendor-bounce');
        check('a Citizen on a vendor-only surface lands on the explained refusal', page.url().includes('/403?reason=vendor'), page.url());
        check('…which names the reason', /for organizers/i.test(body), body.slice(0, 200));
        check('…and links to the upgrade', (await page.locator('a[href="/dashboard/vendor-upgrade"]').count()) > 0);

        await page.goto(`${SITE}/dashboard/events`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(9000);
        await shot(page, '14-citizen-my-events');
        check('…and My Events stays open to them (decision 8)', !page.url().includes('/403'), page.url());

        await page.goto(`${SITE}/403`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(4000);
        const plain = await textOf(page);
        check('/403 with no reason reads as a plain refusal, not a vendor pitch', /do not have access to this page/i.test(plain) && !/for organizers/i.test(plain), plain.slice(0, 160));
        await ctx.close();
    }

    // 2e. Signed out.
    {
        const { ctx, page } = await newContext(browser);
        for (const target of ['/dashboard/events', '/dashboard/events/new', '/dashboard/analytics', `/dashboard/events/${freshEventId}`]) {
            await page.goto(`${SITE}${target}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
            await page.waitForTimeout(2500);
            check(`signed out, ${target} → login with the return path`, /\/login\?redirect=/.test(page.url()), page.url());
        }
        await ctx.close();
    }

    await browser.close();
    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) console.log(`failed:\n  - ${failures.join('\n  - ')}`);
    console.log(`screenshots: ${SHOTS}`);
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.error('RUN FAILED', e);
    process.exit(2);
});
