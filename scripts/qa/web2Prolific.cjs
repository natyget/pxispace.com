/**
 * WEB-2 AC#3 — "a user with >200 events reaches an old one."
 *
 * Build the accounts first (PXIStudio-App):
 *   QA_EMAIL=pxiqa.edge70@example.com QA_PASSWORD='Edge70Qa2026!' QA_USERNAME=qa_edge70 \
 *     TARGET=69 node scripts/web2ProlificFixture.mjs
 *   TARGET=520 node scripts/web2ProlificFixture.mjs        # the prolific one
 *
 * Then, against a PRODUCTION build (middleware does not run under `next dev`) whose CLIENT
 * talks to the real API:
 *   API_BASE_URL=http://localhost:4310 NEXT_PUBLIC_API_BASE_URL=https://dev.pxispace.com npm run build
 *   API_BASE_URL=http://localhost:4310 NEXT_PUBLIC_API_BASE_URL=https://dev.pxispace.com npx next start -p 5174
 *   SITE=http://localhost:5174 node scripts/qa/web2Prolific.cjs
 *
 * WHAT THIS FOUND, and why the script is shaped this way.
 *
 * AC#3 cannot be reached on this build, because a prolific organizer cannot sign in at all.
 * The PASETO token carries one 36-char UUID per owned event, so its length is almost exactly
 * `420 + 52 * events`. Two ceilings sit above that:
 *
 *   - the browser keeps a cookie only while `name + value <= 4096`, so `pxi_paseto`
 *     (10 chars) can hold 4086 — reached at **71 events**;
 *   - nginx in front of the API rejects a request header over ~8 KB with 400, reached at
 *     about **149 events**.
 *
 * Past 70 events the browser silently drops the Set-Cookie, middleware sees no token, and the
 * dashboard bounces to /login — forever. The login POST itself succeeds, which is what makes it
 * read as a mystery rather than an error.
 *
 * So this script measures the ceiling rather than assuming it, then demonstrates both sides of
 * it with real accounts.
 *
 * One trap: `/api/auth/login` allows 10 attempts per 15 minutes per IP (auth.routes.ts). A run
 * that 429s will look exactly like the cookie failure — logged-out, no token. The script checks
 * for that explicitly and aborts rather than reporting a false positive.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE = process.env.SITE || 'http://localhost:5174';
const API = process.env.API || 'https://dev.pxispace.com';
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const SHOTS = path.join(OUT, 'web2-prolific');
const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const COOKIE_NAME = 'pxi_paseto';
// Under the cookie ceiling; expected to work end to end.
const UNDER = { email: 'pxiqa.edge60@example.com', password: 'Edge60Qa2026!', label: '60 events, under the ceiling' };
// Far over it; the case AC#3 is actually about.
const OVER = { email: 'pxiqa.prolific@example.com', password: 'Prolific2026Qa!', label: 'a prolific organizer (500+)' };
// The same account four events either side of the ceiling is the tightest evidence there is;
// qa_edge70 was taken from 69 events to 73 between runs. Kept here so the boundary is
// reproducible without rebuilding anything.
const BOUNDARY = { email: 'pxiqa.edge70@example.com', password: 'Edge70Qa2026!', label: '73 events, just over' };

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
        console.log(`  FAIL  ${name}${detail === undefined ? '' : `  → ${JSON.stringify(detail).slice(0, 220)}`}`);
    }
}
const section = (t) => console.log(`\n${t}\n${'─'.repeat(t.length)}`);

const textOf = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

/**
 * A screenshot is evidence, never a result. The signed-out login page animates continuously, so
 * `fullPage` can miss its stability deadline — and a run must not die on the way to recording
 * what it already measured.
 */
async function shoot(page, file) {
    await page
        .screenshot({ path: path.join(SHOTS, file), timeout: 15000, animations: 'disabled' })
        .catch((e) => console.log(`  (screenshot ${file} skipped: ${String(e.message).slice(0, 60)})`));
}


