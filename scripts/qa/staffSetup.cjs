/**
 * Staff setup in one choice (Admin, Accounts) and a regional manager's own team (Venue claims, PART-7), used
 * from start to finish in a real headed Chromium on a production build.
 *
 *   QA_EMAIL=... QA_PASSWORD=... node scripts/qa/staffSetup.cjs
 *
 *   SITE          the web app under test (default http://localhost:5174, a production build: see README)
 *   STAFF_API     what answers /api/admin and /api/sales (default http://localhost:4340): PXIStudio-App
 *                 `npm run staff:local-api`, a backend checkout's real routes, gates and rules on made-up
 *                 accounts held in memory. Restart it before each run: the run changes those accounts.
 *   QA_EMAIL      any account that can sign in and open the dashboard. Its password is never printed.
 *   PXI_QA_DIR    where screenshots go (default scripts/qa/.artifacts)
 *
 * What is real here: the browser, the build, the sign-in, the pages, and the backend code that decides every
 * request. What is not:
 *   - The accounts. They are made up and live in the local API's memory, so nothing is written to a database
 *     and the real queries are not exercised. One run on a deployed backend is still owed.
 *   - Who the admin pages believe is signed in. The sign-in used is not an admin, so for the admin steps the
 *     page's own "who am I" answer is given an admin role. That opens the page and nothing more: each admin
 *     request is still decided by the backend code, as the made-up account named in that step.
 *
 * Run it headed. Cloudflare refuses a headless Chromium on dev.pxispace.com (README, point 1).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITE = process.env.SITE || 'http://localhost:5174';
const STAFF_API = (process.env.STAFF_API || 'http://localhost:4340').replace(/\/$/, '');
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const EMAIL = process.env.QA_EMAIL;
const PASSWORD = process.env.QA_PASSWORD;
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net|clarity\.ms|tiktok\.com|googlesyndication\.com/;

if (!EMAIL || !PASSWORD) {
    console.error('Set QA_EMAIL and QA_PASSWORD (any account that can open the dashboard).');
    process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name, ok, detail = '') => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail !== '' ? `  — ${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 300)}` : ''}`);
};
const note = (m) => console.log(`NOTE  ${m}`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
    const browser = await chromium.launch({ headless: false });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());

    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 240)));

    // ── who each request is answered as, and what was asked ──────────────────────────────────────────────
    let as = 'boss';
    let adminView = false; // true: the page's "who am I" answer carries an admin role (see the header)
    let olderBackend = false; // true: /api/sales/team answers as a backend from before PART-7 would
    const calls = [];
    const cors = { 'content-type': 'application/json', 'access-control-allow-origin': SITE, 'access-control-allow-credentials': 'true' };
    const preflight = { ...cors, 'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'authorization,content-type' };

    await ctx.route(/\/api\/(admin|sales)\//, async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: preflight });
        if (olderBackend && url.pathname.startsWith('/api/sales/team')) {
            calls.push({ as, method: req.method(), path: url.pathname, status: 404 });
            return route.fulfill({ status: 404, headers: cors, body: JSON.stringify({ error: 'Not Found', message: `Route ${req.method()} ${url.pathname} does not exist` }) });
        }
        const res = await ctx.request.fetch(`${STAFF_API}${url.pathname}${url.search}`, {
            method: req.method(), headers: { 'content-type': 'application/json', 'x-local-as': as }, data: req.postData() || undefined, failOnStatusCode: false,
        });
        const body = await res.body();
        calls.push({ as, method: req.method(), path: url.pathname, status: res.status(), sent: req.postData() });
        return route.fulfill({ status: res.status(), headers: cors, body });
    });
    await ctx.route(/\/api\/auth\/user\/[^/?]+(\?|$)/, async (route) => {
        const req = route.request();
        if (!adminView || !['GET', 'OPTIONS'].includes(req.method())) return route.continue();
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: preflight });
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ user: { accountTier: 'ADMIN', adminRole: 'ADMIN' } }) });
    });

    /** Straight to the local API, as a made-up account: what the backend holds and allows, not what a page shows. */
    const api = async (who, method, pathname, data) => {
        const res = await ctx.request.fetch(`${STAFF_API}${pathname}`, { method, headers: { 'content-type': 'application/json', 'x-local-as': who }, data, failOnStatusCode: false });
        return { status: res.status(), body: await res.json().catch(() => ({})) };
    };
    const staffOf = async (id) => (await api('boss', 'GET', '/__state')).body.users.find((u) => u.id === id);
    const auditRows = async () => (await api('boss', 'GET', '/__state')).body.audit;

    const settle = (ms = 1200) => page.waitForTimeout(ms);
    const open = async (pathAndQuery, wait = 3500) => {
        await page.goto(`${SITE}${pathAndQuery}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await settle(wait);
    };
    const until = async (fn, timeout = 15000) => {
        const end = Date.now() + timeout;
        for (;;) {
            if (await fn().catch(() => false)) return true;
            if (Date.now() > end) return false;
            await page.waitForTimeout(250);
        }
    };
    const text = async (locator) => ((await locator.count()) ? (await locator.first().innerText()).replace(/\s+/g, ' ').trim() : '');
    const shot = async (locator, name) => {
        if (!(await locator.count())) return;
        await locator.first().scrollIntoViewIfNeeded().catch(() => {});
        await locator.first().screenshot({ path: path.join(OUT, `staff-${name}.png`) }).catch((e) => note(`no picture ${name}: ${String(e.message).split('\n')[0]}`));
    };

    const state0 = await api('boss', 'GET', '/__state');
    if (state0.status !== 200) {
        console.error(`STAFF_API ${STAFF_API} is not answering. Start it: STAFF_LOCAL_API_CONFIRM=yes npm run staff:local-api (in PXIStudio-App).`);
        process.exit(2);
    }
    if (state0.body.audit.length) note('the local API has been written to already; restart it for a clean run');

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

    // ═════ Venue claims: a regional manager's own team ═══════════════════════════════════════════════════
    const team = page.locator('[data-sales-team]');
    const members = () => team.locator('[data-sales-team-member]');
    const memberNames = async () => members().evaluateAll((els) => els.map((el) => el.getAttribute('data-sales-team-member')));
    const teamError = () => text(team.locator('[data-sales-team-error]'));
    const teamDone = () => text(team.locator('[data-sales-team-done]'));
    const addBox = team.getByLabel('Ambassador username');
    const addButton = team.getByRole('button', { name: /add ambassador|adding/i });
    const typeAndAdd = async (name) => {
        await addBox.fill('');
        await addBox.pressSequentially(name, { delay: 10 });
        const before = calls.length;
        await addButton.click();
        await until(async () => calls.length > before && !/adding/i.test(await addButton.innerText()));
        await settle(700);
    };

    as = 'quinn';
    await open('/dashboard/sales', 4500);
    const M = '[regional manager]';
    check(`${M} the sidebar offers Venue Claims`, (await page.locator('a[href="/dashboard/sales"]').count()) > 0);
    check(`${M} the page shows "Your ambassadors"`, await until(async () => (await team.count()) === 1 && (await members().count()) > 0), await text(page.locator('main')));
    check(`${M} it lists this manager's own ambassadors, and nobody else's`, same((await memberNames()).sort(), ['avery', 'blake']), await memberNames());
    check(`${M} each one shows the claims they raised`, /Claims: 2 approved, 1 waiting/.test(await text(members().nth(0))) && /No claims yet/.test(await text(members().nth(1))), await text(team));
    await shot(team, 'team-1-list');

    const callsBefore = calls.length;
    await typeAndAdd('@Sam');
    const adds = calls.slice(callsBefore).filter((c) => c.method === 'POST' && c.path === '/api/sales/team');
    check(`${M} adding by username sends one request, with the username and nothing else`, adds.length === 1 && adds[0].sent === JSON.stringify({ username: 'Sam' }) && adds[0].status === 201, adds);
    check(`${M} the page says who was added and what they can do now`, /Sam Ortiz is on your team now and can raise claims on New York venues/.test(await teamDone()), await teamDone());
    check(`${M} the new ambassador is in the list`, same((await memberNames()).sort(), ['avery', 'blake', 'sam']), await memberNames());
    const samOn = await staffOf('sam');
    check(`${M} the backend holds the change: ambassador, under this manager, still not an admin`, samOn.salesRole === 'AMBASSADOR' && samOn.salesManagerId === 'quinn' && samOn.adminRole === 'NONE' && samOn.accountTier === 'CITIZEN', samOn);
    const samMe = await api('sam', 'GET', '/api/sales/me');
    check(`${M} it is in force at once: the new ambassador has the sales tools, in New York`, samMe.status === 200 && samMe.body.salesRole === 'AMBASSADOR' && samMe.body.cityCode === 'NYC', samMe);
    await shot(team, 'team-2-added');

    await typeAndAdd('sam');
    check(`${M} adding the same person again says so and changes nothing`, /already on your team/.test(await teamDone()) && (await members().count()) === 3, await teamDone());

    const stateBeforeRefusals = JSON.stringify((await api('boss', 'GET', '/__state')).body.users);
    const refusals = [
        ['casey', /already has a sales role/i, "another manager's ambassador"],
        ['jordan', /already has a sales role/i, 'another regional manager'],
        ['taylor', /staff role/i, 'a moderator'],
        ['nycadmin', /staff role/i, 'a city admin'],
        ['pat', /staff role/i, 'an admin by company email'],
        ['morgan', /suspended/i, 'a suspended account'],
        ['quinn', /cannot add yourself/i, 'the manager themselves'],
        ['nobody_by_this_name', /No account with that username/i, 'a username that is not an account'],
    ];
    for (const [name, message, what] of refusals) {
        await typeAndAdd(name);
        const shown = await teamError();
        check(`${M} ${what} is refused, and the page says why`, message.test(shown) && (await members().count()) === 3, shown || '(no message shown)');
    }
    check(`${M} none of the refusals changed any account`, JSON.stringify((await api('boss', 'GET', '/__state')).body.users) === stateBeforeRefusals);
    await shot(team, 'team-3-refused');

    const samRow = team.locator('[data-sales-team-member="sam"]');
    await samRow.getByRole('button', { name: 'Remove', exact: true }).click();
    await settle(400);
    check(`${M} Remove asks first, and the message from the last action is cleared`, /Take @sam off your team\?/.test(await text(samRow)) && !(await teamError()) && !(await teamDone()), [await text(samRow), await teamError()]);
    await shot(team, 'team-4-confirm');
    const beforeKeep = calls.length;
    await samRow.getByRole('button', { name: 'Keep', exact: true }).click();
    await settle(600);
    check(`${M} Keep sends nothing and leaves the team as it was`, calls.length === beforeKeep && (await members().count()) === 3 && (await staffOf('sam')).salesRole === 'AMBASSADOR');
    await samRow.getByRole('button', { name: 'Remove', exact: true }).click();
    await settle(300);
    const beforeRemove = calls.length;
    await samRow.getByRole('button', { name: /yes, remove/i }).click();
    await until(async () => (await members().count()) === 2);
    const removes = calls.slice(beforeRemove).filter((c) => c.method === 'DELETE');
    check(`${M} removing sends one request, for that ambassador`, removes.length === 1 && removes[0].path === '/api/sales/team/sam' && removes[0].status === 200, removes);
    check(`${M} the page says they are off the team and their claims stay`, /@sam is off your team\. The claims they raised stay/.test(await teamDone()), await teamDone());
    const samOff = await staffOf('sam');
    check(`${M} the backend holds it: no sales role, no manager`, samOff.salesRole === 'NONE' && samOff.salesManagerId === null, samOff);
    check(`${M} it is in force at once: the sales tools are closed to them`, (await api('sam', 'GET', '/api/sales/me')).status === 403);
    const teamAudit = (await auditRows()).filter((a) => a.targetId === 'sam');
    check(`${M} both changes are in the audit trail, in the manager's name`, teamAudit.length === 2 && teamAudit.every((a) => a.adminId === 'quinn' && a.action === 'SALES_ROLE_CHANGE' && a.detailJson.by === 'REGIONAL_MANAGER' && a.detailJson.territory === 'NYC'), teamAudit);

    // Phone width, while the manager's page is open.
    await page.setViewportSize({ width: 390, height: 844 });
    await settle(1200);
    const overflow = await page.evaluate(() => {
        const panel = document.querySelector('[data-sales-team]');
        const wide = [...panel.querySelectorAll('*')].filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1);
        return { page: document.documentElement.scrollWidth - window.innerWidth, wide: wide.length };
    });
    check(`${M} at phone width nothing in the panel runs off the screen`, overflow.page <= 1 && overflow.wide === 0, overflow);
    await shot(team, 'team-5-phone');
    await page.setViewportSize({ width: 1440, height: 1000 });

    // An ambassador gets no team panel, and the page does not even ask.
    as = 'avery';
    const beforeAmbassador = calls.length;
    await open('/dashboard/sales', 4500);
    const A = '[ambassador]';
    check(`${A} the page opens with the claim tools`, /raise a claim/i.test(await text(page.locator('main'))), await text(page.locator('main')));
    check(`${A} there is no "Your ambassadors" panel`, (await team.count()) === 0);
    check(`${A} the page did not ask for a team`, !calls.slice(beforeAmbassador).some((c) => c.path.startsWith('/api/sales/team')));
    check(`${A} asking anyway is refused by the backend`, (await api('avery', 'POST', '/api/sales/team', { username: 'sam' })).status === 403 && (await staffOf('sam')).salesRole === 'NONE');

    // The web can be deployed before the backend: a server with no /team route must not break the page.
    as = 'quinn';
    olderBackend = true;
    await open('/dashboard/sales', 4500);
    const O = '[manager, backend from before this change]';
    const olderMain = await text(page.locator('main'));
    check(`${O} the page still works, without the panel and without an error`, /waiting for your approval/i.test(olderMain) && /raise a claim/i.test(olderMain) && (await team.count()) === 0 && !/not found|does not exist/i.test(olderMain), olderMain);
    olderBackend = false;

    // ═════ Admin, Accounts: staff setup in one choice ════════════════════════════════════════════════════
    adminView = true;
    as = 'boss';
    await open('/dashboard/admin/users', 5000);
    const S = '[super admin]';
    const rowOf = (email) => page.locator('tbody tr', { hasText: email }).first();
    const badgesOf = async (email) => rowOf(email).locator('[data-staff-badge]').evaluateAll((els) => els.map((el) => `${el.textContent.trim()} (${el.getAttribute('data-staff-badge')})`));
    const setup = page.locator('[data-staff-setup]');
    const choice = setup.getByLabel('Set up as');
    const save = setup.getByRole('button', { name: 'Save', exact: true });
    const notice = () => text(page.locator('[data-admin-notice]'));
    const openAccount = async (email) => {
        await rowOf(email).click();
        await until(async () => (await setup.count()) === 1);
        await settle(900); // the list of regional managers arrives after the panel
    };

    check(`${S} Accounts opens and lists the accounts`, await until(async () => (await page.locator('tbody tr').count()) >= 13), `${await page.locator('tbody tr').count()} rows at ${page.url()}`);
    check(`${S} the table says what is in force: a city admin, a manager, a super admin`,
        same(await badgesOf('nycadmin@pxi.test'), ['Admin for New York (admin)']) && same(await badgesOf('quinn@pxi.test'), ['Regional manager, New York (sales)']) && same(await badgesOf('boss@pxi.test'), ['Super admin (admin)']),
        [await badgesOf('nycadmin@pxi.test'), await badgesOf('quinn@pxi.test'), await badgesOf('boss@pxi.test')]);
    check(`${S} a role saved without its tier is shown as not on, not as an admin`, same(await badgesOf('devon@pxi.test'), ['Admin for Boston, not on (off)']), await badgesOf('devon@pxi.test'));
    check(`${S} an admin through a company email is shown as an admin`, same(await badgesOf('pat@staff.pxi.test'), ['Admin for all cities (admin)']), await badgesOf('pat@staff.pxi.test'));

    // One person, from nothing to city admin and regional manager.
    await openAccount('riley@pxi.test');
    check(`${S} an account opens on one choice: what it is now, and "Set up as"`, /Right now: No staff access\./.test(await text(setup)) && (await choice.inputValue()) === 'NONE', await text(setup));
    const options = await choice.locator('option').allInnerTexts();
    check(`${S} the choices are the eight kinds of staff, in words`, same(options, ['No staff access', 'City admin and regional manager', 'City admin', 'Regional manager', 'Ambassador', 'Admin for all cities', 'Moderator', 'Support']), options);
    check(`${S} the old separate controls are folded away under Advanced`, (await page.locator('details[data-staff-advanced]').count()) === 1 && !(await page.locator('details[data-staff-advanced]').evaluate((d) => d.open)) && !(await page.getByLabel('Account tier').isVisible()));
    check(`${S} Save is off until something would change`, await save.isDisabled());
    await choice.selectOption({ label: 'City admin and regional manager' });
    await settle(300);
    check(`${S} a choice that needs a city asks for one, and Save waits for it`, (await setup.getByLabel('City', { exact: true }).count()) === 1 && (await save.isDisabled()));
    check(`${S} the choice says in a line what the person will be able to do`, /Runs the control room for one city, approves that city's venue claims, and adds their own ambassadors/.test(await text(setup.locator('[data-staff-hint]'))), await text(setup.locator('[data-staff-hint]')));
    await setup.getByLabel('City', { exact: true }).selectOption({ label: 'New York' });
    await settle(300);
    check(`${S} with the city picked, Save is on`, await save.isEnabled());
    await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-1-choice');
    let before = calls.length;
    await save.click();
    await until(async () => Boolean(await notice()));
    const writes = calls.slice(before).filter((c) => c.method !== 'GET');
    check(`${S} one press of Save is one request, carrying the whole setup`,
        writes.length === 1 && writes[0].method === 'POST' && writes[0].path === '/api/admin/users/riley/staff-access' && writes[0].status === 200
            && writes[0].sent === JSON.stringify({ adminRole: 'ADMIN', adminCityCode: 'NYC', salesRole: 'REGIONAL_MANAGER', salesManagerId: null }), writes);
    check(`${S} the page says what was saved`, (await notice()) === 'Saved. @riley is now: city admin and regional manager for New York.', await notice());
    check(`${S} the row shows both roles`, await until(async () => same(await badgesOf('riley@pxi.test'), ['Admin for New York (admin)', 'Regional manager, New York (sales)'])), await badgesOf('riley@pxi.test'));
    const riley = await staffOf('riley');
    check(`${S} the backend holds it, tier included`, same(riley, { id: 'riley', accountTier: 'ADMIN', adminRole: 'ADMIN', adminCityCode: 'NYC', salesRole: 'REGIONAL_MANAGER', salesManagerId: null }), riley);
    const rileyWho = await api('riley', 'GET', '/api/admin/whoami');
    const rileyTeam = await api('riley', 'GET', '/api/sales/team');
    check(`${S} it is in force with no second step: the control room opens for New York, and the team tools too`, rileyWho.status === 200 && rileyWho.body.adminRole === 'ADMIN' && rileyWho.body.cityScope === 'NYC' && rileyTeam.status === 200, [rileyWho, rileyTeam]);
    await shot(page.locator('main'), 'accounts-2-saved');

    // The state the old controls left behind: a role with no tier.
    await openAccount('devon@pxi.test');
    check(`${S} a role that is saved but not on is explained`, /role is saved but not switched on, so this person cannot open the control room\. Press Save to switch it on\./.test(await text(setup.locator('[data-staff-warning]'))), await text(setup));
    check(`${S} the choice already shows what was meant, and Save is on`, (await choice.inputValue()) === 'CITY_ADMIN' && (await setup.getByLabel('City', { exact: true }).inputValue()) === 'BOS' && (await save.isEnabled()));
    await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-3-not-on');
    check(`${S} before saving, the control room is closed to that person`, (await api('devon', 'GET', '/api/admin/whoami')).status === 403);
    await save.click();
    await until(async () => /devon/.test(await notice()));
    const devonWho = await api('devon', 'GET', '/api/admin/whoami');
    check(`${S} Save switches it on: the control room opens for Boston`, devonWho.status === 200 && devonWho.body.cityScope === 'BOS' && (await until(async () => same(await badgesOf('devon@pxi.test'), ['Admin for Boston (admin)']))), [devonWho, await badgesOf('devon@pxi.test')]);

    // An ambassador, under the manager just made.
    await openAccount('sam@pxi.test');
    await choice.selectOption({ label: 'Ambassador' });
    await settle(300);
    const managerPick = setup.getByLabel('Regional manager', { exact: true });
    const managerOptions = await managerPick.locator('option').allInnerTexts();
    check(`${S} an ambassador needs a manager, picked from the regional managers by name and city`, same(managerOptions, ['Choose their regional manager', 'Jordan Hale (Boston)', 'Quinn Park (New York)', 'Riley Stone (New York)']) && (await save.isDisabled()), managerOptions);
    await managerPick.selectOption({ label: 'Riley Stone (New York)' });
    await settle(300);
    await save.click();
    await until(async () => /sam/.test(await notice()));
    const sam = await staffOf('sam');
    check(`${S} the ambassador is saved under that manager, and is not made an admin`, sam.salesRole === 'AMBASSADOR' && sam.salesManagerId === 'riley' && sam.adminRole === 'NONE' && sam.accountTier === 'CITIZEN' && (await until(async () => same(await badgesOf('sam@pxi.test'), ['Ambassador (sales)']))), [sam, await badgesOf('sam@pxi.test')]);

    // A setup the rules refuse.
    const quinnBefore = await staffOf('quinn');
    await openAccount('quinn@pxi.test');
    check(`${S} a manager reads as a manager`, /Right now: Regional manager for New York\./.test(await text(setup)) && (await choice.inputValue()) === 'REGIONAL_MANAGER', await text(setup));
    await choice.selectOption({ label: 'No staff access' });
    await settle(300);
    await save.click();
    const refusal = setup.locator('[data-staff-error]');
    await until(async () => Boolean(await text(refusal)));
    check(`${S} a refused setup shows the reason beside Save and stays open`, /This manager has 2 ambassador\(s\)\. Reassign them before changing/.test(await text(refusal)) && (await setup.count()) === 1, await text(refusal));
    check(`${S} and it changed nothing`, same(await staffOf('quinn'), quinnBefore));
    await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-4-refused');
    await rowOf('quinn@pxi.test').click();
    await settle(400);

    // The mixes the choices do not cover are still reachable.
    await openAccount('taylor@pxi.test');
    check(`${S} a moderator reads as a moderator`, /Right now: Moderator\./.test(await text(setup)) && (await choice.inputValue()) === 'MODERATOR', await text(setup));
    await page.locator('details[data-staff-advanced] summary').click();
    await settle(400);
    check(`${S} Advanced holds the separate settings, as before`, (await page.getByLabel('Account tier').isVisible()) && (await page.getByLabel('Control-room role').isVisible()) && (await page.getByLabel('Admin city').isVisible()) && (await page.getByLabel('Sales role').isVisible()));
    await rowOf('taylor@pxi.test').click();
    await settle(400);

    // A super admin's own account is not something to choose.
    await rowOf('boss@pxi.test').click();
    await until(async () => (await setup.count()) === 1);
    check(`${S} a super admin's account says it is set on the server, and offers no choice`, (await setup.getAttribute('data-staff-setup')) === 'fixed' && /Super admin\. This is set by email on the server and cannot be changed here\./.test(await text(setup)) && (await choice.count()) === 0 && (await page.locator('details[data-staff-advanced]').count()) === 0, await text(setup));
    await rowOf('boss@pxi.test').click();

    const audit = await auditRows();
    const of = (id) => audit.filter((a) => a.targetId === id && a.adminId === 'boss').map((a) => a.action);
    check(`${S} every saved setup is in the audit trail, in the super admin's name`, same(of('riley'), ['ROLE_CHANGE', 'SALES_ROLE_CHANGE']) && same(of('devon'), ['ROLE_CHANGE']) && same(of('sam'), ['SALES_ROLE_CHANGE']) && of('quinn').length === 0, { riley: of('riley'), devon: of('devon'), sam: of('sam'), quinn: of('quinn') });

    // ── an admin who is not a super admin ────────────────────────────────────────────────────────────────
    as = 'nycadmin';
    await open('/dashboard/admin/users', 5000);
    const C = '[city admin]';
    await until(async () => (await page.locator('tbody tr').count()) > 0);
    const listed = await text(page.locator('tbody'));
    check(`${C} Accounts lists the people in their city only`, /riley@pxi\.test/.test(listed) && !/jordan@pxi\.test|casey@pxi\.test|devon@pxi\.test/.test(listed), listed);
    await rowOf('riley@pxi.test').click();
    const readonly = page.locator('[data-staff-readonly]');
    await until(async () => (await readonly.count()) === 1);
    check(`${C} staff access is shown, not editable, and the page says who can change it`,
        /Staff access: Admin for New York and regional manager for New York\. Only a super admin can change it, and \S+@\S+ is not a super admin account\./.test(await text(readonly)) && (await setup.count()) === 0 && (await page.locator('details[data-staff-advanced]').count()) === 0, await text(readonly));
    await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-5-not-super-admin');
    const rileyKept = await staffOf('riley');
    const tried = await api('nycadmin', 'POST', '/api/admin/users/riley/staff-access', { adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null });
    check(`${C} asking the backend anyway is refused, and changes nothing`, tried.status === 403 && same(await staffOf('riley'), rileyKept), tried);

    check('no page raised a script error', pageErrors.length === 0, pageErrors);
    console.log(`\n${failures ? `${failures} FAILED` : 'ALL PASSED'}  (screenshots: ${OUT})`);
    await browser.close();
    process.exit(failures ? 1 : 0);
})().catch((err) => {
    console.error('RUN ERROR', String(err && err.stack ? err.stack : err).slice(0, 1200));
    process.exit(1);
});
