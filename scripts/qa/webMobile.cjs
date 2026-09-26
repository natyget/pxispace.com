/**
 * WEB-1 on mobile web — sub-task 1162 asks for "QA desktop + mobile web", and every earlier run
 * in this repo used a 1440px viewport. This is the other half.
 *
 *   SITE=https://test.pxispace.com node scripts/qa/webMobile.cjs
 *
 * It re-checks WEB-1's user-visible criteria at phone width, with a phone user agent and touch
 * enabled, and adds the things that only go wrong on a small screen: horizontal overflow, a CTA
 * pushed off-screen or under the fold, and tap targets too small to hit.
 *
 * Deliberately few navigations — a long automated run against the deployed site trips
 * Cloudflare's bot check part way through, and every assertion after that reads as a broken app.
 * Headed on purpose, for the same reason (see README).
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = process.env.SITE || 'https://test.pxispace.com';
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const SHOTS = path.join(OUT, 'web-mobile');

// Real phone profiles rather than a narrow desktop window: they bring the touch flag, the
// device pixel ratio and the mobile UA, and those change what the site serves and how it lays out.
//
// Two heights on purpose. Playwright's iPhone 13 profile is 390x664 — the *visible* height with
// the browser chrome showing, which is what a visitor actually gets on arrival. 390x844 is the
// full screen, what they get after the address bar collapses on scroll. "Above the fold" is the
// one check whose answer differs between them, and both answers are worth having.
const PROFILES = [
    { name: 'iPhone 13 · 390x664 (address bar showing)', device: devices['iPhone 13'] },
    {
        name: 'iPhone 13 · 390x844 (full screen)',
        device: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
];
const MIN_TAP = 44; // the same floor ALB-4 was held to

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
        console.log(`  FAIL  ${name}${detail === undefined ? '' : `  → ${JSON.stringify(detail).slice(0, 200)}`}`);
    }
}
/**
 * A measurement worth recording that is NOT an acceptance criterion, so it must not turn the
 * run red. WEB-1 asks that an empty city "shows the CTA, not skeletons" — it says nothing about
 * the fold. Failing on fold position would make the suite assert a rule nobody agreed to;
 * dropping it would lose a real mobile-web observation.
 */
const notes = [];
function note(name, value) {
    notes.push(`${name} — ${value}`);
    console.log(`  NOTE  ${name} — ${value}`);
}
const section = (t) => console.log(`\n${t}\n${'─'.repeat(t.length)}`);

const CHALLENGE = /Performing security verification|Just a moment|Ray ID:/i;
const textOf = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

async function go(page, url, settle = 6000) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    for (let i = 0; i < 10; i += 1) {
        if (!CHALLENGE.test(await textOf(page).catch(() => ''))) break;
        await page.waitForTimeout(4000);
    }
    await page.waitForTimeout(settle);
}

/** Does the document scroll sideways? The classic phone-layout break. */
const overflowsX = (page) =>
    page.evaluate(() => {
        const d = document.documentElement;
        return { scrollW: d.scrollWidth, clientW: d.clientWidth, over: d.scrollWidth > d.clientWidth + 1 };
    });

/** The CTA's box, and whether it is inside the viewport and above the fold. */
async function ctaGeometry(page) {
    const cta = page.locator('a[href="/dashboard/events/new"]').first();
    if ((await cta.count()) === 0) return null;
    const box = await cta.boundingBox();
    const vp = page.viewportSize();
    if (!box) return null;
    return {
        ...box,
        withinX: box.x >= -1 && box.x + box.width <= vp.width + 1,
        aboveFold: box.y + box.height <= vp.height,
        tallEnough: box.height >= MIN_TAP,
    };
}

