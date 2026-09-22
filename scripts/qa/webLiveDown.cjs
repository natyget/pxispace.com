/**
 * WEB-1, the branch where the SERVER could not seed the hub.
 *
 * Run against a build whose API_BASE_URL is unreachable — that is the live failure mode the
 * hub has to degrade through (the upstream sits behind Cloudflare, which has a history of
 * refusing the site's own server). The client then owns the three states, and they must
 * still look different from each other.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');

const SITE = process.env.SITE || 'http://localhost:5174';
const API = 'https://dev.pxispace.com';
const OUT = process.env.PXI_QA_DIR || require('path').join(__dirname, '.artifacts');
const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const MARK = '\n__STATUS__';

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

function curl(url, method = 'GET', body = null) {
    const a = ['-s', '-w', MARK + '%{http_code}', '-A', UA, '--max-time', '45', '-X', method, url];
    if (body) a.push('-H', 'Content-Type: application/json', '-d', body);
    const out = execFileSync('curl', a, { encoding: 'utf8', maxBuffer: 40e6 });
    const at = out.lastIndexOf(MARK);
    return at === -1 ? out : out.slice(0, at);
}

const text = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

(async () => {
    console.log(`site ${SITE} — build with an unreachable server-side API\n`);
    const browser = await chromium.launch();

    // The crawler's view of the degraded page: a loading state, not a false "empty city".
    const html = curl(`${SITE}/discover/new-york`);
    check('the unseeded hub ships a loading state, not a wrong answer', (html.match(/animate-pulse/g) || []).length > 1, {
        skeletons: (html.match(/animate-pulse/g) || []).length,
    });
    check('…and does not claim the city is empty', !/No live events/.test(html));

    // 1. The client succeeds: the empty city resolves to the CTA.
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, userAgent: UA });
        await ctx.route(`${API}/**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ events: [] }) }),
        );
        const page = await ctx.newPage();
        await page.goto(`${SITE}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(7000);
        const body = await text(page);
        await page.screenshot({ path: `${OUT}/down-empty.png` });
        check('client resolves empty → the create CTA', /Create an event/.test(body) && /No live events/.test(body));
        check('…with the skeletons gone', (await page.locator('.animate-pulse').count()) === 0);
        await ctx.close();
    }

    // 2. The client fails: an error that says so and can be retried — not a create pitch.
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, userAgent: UA });
        let calls = 0;
        await ctx.route(`${API}/**`, (route) => {
            if (/\/api\/events/.test(route.request().url())) {
                calls += 1;
                // Fail the first load; answer the retry, so the button is proved to do something.
                if (calls > 1) {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ events: [] }),
                    });
                }
                return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' });
            }
            return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        });
        const page = await ctx.newPage();
        await page.goto(`${SITE}/discover/new-york`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(8000);
        let body = await text(page);
        await page.screenshot({ path: `${OUT}/down-error.png` });
        check('client fails → "Could not load events"', /Could not load events/.test(body), body.slice(0, 160));
        check('…and offers Try again', /Try again/.test(body));
        check('…and does not pitch creating an event', !/No live events/.test(body));

        await page.getByRole('button', { name: /Try again/i }).click();
        await page.waitForTimeout(7000);
        body = await text(page);
        await page.screenshot({ path: `${OUT}/down-retried.png` });
        check('Try again actually re-asks, and the answer replaces the error', !/Could not load events/.test(body) && /Create an event/.test(body), body.slice(0, 160));
        await ctx.close();
    }

    await browser.close();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.error('RUN FAILED', e);
    process.exit(2);
});
