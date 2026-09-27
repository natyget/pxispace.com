/**
 * PXI-WEB — the browser half, against the DEPLOYED site and the live dev API.
 *
 *   SITE=https://test.pxispace.com node scripts/qa/webEpicQa.cjs
 *
 * Deliberately short. A long automated run against the deployed site trips Cloudflare's bot
 * check part-way through and every assertion after that reads as a broken app — see
 * scripts/qa/README.md. Anything provable without a browser (SSR HTML, middleware redirects,
 * canManage) is checked with curl instead and lives in PXIStudio-App/docs/WEB_QA.md.
 *
 * Headed on purpose: Cloudflare refuses a headless Chromium and lets a headed one through.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE = process.env.SITE || 'https://test.pxispace.com';
const API = process.env.API || 'https://dev.pxispace.com';
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const SHOTS = path.join(OUT, 'web-epic');
const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const ORGANIZER = { email: 'pxiqa.relay.tester@example.com', password: 'RelayQa2026Test!' };

fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
const failed = [];
function check(name, ok, detail) {
    if (ok) {
        pass += 1;
        console.log(`  PASS  ${name}`);
    } else {
        fail += 1;
        failed.push(name);
        console.log(`  FAIL  ${name}${detail === undefined ? '' : `  → ${JSON.stringify(detail).slice(0, 160)}`}`);
    }
}
const section = (t) => console.log(`\n${t}\n${'─'.repeat(t.length)}`);

const CHALLENGE = /Performing security verification|Just a moment|Ray ID:/i;
const textOf = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

/** Navigate, then wait out Cloudflare if it interposes. */
async function go(page, url, settle = 4000) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    for (let i = 0; i < 10; i += 1) {
        if (!CHALLENGE.test(await textOf(page).catch(() => ''))) break;
        await page.waitForTimeout(4000);
    }
    await page.waitForTimeout(settle);
}

/** curl, because Node's fetch is challenged from this network but curl is not. */
function curl(url, args = []) {
    return execFileSync('curl', ['-s', '--max-time', '45', '-A', UA, ...args, url], {
        encoding: 'utf8',
        maxBuffer: 20e6,
    });
}

async function login(page, { email, password }) {
    if (!/\/login/.test(page.url())) await go(page, `${SITE}/login`);
    const e = page.locator('input[type="email"]').first();
    await e.waitFor({ state: 'visible', timeout: 60000 });
    await e.click();
    await e.pressSequentially(email, { delay: 15 });
    const p = page.locator('input[type="password"]').first();
    await p.click();
    await p.pressSequentially(password, { delay: 15 });
    await page.waitForFunction(
        () => {
            const b = document.querySelector('button[type="submit"]');
            return b && !b.disabled;
        },
        { timeout: 30000 },
    );
    await Promise.all([
        page.waitForURL((u) => !/\/login/.test(u.toString()), { timeout: 60000 }).catch(() => {}),
        page.locator('button[type="submit"]').first().click(),
    ]);
    await page.waitForTimeout(6000);
    return page.evaluate(() => localStorage.getItem('pxi_token'));
}

