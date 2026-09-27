/**
 * PXI-WEB, end to end against the LIVE dev site and the LIVE dev API.
 *
 *   node webLive.js
 *
 * Site: https://test.pxispace.com   API: https://dev.pxispace.com
 *
 * The API calls the page makes are replayed through curl, because Cloudflare challenges
 * browser-originated XHR from this machine and answers it with an interstitial the app cannot
 * parse. The page, the middleware, the routing and the data are all the real deployed ones;
 * only the transport of the XHR is swapped, and the real status code is passed through so a
 * backend refusal still looks like a refusal.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');

const SITE = process.env.SITE || 'https://test.pxispace.com';
const API = 'https://dev.pxispace.com';
const OUT = process.env.PXI_QA_DIR || require('path').join(__dirname, '.artifacts');
const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const MARK = '\n__STATUS__';

// The tester created this event through the API with the token below already in hand, so the
// token cannot know about it — which is exactly the reported bug's shape.
const MINE = 'a5ed5cce-c53c-473e-8b73-5e8644839c73';
const FOREIGN = '809ce876-c6c8-43f6-9db3-9404a3e5960b';
const TOKEN = fs.readFileSync(`${OUT}/stale_token.txt`, 'utf8').trim();

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
    if (ok) {
        pass += 1;
        console.log(`  PASS  ${name}`);
    } else {
        fail += 1;
        console.log(`  FAIL  ${name}${detail === undefined ? '' : `  → ${JSON.stringify(detail)}`}`);
    }
}

function curl(url, method = 'GET', body = null, token = null) {
    const a = ['-s', '-w', MARK + '%{http_code}', '-A', UA, '--max-time', '45', '-X', method, url];
    a.push('-H', 'Content-Type: application/json');
    if (token) a.push('-H', `Authorization: Bearer ${token}`);
    if (body) a.push('-d', body);
    const out = execFileSync('curl', a, { encoding: 'utf8', maxBuffer: 40e6 });
    const at = out.lastIndexOf(MARK);
    return at === -1
        ? { status: 200, body: out }
        : { status: Number(out.slice(at + MARK.length).trim()) || 200, body: out.slice(0, at) };
}

/**
 * Route the app's API traffic through curl. `failApi` forces every API call to fail;
 * `asCitizen` answers the vendor-status probe with "no", which is the one input the
 * dashboard's Citizen bounce reads. (The QA account is a vendor, and there is no Citizen
 * password on hand — this makes the client see exactly what a Citizen's client sees.)
 */
async function proxyApi(ctx, { failApi = false, stall = 0, asCitizen = false } = {}) {
    await ctx.route(`${API}/**`, async (route) => {
        if (stall) await new Promise((r) => setTimeout(r, stall));
        if (failApi) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"forced"}' });
        const r = route.request();
        if (asCitizen && /\/api\/vendor\/status/.test(r.url())) {
            return route.fulfill({ status: 200, contentType: 'application/json', body: '{"isVendor":false}' });
        }
        const tok = (r.headers().authorization || '').replace(/^Bearer /, '');
        try {
            const res = curl(r.url(), r.method(), r.postData() ?? null, tok || null);
            await route.fulfill({
                status: res.status,
                headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
                // asCitizen: the session refresh re-asserts vendor status from the API and
                // would overwrite the stored profile, so the answer has to be consistent.
                body: asCitizen ? res.body.replace(/"isVendor":\s*true/g, '"isVendor":false') : res.body,
            });
        } catch {
            await route.fulfill({ status: 502, contentType: 'application/json', body: '{}' });
        }
    });
}

const PROFILE = JSON.parse(fs.readFileSync(`${OUT}/tester_user.json`, 'utf8'));

/**
 * A browser holding the QA tester's real session. `profile` overrides the stored profile —
 * the dashboard's vendor gate is client-side and reads exactly this object, so passing
 * `{ isVendor: false }` is what a Citizen's browser holds.
 */
async function signedInPage(browser, opts = {}) {
    const { profile = {}, ...routeOpts } = opts;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: UA });
    await proxyApi(ctx, routeOpts);
    const page = await ctx.newPage();
    await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(
        ({ t, u }) => {
            localStorage.setItem('pxi_token', t);
            localStorage.setItem('pxi_user', JSON.stringify(u));
        },
        { t: TOKEN, u: { ...PROFILE, ...profile } },
    );
    // The app mirrors the token into an HttpOnly cookie so middleware can read it.
    const status = await page.evaluate(async (t) => {
        const r = await fetch('/api/auth/set-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: t }),
            credentials: 'same-origin',
        });
        return r.status;
    }, TOKEN);
    if (status !== 200) throw new Error(`set-cookie returned ${status}`);
    return { ctx, page };
}

