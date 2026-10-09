/**
 * Staff setup in one choice (Admin, Accounts) and a regional manager's own team (Venue claims, PART-7),
 * against the DEPLOYED API with real staff sign-ins, in a real headed Chromium on a production build.
 *
 *   SUPER_EMAIL=... SUPER_PASSWORD=... MANAGER_EMAIL=... MANAGER_PASSWORD=... node scripts/qa/staffLive.cjs
 *
 * Nothing is intercepted and nothing is made up: every account signs in through the login form, every
 * request goes from the browser to the API, and what the backend stored is read back through the API as the
 * signed-in account. `staffSetup.cjs` is the other half: the same screens on made-up accounts, for a branch
 * that is not deployed yet.
 *
 *   SITE                   the web app under test (default http://localhost:5174, a production build of the
 *                          deployed commit: see README, point 4)
 *   API                    the deployed API (default https://dev.pxispace.com)
 *   SUPER_EMAIL/PASSWORD   a super admin. Without it the Accounts steps are skipped, and said so.
 *   MANAGER_EMAIL/PASSWORD a regional manager. Without it the team steps are skipped, and said so.
 *   AMBASSADOR_..., CITYADMIN_..., MEMBER_...   optional: an ambassador, a city admin, an account with no staff role
 *   MANAGER2_EMAIL/PASSWORD optional: a second regional manager. Used only when there is no super admin
 *                          sign-in, to hold QA_UNDER on another team so the first manager can be refused it.
 *   QA_SET_UP, QA_UNDER, QA_WAITING, QA_ADDED   usernames of four accounts with NO staff or sales role that the run
 *                          may change (defaults qa_fan6, qa_fan5, qa_fan4, qa_fan3)
 *   PXI_QA_DIR             where screenshots go (default scripts/qa/.artifacts)
 *
 * THIS RUN WRITES, through the real screens: it sets QA_SET_UP up as city admin and regional manager, puts
 * QA_UNDER under them as an ambassador, leaves QA_WAITING with a role and no tier and then switches it on, and
 * has the manager add and remove QA_ADDED. It sets every one of them back, and does so even if a step fails.
 * The four accounts must have no staff or sales role when it starts, or it stops before changing anything.
 * Passwords are never printed. Run it headed (README, point 1).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITE = process.env.SITE || 'http://localhost:5174';
const API = (process.env.API || 'https://dev.pxispace.com').replace(/\/$/, '');
const OUT = process.env.PXI_QA_DIR || path.join(__dirname, '.artifacts');
const who = (prefix) => (process.env[`${prefix}_EMAIL`] && process.env[`${prefix}_PASSWORD`] ? { email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] } : null);
const SIGN_INS = { superAdmin: who('SUPER'), manager: who('MANAGER'), otherManager: who('MANAGER2'), ambassador: who('AMBASSADOR'), cityAdmin: who('CITYADMIN'), member: who('MEMBER') };
const T = {
    setUp: process.env.QA_SET_UP || 'qa_fan6',
    under: process.env.QA_UNDER || 'qa_fan5',
    waiting: process.env.QA_WAITING || 'qa_fan4',
    added: process.env.QA_ADDED || 'qa_fan3',
};
// Accounts on dev the manager must be refused. Named, never changed: the refusal is the test.
const OTHERS = { manager: 'qa_rm_bos', cityAdmin: 'qa_admin_nyc', moderator: 'qa_moderator', superAdmin: 'qa_super_admin' };
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net|clarity\.ms|tiktok\.com|googlesyndication\.com/;
const OFF = { adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null };

if (!SIGN_INS.superAdmin && !SIGN_INS.manager) {
    console.error('Set SUPER_EMAIL and SUPER_PASSWORD, or MANAGER_EMAIL and MANAGER_PASSWORD, or both.');
    process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name, ok, detail = '') => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail !== '' ? `  — ${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 320)}` : ''}`);
    return ok;
};
const note = (m) => console.log(`NOTE  ${m}`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
    const browser = await chromium.launch({ headless: false });
    const pageErrors = [];

    /** One signed-in person: their own browser context, signed in by typing into the real form. */
    async function signIn(label, creds) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        const page = await ctx.newPage();
        await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());
        page.on('pageerror', (e) => pageErrors.push(`${label}: ${String(e.message).slice(0, 200)}`));
        // What the page itself asked the API, and what the API answered.
        const seen = [];
        page.on('response', (r) => {
            const url = new URL(r.url());
            if (!url.href.startsWith(API) || !/^\/api\/(admin|sales)\//.test(url.pathname) || r.request().method() === 'OPTIONS') return;
            seen.push({ method: r.request().method(), path: url.pathname, status: r.status(), sent: r.request().postData() });
        });

        await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(3000);
        const e = page.locator('input[type="email"]').first();
        await e.click(); await e.pressSequentially(creds.email, { delay: 8 });
        const p = page.locator('input[type="password"]').first();
        await p.click(); await p.pressSequentially(creds.password, { delay: 8 });
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 45000 }).catch(() => {});
        await page.waitForTimeout(2500);
        const ok = check(`[${label}] signed in through the login form`, !/\/login/.test(new URL(page.url()).pathname), page.url());

        /** The browser's own request to the API, as this person. A request re-sent from Node is challenged. */
        const call = (method, pathname, body) => page.evaluate(async (a) => {
            const res = await fetch(a.api + a.pathname, {
                method: a.method,
                headers: { 'content-type': 'application/json', authorization: `Bearer ${localStorage.getItem('pxi_token')}` },
                body: a.body === undefined ? undefined : JSON.stringify(a.body),
            });
            return { status: res.status, body: await res.json().catch(() => ({})) };
        }, { api: API, method, pathname, body });
        const settle = (ms = 1200) => page.waitForTimeout(ms);
        const open = async (pathAndQuery, wait = 4000) => {
            await page.goto(`${SITE}${pathAndQuery}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
            await settle(wait);
        };
        const until = async (fn, timeout = 20000) => {
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
            await locator.first().screenshot({ path: path.join(OUT, `staff-live-${name}.png`) }).catch((err) => note(`no picture ${name}: ${String(err.message).split('\n')[0]}`));
        };
        return { ok, ctx, page, seen, call, settle, open, until, text, shot };
    }

    let admin = null;
    let manager = null;
    let managerUsername = null;
    // Another manager who holds T.under on their own team for the length of the run (no super admin needed).
    let other = null;
    let otherTeamBefore = null;
    // The four accounts the run changes, as the super admin's list reports them: { username: row }.
    const start = {};
    const staffOf = (row) => row && { accountTier: row.accountTier, adminRole: row.adminRole, adminCityCode: row.adminCityCode ?? null, salesRole: row.salesRole, salesManagerId: row.salesManagerId ?? null };
    const account = async (username) => {
        const res = await admin.call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`);
        return (res.body.users || []).find((u) => u.username === username) || null;
    };

    try {
        // ═════ a super admin: who is who before anything is changed ═══════════════════════════════════════
        if (SIGN_INS.superAdmin) {
            admin = await signIn('super admin', SIGN_INS.superAdmin);
            const whoami = await admin.call('GET', '/api/admin/whoami');
            if (!check('[super admin] the deployed API says this sign-in is a super admin', whoami.status === 200 && whoami.body.adminRole === 'SUPER_ADMIN' && whoami.body.cityScope === null, whoami)) {
                throw new Error('not a super admin on this API: nothing was changed');
            }
            for (const username of Object.values(T)) {
                start[username] = await account(username);
                if (!start[username]) throw new Error(`@${username} is not on this API: nothing was changed`);
                const s = staffOf(start[username]);
                if (s.adminRole !== 'NONE' || s.salesRole !== 'NONE' || s.adminCityCode || s.accountTier === 'ADMIN') {
                    throw new Error(`@${username} already has staff access (${JSON.stringify(s)}): nothing was changed`);
                }
            }
            check('[super admin] the deployed API sends the role in force with each account (the new backend is live)', typeof start[T.setUp].liveAdminRole === 'string' && !('googleId' in start[T.setUp]) && !('appleId' in start[T.setUp]), Object.keys(start[T.setUp]));
            note(`the run may change @${Object.values(T).join(', @')}; each has no staff access now`);
        } else {
            note('no super admin sign-in: the Accounts steps are skipped');
        }

        if (admin) {
            const { page, seen, call, settle, open, until, text, shot } = admin;
            const S = '[super admin]';
            const rowOf = (username) => page.locator('tbody tr').filter({ has: page.getByRole('cell', { name: username, exact: true }) }).first();
            const badgesOf = async (username) => rowOf(username).locator('[data-staff-badge]').evaluateAll((els) => els.map((el) => `${el.textContent.trim()} (${el.getAttribute('data-staff-badge')})`));
            const setup = page.locator('[data-staff-setup]');
            const choice = setup.getByLabel('Set up as');
            const save = setup.getByRole('button', { name: 'Save', exact: true });
            const notice = () => text(page.locator('[data-admin-notice]'));
            const search = page.locator('input[type="search"]').first();
            const find = async (username) => {
                await search.fill('');
                await search.pressSequentially(username, { delay: 10 });
                return until(async () => (await rowOf(username).count()) === 1 && (await page.locator('tbody tr').count()) <= 3);
            };
            const openAccount = async (username) => {
                await find(username);
                if (!(await setup.count())) await rowOf(username).click();
                await until(async () => (await setup.count()) === 1);
                await settle(1200); // the list of regional managers arrives after the panel
            };
            const saved = async (username, pattern) => until(async () => pattern.test(await notice()) && (await setup.count()) === 0);

            await open('/dashboard/admin/users', 5000);
            check(`${S} Accounts opens on the deployed API's accounts`, await until(async () => (await page.locator('tbody tr').count()) > 3), `${await page.locator('tbody tr').count()} rows at ${page.url()}`);
            await shot(page.locator('main'), 'accounts-0-list');

            // One person, from nothing to city admin and regional manager, with one Save.
            await openAccount(T.setUp);
            check(`${S} an account opens on one choice: what it is now, and "Set up as"`, /Right now: No staff access\./.test(await text(setup)) && (await choice.inputValue()) === 'NONE' && (await save.isDisabled()), await text(setup));
            await choice.selectOption({ label: 'City admin and regional manager' });
            await settle(300);
            check(`${S} a choice that needs a city asks for one, and Save waits for it`, (await setup.getByLabel('City', { exact: true }).count()) === 1 && (await save.isDisabled()));
            await setup.getByLabel('City', { exact: true }).selectOption({ label: 'New York' });
            await settle(300);
            await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-1-choice');
            let before = seen.length;
            await save.click();
            check(`${S} the page says what was saved`, await saved(T.setUp, new RegExp(`^Saved\\. @${T.setUp} is now: city admin and regional manager for New York\\.$`)), await notice());
            const writes = seen.slice(before).filter((c) => c.method !== 'GET');
            check(`${S} one press of Save was one request to the deployed API, carrying the whole setup`,
                writes.length === 1 && writes[0].method === 'POST' && writes[0].path === `/api/admin/users/${start[T.setUp].id}/staff-access` && writes[0].status === 200
                    && writes[0].sent === JSON.stringify({ adminRole: 'ADMIN', adminCityCode: 'NYC', salesRole: 'REGIONAL_MANAGER', salesManagerId: null }), writes);
            check(`${S} the row shows both roles`, await until(async () => same(await badgesOf(T.setUp), ['Admin for New York (admin)', 'Regional manager, New York (sales)'])), await badgesOf(T.setUp));
            const setUpNow = await account(T.setUp);
            check(`${S} the backend holds it, tier included, and reports the role as in force`,
                same(staffOf(setUpNow), { accountTier: 'ADMIN', adminRole: 'ADMIN', adminCityCode: 'NYC', salesRole: 'REGIONAL_MANAGER', salesManagerId: null }) && setUpNow.liveAdminRole === 'ADMIN', setUpNow);
            const managers = (await call('GET', '/api/admin/sales/managers')).body.managers || [];
            check(`${S} they are now offered as a regional manager for New York`, managers.some((m) => m.id === start[T.setUp].id && m.cityCode === 'NYC'), managers.map((m) => `${m.username}:${m.cityCode}`));
            await shot(page.locator('main'), 'accounts-2-saved');

            // An ambassador, placed under the manager just made.
            await openAccount(T.under);
            await choice.selectOption({ label: 'Ambassador' });
            await settle(400);
            const managerPick = setup.getByLabel('Regional manager', { exact: true });
            const offered = await managerPick.locator('option').evaluateAll((els) => els.map((el) => el.value));
            check(`${S} an ambassador needs a manager, picked from the regional managers, the new one among them`, offered.includes(start[T.setUp].id) && (await save.isDisabled()), await managerPick.locator('option').allInnerTexts());
            await managerPick.selectOption({ value: start[T.setUp].id });
            await settle(300);
            await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-3-ambassador');
            await save.click();
            check(`${S} the ambassador is saved`, await saved(T.under, new RegExp(`^Saved\\. @${T.under} is now: ambassador\\.$`)), await notice());
            const underNow = await account(T.under);
            check(`${S} the backend holds it: under that manager, and not made an admin`, same(staffOf(underNow), { accountTier: start[T.under].accountTier, adminRole: 'NONE', adminCityCode: null, salesRole: 'AMBASSADOR', salesManagerId: start[T.setUp].id }) && underNow.liveAdminRole === 'NONE', underNow);

            // A setup the rules refuse: a manager with a team cannot lose the role.
            await openAccount(T.setUp);
            check(`${S} the account reads back as what it was set up as`, /Right now: Admin for New York and regional manager for New York\./.test(await text(setup)) && (await choice.inputValue()) === 'CITY_ADMIN_AND_MANAGER', await text(setup));
            await choice.selectOption({ label: 'No staff access' });
            await settle(300);
            await save.click();
            const refusal = setup.locator('[data-staff-error]');
            await until(async () => Boolean(await text(refusal)));
            check(`${S} a refused setup shows the backend's reason beside Save and stays open`, /This manager has 1 ambassador\(s\)\. Reassign them before changing/.test(await text(refusal)) && (await setup.count()) === 1, await text(refusal));
            check(`${S} and it changed nothing`, same(staffOf(await account(T.setUp)), staffOf(setUpNow)));
            await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-4-refused');
            await rowOf(T.setUp).click();
            await settle(500);

            // The state that caused the confusion: a role saved the old way, without its tier.
            await openAccount(T.waiting);
            await page.locator('details[data-staff-advanced] summary').click();
            await settle(400);
            check(`${S} Advanced holds the separate settings, as before`, (await page.getByLabel('Account tier').isVisible()) && (await page.getByLabel('Control-room role').isVisible()) && (await page.getByLabel('Admin city').isVisible()) && (await page.getByLabel('Sales role').isVisible()));
            await page.getByLabel('Control-room role').selectOption('ADMIN');
            await until(async () => (await setup.count()) === 0);
            const waitingNow = await account(T.waiting);
            check(`${S} the old way still leaves a role with no tier: stored, and not in force`, waitingNow.adminRole === 'ADMIN' && waitingNow.accountTier !== 'ADMIN' && waitingNow.liveAdminRole === 'NONE', waitingNow);
            check(`${S} the table shows it as not on, not as an admin`, await until(async () => same(await badgesOf(T.waiting), ['Admin for all cities, not on (off)'])), await badgesOf(T.waiting));
            await openAccount(T.waiting);
            check(`${S} opening it explains the state and offers the fix`, /role is saved but not switched on, so this person cannot open the control room\. Press Save to switch it on\./.test(await text(setup.locator('[data-staff-warning]'))) && (await choice.inputValue()) === 'GLOBAL_ADMIN' && (await save.isEnabled()), await text(setup));
            await shot(page.locator('tr.admin-table-expanded-row'), 'accounts-5-not-on');
            await save.click();
            await saved(T.waiting, new RegExp(`@${T.waiting} is now: admin for all cities`));
            const switchedOn = await account(T.waiting);
            check(`${S} Save switches it on: the tier follows, and the role is in force`, switchedOn.accountTier === 'ADMIN' && switchedOn.adminRole === 'ADMIN' && switchedOn.liveAdminRole === 'ADMIN' && (await until(async () => same(await badgesOf(T.waiting), ['Admin for all cities (admin)']))), switchedOn);
            await openAccount(T.waiting);
            await choice.selectOption({ label: 'No staff access' });
            await settle(300);
            await save.click();
            await saved(T.waiting, new RegExp(`@${T.waiting} has no staff access now`));
            check(`${S} taking the access away puts the account back exactly as it was, tier included`, same(staffOf(await account(T.waiting)), staffOf(start[T.waiting])), [staffOf(await account(T.waiting)), staffOf(start[T.waiting])]);

            // A super admin's own account is not something to choose.
            const own = (await call('GET', '/api/admin/whoami')).body.userId;
            const ownRow = ((await call('GET', `/api/admin/users?q=${encodeURIComponent(SIGN_INS.superAdmin.email)}&limit=50`)).body.users || []).find((u) => u.id === own);
            if (ownRow?.username) {
                await find(ownRow.username);
                check(`${S} their own row is marked super admin`, same(await badgesOf(ownRow.username), ['Super admin (admin)']), await badgesOf(ownRow.username));
                await rowOf(ownRow.username).click();
                await until(async () => (await setup.count()) === 1);
                check(`${S} a super admin's account says it is set on the server, and offers no choice`, (await setup.getAttribute('data-staff-setup')) === 'fixed' && /Super admin\. This is set by email on the server and cannot be changed here\./.test(await text(setup)) && (await choice.count()) === 0 && (await page.locator('details[data-staff-advanced]').count()) === 0, await text(setup));
                await rowOf(ownRow.username).click();
                await settle(400);
            }
        }

        if (!admin && SIGN_INS.manager && SIGN_INS.otherManager) {
            other = await signIn('another manager', SIGN_INS.otherManager);
            const O = '[another manager]';
            const me2 = await other.call('GET', '/api/sales/me');
            check(`${O} the deployed API says this sign-in is a regional manager`, me2.status === 200 && me2.body.salesRole === 'REGIONAL_MANAGER', me2);
            otherTeamBefore = ((await other.call('GET', '/api/sales/team')).body.ambassadors || []).map((a) => a.username).sort();
            if (otherTeamBefore.includes(T.under)) throw new Error(`@${T.under} is already on the other manager's team: nothing was changed`);
            await other.open('/dashboard/sales', 5000);
            const box = other.page.locator('[data-sales-team]');
            await other.until(async () => (await box.count()) === 1);
            await box.getByLabel('Ambassador username').pressSequentially(T.under, { delay: 10 });
            await box.getByRole('button', { name: /add ambassador/i }).click();
            const put = await other.until(async () => (await box.locator(`[data-sales-team-member="${T.under}"]`).count()) === 1);
            check(`${O} puts @${T.under} on their own team, through the page (${me2.body.cityCode})`, put && /is on your team now/.test(await other.text(box.locator('[data-sales-team-done]'))), await other.text(box));
        }
        const otherTeam = Boolean(admin || other);

        // ═════ a regional manager: their own team ═════════════════════════════════════════════════════════
        if (SIGN_INS.manager) {
            manager = await signIn('regional manager', SIGN_INS.manager);
            const { page, seen, call, settle, open, until, text, shot } = manager;
            const M = '[regional manager]';
            const me = await call('GET', '/api/sales/me');
            check(`${M} the deployed API says this sign-in is a regional manager`, me.status === 200 && me.body.salesRole === 'REGIONAL_MANAGER', me);
            const city = me.body.cityCode === 'NYC' ? 'New York' : me.body.cityCode === 'BOS' ? 'Boston' : me.body.cityCode;
            const self = await page.evaluate(() => { const u = JSON.parse(localStorage.getItem('pxi_user') || '{}'); return { id: u.id, username: u.username }; });
            managerUsername = self.username;
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
                const before = seen.length;
                await addButton.click();
                await until(async () => seen.slice(before).some((c) => c.method === 'POST' && c.path === '/api/sales/team') && !/adding/i.test(await addButton.innerText()));
                await settle(900);
                return seen.slice(before).filter((c) => c.method === 'POST' && c.path === '/api/sales/team');
            };
            const apiTeam = async () => ((await call('GET', '/api/sales/team')).body.ambassadors || []).map((a) => a.username).sort();

            const teamBefore = await call('GET', '/api/sales/team');
            check(`${M} the deployed API has the team route (the new backend is live)`, teamBefore.status === 200 && Array.isArray(teamBefore.body.ambassadors), teamBefore);
            const own = (teamBefore.body.ambassadors || []).map((a) => a.username).sort();
            await open('/dashboard/sales', 5000);
            check(`${M} the sidebar offers Venue Claims`, (await page.locator('a[href="/dashboard/sales"]').count()) > 0);
            check(`${M} the page shows "Your ambassadors"`, await until(async () => (await team.count()) === 1), await text(page.locator('main')));
            await until(async () => (await members().count()) === own.length);
            check(`${M} it lists exactly this manager's own ambassadors`, same((await memberNames()).sort(), own), [await memberNames(), own]);
            if (otherTeam) check(`${M} another manager's ambassador is not in it`, !own.includes(T.under) && !(await memberNames()).includes(T.under), own);
            for (const a of teamBefore.body.ambassadors || []) {
                const total = a.claims.waiting + a.claims.approved + a.claims.rejected + a.claims.revoked;
                const row = await text(team.locator(`[data-sales-team-member="${a.username}"]`));
                check(`${M} @${a.username} shows the claims they raised`, total ? /Claims: \d/.test(row) : /No claims yet/.test(row), row);
            }
            await shot(team, 'team-1-list');

            const typed = `@${T.added.toUpperCase()}`;
            const adds = await typeAndAdd(typed);
            check(`${M} adding by username is one request to the deployed API, with the username and nothing else`, adds.length === 1 && adds[0].sent === JSON.stringify({ username: T.added.toUpperCase() }) && adds[0].status === 201, adds);
            check(`${M} the page says who was added and what they can do now`, new RegExp(`is on your team now and can raise claims on ${city} venues`).test(await teamDone()), (await teamDone()) || (await teamError()));
            check(`${M} the new ambassador is in the list, found whatever case it was typed in`, same((await memberNames()).sort(), [...own, T.added].sort()), await memberNames());
            check(`${M} the backend holds it`, same(await apiTeam(), [...own, T.added].sort()), await apiTeam());
            if (admin) {
                const addedNow = await account(T.added);
                check(`${M} as the super admin sees it: ambassador under this manager, not an admin, tier untouched`, addedNow.salesRole === 'AMBASSADOR' && addedNow.salesManagerId === self.id && addedNow.adminRole === 'NONE' && addedNow.accountTier === start[T.added].accountTier, staffOf(addedNow));
            }
            await shot(team, 'team-2-added');

            await typeAndAdd(T.added);
            check(`${M} adding the same person again says so and changes nothing`, /already on your team/.test(await teamDone()) && (await members().count()) === own.length + 1, (await teamDone()) || (await teamError()));

            const refusals = [
                [otherTeam && T.under, /already has a sales role/i, "another manager's ambassador"],
                [admin && T.setUp, /staff role/i, 'an account that is a city admin and a manager'],
                [OTHERS.manager !== self.username && OTHERS.manager, /already has a sales role/i, 'another regional manager'],
                [OTHERS.cityAdmin, /staff role/i, 'a city admin'],
                [OTHERS.moderator, /staff role/i, 'a moderator'],
                [OTHERS.superAdmin, /staff role/i, 'a super admin'],
                [self.username, /cannot add yourself/i, 'the manager themselves'],
                ['nobody_by_this_name_zz9', /No account with that username/i, 'a username that is not an account'],
            ].filter(([name]) => name);
            for (const [name, message, what] of refusals) {
                const sent = await typeAndAdd(name);
                const shown = await teamError();
                check(`${M} ${what} is refused by the deployed API, and the page says why`, sent.length === 1 && sent[0].status >= 400 && message.test(shown) && (await members().count()) === own.length + 1, shown || sent);
            }
            check(`${M} none of the refusals changed the team`, same(await apiTeam(), [...own, T.added].sort()), await apiTeam());
            await shot(team, 'team-3-refused');
            if (otherTeam) {
                const taken = await call('DELETE', `/api/sales/team/${T.under}`);
                const ghost = await call('DELETE', '/api/sales/team/nobody_by_this_name_zz9');
                const stillTheirs = admin
                    ? (await account(T.under)).salesManagerId === start[T.setUp].id
                    : ((await other.call('GET', '/api/sales/team')).body.ambassadors || []).some((a) => a.username === T.under);
                check(`${M} removing another manager's ambassador is refused, with the same answer as a username that does not exist`, taken.status === 404 && taken.body.code === 'NOT_ON_YOUR_TEAM' && same(taken.body, ghost.body), [taken, ghost]);
                check(`${M} and that ambassador is still on the other manager's team`, stillTheirs);
            }

            const addedRow = team.locator(`[data-sales-team-member="${T.added}"]`);
            await addedRow.getByRole('button', { name: 'Remove', exact: true }).click();
            await settle(400);
            check(`${M} Remove asks first`, new RegExp(`Take @${T.added} off your team\\?`).test(await text(addedRow)) && !(await teamError()), await text(addedRow));
            await shot(team, 'team-4-confirm');
            let before = seen.length;
            await addedRow.getByRole('button', { name: 'Keep', exact: true }).click();
            await settle(700);
            check(`${M} Keep sends nothing and leaves the team as it was`, seen.length === before && (await members().count()) === own.length + 1);
            await addedRow.getByRole('button', { name: 'Remove', exact: true }).click();
            await settle(300);
            before = seen.length;
            await addedRow.getByRole('button', { name: /yes, remove/i }).click();
            await until(async () => (await members().count()) === own.length);
            const removes = seen.slice(before).filter((c) => c.method === 'DELETE');
            check(`${M} removing is one request to the deployed API, for that ambassador`, removes.length === 1 && removes[0].path === `/api/sales/team/${T.added}` && removes[0].status === 200, removes);
            check(`${M} the page says they are off the team and their claims stay`, new RegExp(`@${T.added} is off your team\\. The claims they raised stay`).test(await teamDone()), await teamDone());
            check(`${M} the backend holds it: the team is as it started`, same(await apiTeam(), own), await apiTeam());
            if (admin) check(`${M} as the super admin sees it: the account is exactly as it started`, same(staffOf(await account(T.added)), staffOf(start[T.added])), staffOf(await account(T.added)));

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
        } else {
            note('no regional manager sign-in: the team steps are skipped');
        }

        // ═════ an ambassador: the claim tools, and no team ════════════════════════════════════════════════
        if (SIGN_INS.ambassador) {
            const amb = await signIn('ambassador', SIGN_INS.ambassador);
            const A = '[ambassador]';
            await amb.open('/dashboard/sales', 5000);
            const main = await amb.text(amb.page.locator('main'));
            check(`${A} Venue claims opens with the claim tools`, /raise a claim/i.test(main), main);
            check(`${A} there is no "Your ambassadors" panel, and the page did not ask for a team`, (await amb.page.locator('[data-sales-team]').count()) === 0 && !amb.seen.some((c) => c.path.startsWith('/api/sales/team')));
            const list = await amb.call('GET', '/api/sales/team');
            const add = await amb.call('POST', '/api/sales/team', { username: 'nobody_by_this_name_zz9' });
            const remove = await amb.call('DELETE', '/api/sales/team/nobody_by_this_name_zz9');
            check(`${A} asking the deployed API anyway is refused: list, add and remove`, [list, add, remove].every((r) => r.status === 403 && r.body.code === 'MANAGER_REQUIRED'), [list, add, remove]);
            await amb.ctx.close();
        }

        // ═════ a city admin: sees staff access, cannot change it ═════════════════════════════════════════
        if (SIGN_INS.cityAdmin) {
            const ca = await signIn('city admin', SIGN_INS.cityAdmin);
            const C = '[city admin]';
            const whoami = await ca.call('GET', '/api/admin/whoami');
            check(`${C} the deployed API says this sign-in is an admin limited to one city`, whoami.status === 200 && whoami.body.adminRole === 'ADMIN' && Boolean(whoami.body.cityScope), whoami);
            await ca.open('/dashboard/admin/users', 5000);
            await ca.until(async () => (await ca.page.locator('tbody tr').count()) > 0);
            const sent = [...ca.seen].reverse().find((c) => c.method === 'GET' && c.path === '/api/admin/users' && c.status === 200);
            const rows = (await ca.call('GET', '/api/admin/users?page=1&limit=50')).body.users || [];
            check(`${C} the deployed API sends the role in force with each account, and no sign-in id (the new backend is live)`, Boolean(sent) && rows.length > 0 && rows.every((u) => typeof u.liveAdminRole === 'string' && !('googleId' in u) && !('appleId' in u)), rows[0] && Object.keys(rows[0]));
            // One badge for a control-room role (in force, or stored and off) and one for a sales role, per row.
            const expected = rows.map((u) => (u.liveAdminRole !== 'NONE' || u.adminRole !== 'NONE' ? 1 : 0) + (u.salesRole !== 'NONE' ? 1 : 0));
            const shown = await ca.page.locator('tbody tr:not(.admin-table-expanded-row)').evaluateAll((els) => els.map((el) => el.querySelectorAll('[data-staff-badge]').length));
            check(`${C} every row of the table carries the staff badges the API's answer calls for (${expected.reduce((a, b) => a + b, 0)} on ${rows.length} rows)`, same(shown, expected), { shown, expected });
            await ca.shot(ca.page.locator('main'), 'accounts-0-city-admin-list');
            const firstRow = ca.page.locator('tbody tr').first();
            await firstRow.click();
            const readonly = ca.page.locator('[data-staff-readonly]');
            await ca.until(async () => (await readonly.count()) === 1);
            check(`${C} an opened account shows its staff access and says who can change it`,
                new RegExp(`Staff access: .+ Only a super admin can change it, and ${SIGN_INS.cityAdmin.email.replace(/[.+]/g, '\\$&')} is not a super admin account\\.`).test(await ca.text(readonly)), await ca.text(readonly));
            check(`${C} it offers no choice and no Advanced`, (await ca.page.locator('[data-staff-setup]').count()) === 0 && (await ca.page.locator('details[data-staff-advanced]').count()) === 0);
            await ca.shot(ca.page.locator('tr.admin-table-expanded-row'), 'accounts-6-not-super-admin');
            const listed = (await ca.call('GET', '/api/admin/users?limit=5')).body.users || [];
            if (listed[0]) {
                const beforeTry = staffOf(listed[0]);
                const tried = await ca.call('POST', `/api/admin/users/${listed[0].id}/staff-access`, { adminRole: listed[0].adminRole, adminCityCode: listed[0].adminCityCode ?? null, salesRole: listed[0].salesRole, salesManagerId: listed[0].salesManagerId ?? null });
                const afterTry = ((await ca.call('GET', '/api/admin/users?limit=5')).body.users || []).find((u) => u.id === listed[0].id);
                check(`${C} asking the deployed API anyway is refused, and nothing changes`, tried.status === 403 && tried.body.code === 'FORBIDDEN_ROLE' && same(staffOf(afterTry), beforeTry), tried);
            }
            const managers = await ca.call('GET', '/api/admin/sales/managers');
            check(`${C} the list of regional managers is a super admin's too`, managers.status === 403, managers);
            await ca.ctx.close();
        }

        // ═════ an account with no staff role at all ═══════════════════════════════════════════════════════
        if (SIGN_INS.member) {
            const m = await signIn('no staff role', SIGN_INS.member);
            const N = '[no staff role]';
            const access = await m.call('GET', '/api/sales/access');
            check(`${N} the deployed API says this sign-in has no sales tools`, access.status === 200 && access.body.hasAccess === false, access);
            await m.open('/dashboard', 4500);
            check(`${N} the sidebar does not offer Venue Claims`, (await m.page.locator('a[href="/dashboard/sales"]').count()) === 0);
            await m.open('/dashboard/sales', 4500);
            check(`${N} opening Venue claims by its address leads back to the dashboard`, !/\/dashboard\/sales/.test(new URL(m.page.url()).pathname) && (await m.page.locator('[data-sales-team]').count()) === 0, m.page.url());
            const id = await m.page.evaluate(() => JSON.parse(localStorage.getItem('pxi_user') || '{}').id);
            const tries = [
                await m.call('GET', '/api/sales/team'),
                await m.call('POST', '/api/sales/team', { username: 'nobody_by_this_name_zz9' }),
                await m.call('POST', `/api/admin/users/${id}/staff-access`, { adminRole: 'ADMIN', adminCityCode: null, salesRole: 'NONE', salesManagerId: null }),
                await m.call('GET', '/api/admin/users?limit=1'),
            ];
            check(`${N} the deployed API refuses the team routes and the staff setup`, tries.every((r) => r.status === 403) && same(tries.map((r) => r.body.code), ['SALES_ROLE_REQUIRED', 'SALES_ROLE_REQUIRED', 'FORBIDDEN', 'FORBIDDEN']), tries.map((r) => `${r.status} ${r.body.code}`));
            const again = await m.call('GET', '/api/admin/whoami');
            check(`${N} and the attempt gave it nothing: it is still not an admin`, again.status === 403, again);
            await m.ctx.close();
        }
    } catch (err) {
        failures += 1;
        console.log(`FAIL  the run stopped: ${String(err && err.message ? err.message : err).split('\n')[0]}`);
    } finally {
        // ═════ put everything back, whatever happened above ══════════════════════════════════════════════
        if (other) {
            const O = '[another manager]';
            const r = await other.call('DELETE', `/api/sales/team/${T.under}`).catch((e) => ({ status: 0, body: String(e) }));
            const after = ((await other.call('GET', '/api/sales/team').catch(() => ({ body: {} }))).body.ambassadors || []).map((a) => a.username).sort();
            check(`${O} takes @${T.under} off again: their team is as it started`, (r.status === 200 || r.status === 404) && same(after, otherTeamBefore), [r, after]);
        }
        if (manager) {
            const left = ((await manager.call('GET', '/api/sales/team').catch(() => ({ body: {} }))).body.ambassadors || []).some((a) => a.username === T.added);
            if (left) {
                const r = await manager.call('DELETE', `/api/sales/team/${T.added}`).catch((e) => ({ status: 0, body: String(e) }));
                note(`@${T.added} was still on the manager's team: removed (${r.status})`);
            }
        }
        if (admin && Object.keys(start).length === Object.keys(T).length) {
            // The ambassador before their manager: a manager with a team cannot be set back.
            for (const username of [T.under, T.added, T.waiting, T.setUp]) {
                const now = await account(username).catch(() => null);
                if (now && !same(staffOf(now), staffOf(start[username]))) {
                    const r = await admin.call('POST', `/api/admin/users/${now.id}/staff-access`, OFF).catch((e) => ({ status: 0, body: String(e) }));
                    if (username !== T.setUp && username !== T.under) note(`@${username} was not as it started: set back (${r.status})`);
                }
            }
            const S = '[super admin]';
            const ends = {};
            for (const username of Object.values(T)) ends[username] = staffOf(await account(username).catch(() => null));
            check(`${S} at the end, all four accounts are exactly as they started`, Object.values(T).every((u) => same(ends[u], staffOf(start[u]))), ends);
            const log = (await admin.call('GET', '/api/admin/moderation/actions?limit=100').catch(() => ({ body: {} }))).body;
            const since = Date.now() - 45 * 60 * 1000;
            const rows = (log.actions || []).filter((a) => Object.values(start).some((s) => s.id === a.targetId) && ['ROLE_CHANGE', 'SALES_ROLE_CHANGE'].includes(a.action) && new Date(a.createdAt).getTime() > since);
            const byManager = rows.filter((a) => a.detailJson && a.detailJson.by === 'REGIONAL_MANAGER');
            const bySuper = rows.filter((a) => !(a.detailJson && a.detailJson.by === 'REGIONAL_MANAGER'));
            check(`${S} the audit log on the deployed API holds this run's changes by the super admin, in their name`, bySuper.length >= 6 && bySuper.every((a) => a.admin && a.admin.email === SIGN_INS.superAdmin.email), `${bySuper.length} rows`);
            if (manager) {
                check(`${S} and the manager's two changes, in the manager's name, marked as a manager's`, byManager.length === 2 && byManager.every((a) => a.admin && a.admin.username === managerUsername && a.targetId === start[T.added].id && a.action === 'SALES_ROLE_CHANGE'), byManager.map((a) => `${a.action} by ${a.admin && a.admin.username}`));
            }
        }
        check('no page raised a script error', pageErrors.length === 0, pageErrors);
        console.log(`\n${failures ? `${failures} FAILED` : 'ALL PASSED'}  (screenshots: ${OUT})`);
        await browser.close().catch(() => {});
        process.exit(failures ? 1 : 0);
    }
})();