(async () => {
    console.log(`site ${SITE}\napi  ${API}`);
    const browser = await chromium.launch({ headless: process.env.HEADLESS === '1' });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, userAgent: UA });
    const page = await ctx.newPage();

    // ── WEB-1 ───────────────────────────────────────────────────────────────────────────
    section('WEB-1 · discovery, in the browser');

    await go(page, `${SITE}/discover/new-york`, 7000);
    let body = await textOf(page);
    await page.screenshot({ path: path.join(SHOTS, '01-empty-city.png') });
    check('an empty city says so', /No live events in New York yet/.test(body), body.slice(0, 120));
    check('…and offers to create one', /Create an event/.test(body));
    check('…with the skeletons gone once loaded', (await page.locator('.animate-pulse').count()) === 0);
    check('…and no error copy', !/Could not load events/.test(body));

    await go(page, `${SITE}/discover/boston`, 7000);
    body = await textOf(page);
    await page.screenshot({ path: path.join(SHOTS, '02-city-with-events.png') });
    check("a city with events lists them", /QA Boston Discovery Night/i.test(body), body.slice(0, 140));
    check('…and does not pitch creating one instead', !/No live events in Boston/.test(body));

    await go(page, `${SITE}/discover/boston/afrohouse`, 5000);
    body = await textOf(page);
    check('the genre sub-hub has its own empty heading', /No Afro House events in Boston yet/.test(body));
    check('…and its own CTA', (await page.locator('a[href="/dashboard/events/new"]').count()) > 0);

    // TC-7: the whole round trip — CTA → login → the create form.
    await page.locator('a[href="/dashboard/events/new"]').first().click();
    await page.waitForURL(/\/login/, { timeout: 60000 }).catch(() => {});
    for (let i = 0; i < 10 && CHALLENGE.test(await textOf(page).catch(() => '')); i += 1) {
        await page.waitForTimeout(4000);
    }
    await page.waitForTimeout(3000);
    check(
        'signed out, the CTA lands on login with the return path',
        /\/login\?redirect=(%2F)?dashboard/.test(page.url()),
        page.url(),
    );

    await login(page, ORGANIZER);
    await page.screenshot({ path: path.join(SHOTS, '03-after-login.png') });
    check('…and after signing in you land on the create form', /\/dashboard\/events\/new/.test(page.url()), page.url());

    // ── WEB-2 ───────────────────────────────────────────────────────────────────────────
    section('WEB-2 · dashboard access, in the browser');

    const token = await page.evaluate(() => localStorage.getItem('pxi_token'));
    const claims = (() => {
        try {
            const raw = Buffer.from(token.split('.')[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            return JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
        } catch {
            return null;
        }
    })();
    const owned = claims?.ownedEventIds ?? [];
    check('the session carries event claims to test against', owned.length > 0, { owned: owned.length });

    if (owned.length) {
        await go(page, `${SITE}/dashboard/events/${owned[0]}`, 12000);
        body = await textOf(page);
        await page.screenshot({ path: path.join(SHOTS, '04-own-event.png') });
        check('an organizer reaches their own event', !page.url().includes('/403'), page.url());
        check('…and it is not reported missing', !/Event not found/i.test(body));
    }

    // An event created by somebody else: refused, in words, and no data shown.
    const FOREIGN = '809ce876-c6c8-43f6-9db3-9404a3e5960b';
    await go(page, `${SITE}/dashboard/events/${FOREIGN}`, 12000);
    body = await textOf(page);
    await page.screenshot({ path: path.join(SHOTS, '05-foreign-event.png') });
    check('someone else\'s event is refused in words', /do not have access/i.test(body), body.slice(0, 160));
    check('…and shows no event data', !/QA Autolink/i.test(body));

    // The API behind it — the refusal that actually matters.
    const read = curl(`${API}/api/events/${FOREIGN}`, ['-H', `Authorization: Bearer ${token}`]);
    check('the API says canManage: false for it', /"canManage":false/.test(read), read.slice(0, 80));
    // curl can exit non-zero (23, write error) while still having reported the status we
    // asked for, so read stdout rather than trusting the exit code.
    let write = '';
    try {
        write = execFileSync(
            'curl',
            ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '45', '-A', UA, '-X', 'PUT',
                `${API}/api/events/${FOREIGN}`, '-H', `Authorization: Bearer ${token}`,
                '-H', 'Content-Type: application/json', '-d', '{"name":"should not be allowed"}'],
            { encoding: 'utf8' },
        );
    } catch (e) {
        write = String(e.stdout ?? '');
    }
    check('…and refuses a write to it', write.trim() === '403', write);

    const cookies = (await ctx.cookies()).filter((c) => c.name.startsWith('pxi_'));
    check(
        'no PXI cookie carries an event id',
        !cookies.some((c) => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(c.value)),
        cookies.map((c) => c.name),
    );

    await browser.close();
    console.log(`\n${pass} passed, ${fail} failed`);
    if (failed.length) console.log(`failed:\n  - ${failed.join('\n  - ')}`);
    console.log(`screenshots: ${SHOTS}`);
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.error('RUN FAILED', e);
    process.exit(2);
});