async function text(page) {
    return (await page.locator('body').innerText()).replace(/\s+/g, ' ');
}

(async () => {
    console.log(`site ${SITE}\napi  ${API}\n`);

    // --- API-level facts the page rests on -------------------------------------------------
    console.log('API (curl, no browser)');
    const mine = JSON.parse(curl(`${API}/api/events/${MINE}`, 'GET', null, TOKEN).body);
    check('canManage true on an event the caller created', mine?.event?.canManage === true, mine?.event?.canManage);
    const foreign = JSON.parse(curl(`${API}/api/events/${FOREIGN}`, 'GET', null, TOKEN).body);
    check("canManage false on someone else's event", foreign?.event?.canManage === false, foreign?.event?.canManage);
    const anon = JSON.parse(curl(`${API}/api/events/${MINE}`).body);
    check('canManage absent for a signed-out caller', anon?.event?.canManage === undefined, anon?.event?.canManage);
    const put = curl(`${API}/api/events/${FOREIGN}`, 'PUT', JSON.stringify({ name: 'should not be allowed' }), TOKEN);
    check('the API still refuses a write to a foreign event', put.status === 403, {
        status: put.status,
        body: put.body.slice(0, 120),
    });

    const browser = await chromium.launch();

    // --- WEB-1 -----------------------------------------------------------------------------
    console.log('\nWEB-1 · discovery');
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, userAgent: UA });
        const page = await ctx.newPage();

        await page.goto(`${SITE}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(7000);
        let body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web1-city-empty.png` });
        check('empty city hub offers the create CTA', /Create an event/.test(body));
        check(
            'the CTA links at /dashboard/events/new',
            (await page.locator('main a[href="/dashboard/events/new"], a[href="/dashboard/events/new"]').count()) > 0,
        );
        check('an empty city does not claim an error', !/Could not load events/.test(body));

        // The crawler's view: what is in the FIRST response, before any JavaScript.
        const nyHtml = curl(`${SITE}/discover/new-york`).body;
        check(
            '…and says so in the server HTML, before any JavaScript',
            /Create an event/.test(nyHtml) && /No live events/.test(nyHtml),
            { cta: /Create an event/.test(nyHtml), emptyLine: /No live events/.test(nyHtml) },
        );
        check('…with no skeleton grid in the server HTML', (nyHtml.match(/animate-pulse/g) || []).length <= 1, {
            skeletons: (nyHtml.match(/animate-pulse/g) || []).length,
        });

        await page.goto(`${SITE}/discover/boston/afrohouse`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(4000);
        body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web1-genre-empty.png` });
        check('genre sub-hub shows its own empty heading', /No Afro House events in Boston yet\./.test(body));
        check('genre sub-hub offers the create CTA', /Create an event/.test(body));

        await page.goto(`${SITE}/discover/boston`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(4000);
        const cards = await page.locator('a[href^="/events/"]').count();
        check('a city with events lists them (no create pitch instead)', /QA Cambridge Night/i.test(await text(page)), { cards });
        // SEO, done-when #4: the rows must be in the first response too.
        const boHtml = curl(`${SITE}/discover/boston`).body;
        check(
            '…and the server HTML carries the event, not a loading state',
            /\/events\/[0-9a-f-]{36}/.test(boHtml) && !/Create an event/.test(boHtml),
            { link: (boHtml.match(/\/events\/[0-9a-f-]{36}/) || [])[0] || null },
        );
        await ctx.close();
    }

    // Error, and loading: only reachable when the SERVER could not seed the hub, which is
    // what SSR=down builds. With a healthy server the hub never enters either state.
    if (process.env.SSR === 'down') {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, userAgent: UA });
        await proxyApi(ctx, { failApi: true });
        const page = await ctx.newPage();
        await page.goto(`${SITE}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(8000);
        const body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web1-error.png` });
        check('a failed fetch says so', /Could not load events/.test(body));
        check('…and offers a retry', /Try again/.test(body));
        check('…and does not pitch creating an event', !/Create an event/.test(body.replace(/.*?Discover/s, '')));
        await ctx.close();
    }
    if (process.env.SSR === 'down') {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, userAgent: UA });
        await proxyApi(ctx, { stall: 90000 });
        const page = await ctx.newPage();
        await page.goto(`${SITE}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(6000);
        const skeletons = await page.locator('.animate-pulse').count();
        const body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web1-loading.png` });
        check('while loading, skeletons and neither of the other two states', skeletons > 0 && !/Could not load events/.test(body), {
            skeletons,
        });
        await ctx.close();
    }

    // TC-7: the CTA routes a signed-out reader through login and back to the create form.
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: UA });
        const page = await ctx.newPage();
        await page.goto(`${SITE}/discover/boston/afrohouse`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(3000);
        await page.locator('a[href="/dashboard/events/new"]').first().click();
        await page.waitForTimeout(6000);
        const url = page.url();
        await page.screenshot({ path: `${OUT}/live-web1-cta-signedout.png` });
        check('signed out, the CTA lands on login with the return path intact', /\/login\?redirect=%2Fdashboard%2Fevents%2Fnew|\/login\?redirect=\/dashboard\/events\/new/.test(url), url);
        await ctx.close();
    }

    // --- WEB-2 -----------------------------------------------------------------------------
    console.log('\nWEB-2 · dashboard access');
    {
        const { ctx, page } = await signedInPage(browser);
        await page.goto(`${SITE}/dashboard/events/${MINE}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(12000);
        const body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web2-own-event.png` });
        check('a token with no claim for the event is NOT bounced to /403', !page.url().includes('/403'), page.url());
        check('the event management page renders the event', /PXI-WEB QA night/.test(body), body.slice(0, 160));
        check('…and does not claim the event is missing', !/Event not found/i.test(body));
        const cookies = await ctx.cookies();
        check(
            'no cookie carries an event id',
            !cookies.filter((c) => c.name.startsWith('pxi_')).some((c) => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(c.value)),
            cookies.filter((c) => c.name.startsWith('pxi_')).map((c) => c.name),
        );
        check(
            'the stale-claims flag was consumed',
            !cookies.some((c) => c.name === 'pxi_claims_stale'),
            cookies.map((c) => c.name),
        );
        await ctx.close();
    }
    {
        const { ctx, page } = await signedInPage(browser);
        await page.goto(`${SITE}/dashboard/events/${FOREIGN}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(12000);
        const body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web2-foreign-event.png` });
        check('a stranger is refused, in words', /do not have access/i.test(body), body.slice(0, 200));
        check('…and sees no event data', !/QA Autolink/i.test(body));
        await ctx.close();
    }
    {
        // A vendor reaches the vendor-only surfaces: the gate must not refuse everybody.
        const { ctx, page } = await signedInPage(browser);
        await page.goto(`${SITE}/dashboard/analytics`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(9000);
        check('a vendor reaches a vendor-only surface', !page.url().includes('/403'), page.url());
        await ctx.close();
    }
    {
        // TC-9: the same surface as a Citizen. The gate is client-side and reads the stored
        // profile, so a non-vendor profile is what it sees in a Citizen's browser.
        const { ctx, page } = await signedInPage(browser, { profile: { isVendor: false, accountTier: 'CITIZEN' }, asCitizen: true });
        await page.goto(`${SITE}/dashboard/analytics`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(9000);
        const body = await text(page);
        await page.screenshot({ path: `${OUT}/live-web2-403-vendor.png` });
        check('a non-vendor is sent to the explained refusal, not silently home', page.url().includes('/403?reason=vendor'), page.url());
        check('the refusal names the reason', /for organizers/i.test(body), body.slice(0, 200));
        check('…and links to the upgrade', (await page.locator('a[href="/dashboard/vendor-upgrade"]').count()) > 0);
        await page.goto(`${SITE}/dashboard/events`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(8000);
        check('…and still reaches My Events (see decision 8)', !page.url().includes('/403'), page.url());
        await ctx.close();
    }
    {
        // Signed out: the edge still refuses, and it refuses by sending you to login.
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: UA });
        const page = await ctx.newPage();
        await page.goto(`${SITE}/dashboard/events/${MINE}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(5000);
        check('signed out, the dashboard sends you to login with the return path', /\/login\?redirect=/.test(page.url()), page.url());
        await ctx.close();
    }

    await browser.close();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.error('RUN FAILED', e);
    process.exit(2);
});