async function runProfile(browser, profile) {
    console.log(`\n${'='.repeat(74)}\n${profile.name}\n${'='.repeat(74)}`);
    const tag = profile.device.viewport.height;
    const ctx = await browser.newContext({ ...profile.device });
    const page = await ctx.newPage();

    // ── An empty city ───────────────────────────────────────────────────────────────────────
    section('WEB-1 · empty city, at phone width');

    await go(page, `${SITE}/discover/new-york`, 7000);
    let body = await textOf(page);
    await page.screenshot({ path: path.join(SHOTS, `01-empty-city-${tag}.png`), fullPage: true });

    check('an empty city says so', /No live events in New York yet/.test(body), body.slice(0, 140));
    check('…and offers to create one', /Create an event/.test(body));
    check('…with no skeletons left behind', (await page.locator('.animate-pulse').count()) === 0);
    check('…and no error copy', !/Could not load events/.test(body));

    const ox1 = await overflowsX(page);
    check('…and the page does not scroll sideways', !ox1.over, ox1);

    const cta = await ctaGeometry(page);
    check('the CTA is present and measurable', cta !== null);
    if (cta) {
        check('…fully inside the viewport', cta.withinX, cta);
        note(
            '…CTA vs the fold',
            `bottom at ${Math.round(cta.y + cta.height)}px, viewport ${page.viewportSize().height}px → ` +
                `${cta.aboveFold ? 'above the fold' : 'needs a scroll'}`,
        );
        check(`…and at least ${MIN_TAP}px tall to tap`, cta.tallEnough, { height: cta.height });
    }

    // ── A city with events ──────────────────────────────────────────────────────────────────
    section('WEB-1 · a city with events, at phone width');

    await go(page, `${SITE}/discover/boston`, 7000);
    body = await textOf(page);
    await page.screenshot({ path: path.join(SHOTS, `02-city-with-events-${tag}.png`), fullPage: true });

    check('a city with events lists them', /QA Boston Discovery Night/i.test(body), body.slice(0, 160));
    check('…and does not pitch creating one instead', !/No live events in Boston/.test(body));

    const ox2 = await overflowsX(page);
    check('…and still does not scroll sideways', !ox2.over, ox2);

    // Cards must not spill out of the column on a narrow screen.
    const spill = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        return [...document.querySelectorAll('a[href^="/events/"]')]
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 0 && (r.left < -1 || r.right > w + 1)).length;
    });
    check('…and no event card spills past the viewport', spill === 0, { spilling: spill });

    // ── The genre sub-hub, and the round trip ───────────────────────────────────────────────
    section('WEB-1 · genre sub-hub + CTA round trip, at phone width');

    await go(page, `${SITE}/discover/boston/afrohouse`, 5000);
    body = await textOf(page);
    await page.screenshot({ path: path.join(SHOTS, `03-genre-hub-${tag}.png`), fullPage: true });

    check('the genre sub-hub has its own empty heading', /No Afro House events in Boston yet/.test(body));
    const genreCta = await ctaGeometry(page);
    check('…and its own CTA, inside the viewport', genreCta !== null && genreCta.withinX, genreCta);

    const ox3 = await overflowsX(page);
    check('…and does not scroll sideways', !ox3.over, ox3);

    // Tap it as a finger would, not as a mouse would.
    await page.locator('a[href="/dashboard/events/new"]').first().tap();
    await page.waitForURL(/\/login/, { timeout: 60000 }).catch(() => {});
    for (let i = 0; i < 10 && CHALLENGE.test(await textOf(page).catch(() => '')); i += 1) {
        await page.waitForTimeout(4000);
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS, `04-login-${tag}.png`), fullPage: true });

    check(
        'tapping the CTA lands on login with the return path',
        /\/login\?redirect=(%2F)?dashboard/.test(page.url()),
        page.url(),
    );

    // The login form has to be usable on the device the CTA just sent them to.
    const loginUsable = await page.evaluate(() => {
        const email = document.querySelector('input[type="email"]');
        const submit = document.querySelector('button[type="submit"]');
        const w = document.documentElement.clientWidth;
        const r = (el) => (el ? el.getBoundingClientRect() : null);
        const e = r(email);
        const s = r(submit);
        return {
            hasEmail: !!e,
            hasSubmit: !!s,
            emailInside: e ? e.left >= -1 && e.right <= w + 1 : false,
            submitInside: s ? s.left >= -1 && s.right <= w + 1 : false,
            submitHeight: s ? Math.round(s.height) : 0,
            overflowsX: document.documentElement.scrollWidth > w + 1,
        };
    });
    check('…where the login form fits the screen', loginUsable.emailInside && loginUsable.submitInside, loginUsable);
    check(`…and its submit is at least ${MIN_TAP}px tall`, loginUsable.submitHeight >= MIN_TAP, loginUsable);
    check('…with no sideways scroll on login either', !loginUsable.overflowsX, loginUsable);

    await ctx.close();
}

(async () => {
    console.log(`site ${SITE}`);
    const browser = await chromium.launch({ headless: process.env.HEADLESS === '1' });
    for (const profile of PROFILES) await runProfile(browser, profile);
    await browser.close();
    console.log(`\n${pass} passed, ${fail} failed`);
    if (failed.length) console.log(`failed:\n  - ${failed.join('\n  - ')}`);
    if (notes.length) console.log(`\nmeasurements (not criteria):\n  - ${notes.join('\n  - ')}`);
    console.log(`screenshots: ${SHOTS}`);
    process.exit(fail ? 1 : 0);
})().catch((e) => {
    console.error('RUN FAILED', e);
    process.exit(2);
});