/** The largest `name=value` this browser will keep, found rather than assumed. */
async function cookieCeiling(page) {
    let lo = 1;
    let hi = 20000;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const kept = await page.evaluate(
            ({ n, len }) => {
                const v = 'v'.repeat(len);
                document.cookie = `${n}=${v}; path=/`;
                const got = document.cookie.split('; ').find((c) => c.startsWith(`${n}=`));
                const ok = !!got && got.length - (n.length + 1) === len;
                document.cookie = `${n}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                return ok;
            },
            { n: COOKIE_NAME, len: mid },
        );
        if (kept) lo = mid;
        else hi = mid - 1;
    }
    return lo; // max VALUE length for this cookie name
}

async function signIn(page, who) {
    await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);
    let loginStatus = 0;
    const onResponse = (r) => {
        if (r.url().includes('/api/auth/login')) loginStatus = r.status();
    };
    page.on('response', onResponse);

    const e = page.locator('input[type="email"]').first();
    await e.waitFor({ state: 'visible', timeout: 60000 });
    await e.click();
    await e.pressSequentially(who.email, { delay: 12 });
    const p = page.locator('input[type="password"]').first();
    await p.click();
    await p.pressSequentially(who.password, { delay: 12 });
    await page.waitForFunction(
        () => {
            const b = document.querySelector('button[type="submit"]');
            return b && !b.disabled;
        },
        { timeout: 30000 },
    );
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(14000);
    page.off('response', onResponse);

    return {
        loginStatus,
        url: page.url(),
        token: await page.evaluate(() => localStorage.getItem('pxi_token')),
    };
}

(async () => {
    console.log(`site ${SITE}\napi  ${API}`);
    const browser = await chromium.launch({ headless: process.env.HEADLESS === '1' });

    // ── The ceiling, measured ───────────────────────────────────────────────────────────────
    section('The cookie ceiling');
    const probeCtx = await browser.newContext({ userAgent: UA });
    const probePage = await probeCtx.newPage();
    await probePage.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const maxValue = await cookieCeiling(probePage);
    await probeCtx.close();

    // token length ≈ 420 + 52 per owned event id (one 36-char UUID, JSON-quoted, base64'd)
    const PER_EVENT = 52;
    const BASE = 420;
    const maxEvents = Math.floor((maxValue - BASE) / PER_EVENT);
    console.log(`  ${COOKIE_NAME} can hold ${maxValue} chars of value in this browser`);
    console.log(`  token length ≈ ${BASE} + ${PER_EVENT} x events  →  breaks above ${maxEvents} events`);
    check('the cookie ceiling is real and small enough to matter', maxEvents < 200, { maxEvents });

    // ── Under it ────────────────────────────────────────────────────────────────────────────
    section(`Control · ${UNDER.label}`);
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: UA });
        const page = await ctx.newPage();
        const r = await signIn(page, UNDER);
        if (r.loginStatus === 429) {
            console.error('\n  ABORT: /api/auth/login returned 429 (10 per 15 min per IP).');
            console.error('  A rate-limited run is indistinguishable from the bug. Wait and re-run.');
            await browser.close();
            process.exit(2);
        }
        check('the login request succeeded', r.loginStatus === 200, { status: r.loginStatus });
        check('…a token reached the browser', !!r.token, { chars: r.token?.length ?? 0 });
        check('…which fits under the ceiling', (r.token?.length ?? 0) <= maxValue, {
            chars: r.token?.length,
            ceiling: maxValue,
        });

        const cookie = (await ctx.cookies()).find((c) => c.name === COOKIE_NAME);
        check('…so the session cookie is kept', !!cookie, { chars: cookie?.value.length ?? 0 });
        check('…and they land on the dashboard, not back at login', !/\/login/.test(r.url), r.url);

        await page
            .goto(`${SITE}/dashboard/events`, { waitUntil: 'domcontentloaded', timeout: 120000 })
            .catch(() => {});
        await page.waitForTimeout(10000);
        await shoot(page, '01-under-ceiling.png');
        check('…and My Events lists their events', /Hosted/.test(await textOf(page)), page.url());
        await ctx.close();
    }

    // ── Over it — the case AC#3 describes ───────────────────────────────────────────────────
    section(`AC#3 · ${OVER.label}`);
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: UA });
        const page = await ctx.newPage();
        const r = await signIn(page, OVER);
        if (r.loginStatus === 429) {
            console.error('\n  ABORT: /api/auth/login returned 429. Wait 15 minutes and re-run.');
            await browser.close();
            process.exit(2);
        }
        check('their credentials are accepted', r.loginStatus === 200, { status: r.loginStatus });
        console.log(`        (token ${r.token?.length ?? 0} chars, ceiling ${maxValue})`);

        const cookie = (await ctx.cookies()).find((c) => c.name === COOKIE_NAME);
        await shoot(page, '02-over-ceiling.png');

        // These are the assertions AC#3 needs, and they are expected to FAIL on this build.
        check('AC#3 · the session cookie survives a prolific organizer', !!cookie, {
            token: r.token?.length,
            ceiling: maxValue,
            cookies: (await ctx.cookies()).map((c) => c.name),
        });
        check('AC#3 · signing in lands them somewhere other than /login', !/\/login/.test(r.url), r.url);

        // A middleware redirect can abort the navigation mid-flight; that IS the result here,
        // not an error, so swallow it and read where the browser ended up.
        await page
            .goto(`${SITE}/dashboard/events`, { waitUntil: 'domcontentloaded', timeout: 120000 })
            .catch(() => {});
        await page.waitForTimeout(10000);
        check('AC#3 · they can open My Events', !/\/login/.test(page.url()), page.url());

        // And the API behind it, independently of the browser.
        const probe = (() => {
            try {
                return execFileSync(
                    'curl',
                    ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '45', '-A', UA,
                        '-H', `Authorization: Bearer ${r.token ?? 'none'}`, `${API}/api/events?mine=1&limit=1`],
                    { encoding: 'utf8' },
                );
            } catch (e) {
                return String(e.stdout ?? '');
            }
        })();
        check('AC#3 · the API accepts their token at all', probe.trim() !== '400', {
            status: probe.trim(),
            note: '400 = proxy rejected the header before the app saw it',
        });
        await ctx.close();
    }

    // ── The tight boundary — the same account, four events over ─────────────────────────────
    section(`Boundary · ${BOUNDARY.label}`);
    {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: UA });
        const page = await ctx.newPage();
        const r = await signIn(page, BOUNDARY);
        if (r.loginStatus === 429) {
            console.log('  SKIP  rate limited (10 logins per 15 min) — not evidence either way');
        } else {
            check('their credentials are accepted here too', r.loginStatus === 200, { status: r.loginStatus });
            console.log(`        (token ${r.token?.length ?? 0} chars, ceiling ${maxValue})`);
            const cookie = (await ctx.cookies()).find((c) => c.name === COOKIE_NAME);
            await shoot(page, '03-boundary.png');
            // Thirteen events more than the control, and this is where it stops working.
            check('AC#3 · the cookie survives just over the ceiling', !!cookie, {
                token: r.token?.length,
                ceiling: maxValue,
            });
            check('AC#3 · …and they are not returned to login', !/\/login/.test(r.url), r.url);
        }
        await ctx.close();
    }

    await browser.close();
    console.log(`\n${pass} passed, ${fail} failed`);
    if (failed.length) console.log(`failed:\n  - ${failed.join('\n  - ')}`);
    console.log(`screenshots: ${SHOTS}`);
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.error('RUN FAILED', e);
    process.exit(2);
});
