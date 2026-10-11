/**
 * The written guide to the staff screens (PART-7): its screenshots, and its PDF.
 *
 *   node scripts/qa/guideDoc.cjs shots             the screenshots, from the real pages on the deployed API
 *   node scripts/qa/guideDoc.cjs pdf <html> <pdf>  prints an HTML file to an A4 PDF
 *
 * The guide itself is an HTML file kept with its pictures in pxi-docs (part7-staff-setup/guide). This script
 * only makes the pictures and the PDF, because Playwright lives here.
 *
 * `shots` takes the same sign-ins as guideVideos.cjs and writes the same things through the same screens:
 *   SUPER_EMAIL/PASSWORD, MANAGER_EMAIL/PASSWORD, AMBASSADOR_EMAIL/PASSWORD, and optionally
 *   CITYADMIN_EMAIL/PASSWORD for the "not a super admin" picture.
 *   GUIDE_DIR   where the pictures go (default scripts/qa/.artifacts/guide-doc)
 *   SITE, API   as in guideVideos.cjs
 * It sets two accounts up and back, leaves a third with a role and no tier and then fixes it, adds one account
 * to the manager's team and removes it, and raises one claim that it then REJECTS. A rejected claim and the
 * audit rows stay behind. Run it headed (README, point 1); `pdf` runs headless, there is nothing to hide.
 *
 * On Accounts no picture is taken until the search has narrowed the table to the one account being set up,
 * so no other account's email is in a picture.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const [command, ...args] = process.argv.slice(2);
const SITE = process.env.SITE || 'http://localhost:5174';
const API = (process.env.API || 'https://dev.pxispace.com').replace(/\/$/, '');
const OUT = process.env.GUIDE_DIR || path.join(__dirname, '.artifacts', 'guide-doc');
const SIZE = { width: 1280, height: 800 };
const who = (prefix) => (process.env[`${prefix}_EMAIL`] && process.env[`${prefix}_PASSWORD`] ? { email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] } : null);
const T = { setUp: 'qa_fan6', under: 'qa_fan5', waiting: 'qa_fan4', added: 'qa_fan3', vendor: 'qa_organizer' };
const SHOWN_NOTE = 'Spoke to the owner, this is their account';
const CLAIM_NOTE = 'Guide: a test claim';
const OFF = { adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null };
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.net|clarity\.ms|tiktok\.com|googlesyndication\.com/;
const RING = '.guide-ring{outline:3px solid #a855f7 !important;outline-offset:4px !important;border-radius:12px}';
const note = (m) => console.log(`NOTE  ${m}`);

async function pdf(htmlFile, pdfFile) {
    if (!htmlFile || !pdfFile) throw new Error('usage: guideDoc.cjs pdf <html> <pdf>');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.resolve(htmlFile)).href, { waitUntil: 'load' });
    // Every picture has to be there: a guide with a broken image is worse than no guide.
    const broken = await page.evaluate(() => [...document.images].filter((img) => !img.complete || !img.naturalWidth).map((img) => img.getAttribute('src')));
    if (broken.length) throw new Error(`pictures missing from the guide: ${broken.join(', ')}`);
    const title = await page.title();
    await page.pdf({
        path: path.resolve(pdfFile),
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '17mm', left: '16mm', right: '16mm' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `<div style="width:100%;padding:0 16mm;font:8px 'Segoe UI',Arial,sans-serif;color:#8a8a96;display:flex;justify-content:space-between"><span>${title}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
    const pictures = await page.evaluate(() => document.images.length);
    await browser.close();
    console.log(`${path.basename(pdfFile)}  ${(fs.statSync(pdfFile).size / 1024 / 1024).toFixed(1)} MB  ${pictures} pictures`);
}

async function shots() {
    const SIGN_INS = { superAdmin: who('SUPER'), manager: who('MANAGER'), ambassador: who('AMBASSADOR'), cityAdmin: who('CITYADMIN') };
    if (!SIGN_INS.superAdmin || !SIGN_INS.manager || !SIGN_INS.ambassador) throw new Error('set SUPER_, MANAGER_ and AMBASSADOR_ EMAIL and PASSWORD');
    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch({ headless: false });
    const taken = [];
    let claimed = null;
    const people = {};

    /** A signed-in person: their page, drawn at twice the size so the pictures are sharp. */
    async function person(label, creds) {
        const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 2 });
        const page = await ctx.newPage();
        await page.route((u) => BLOCK.test(u.hostname), (r) => r.abort());
        await page.goto(`${SITE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(3000);
        const e = page.locator('input[type="email"]').first();
        await e.click(); await e.pressSequentially(creds.email, { delay: 8 });
        const p = page.locator('input[type="password"]').first();
        await p.click(); await p.pressSequentially(creds.password, { delay: 8 });
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 45000 }).catch(() => {});
        await page.waitForTimeout(2500);
        if (/\/login/.test(new URL(page.url()).pathname)) throw new Error(`${label}: the sign-in was refused`);
        const wait = (ms) => page.waitForTimeout(ms);
        const me = {
            ctx, page, wait,
            call: (method, pathname, data) => page.evaluate(async (a) => {
                const res = await fetch(a.api + a.pathname, {
                    method: a.method,
                    headers: { 'content-type': 'application/json', authorization: `Bearer ${localStorage.getItem('pxi_token')}` },
                    body: a.data === undefined ? undefined : JSON.stringify(a.data),
                });
                return { status: res.status, body: await res.json().catch(() => ({})) };
            }, { api: API, method, pathname, data }),
            open: async (pathAndQuery) => {
                await page.goto(`${SITE}${pathAndQuery}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
                await wait(4500);
                await page.addStyleTag({ content: RING });
            },
            until: async (fn, timeout = 20000) => {
                const end = Date.now() + timeout;
                for (;;) {
                    if (await fn().catch(() => false)) return true;
                    if (Date.now() > end) throw new Error(`${label}: waited ${timeout / 1000}s for something that did not happen`);
                    await wait(200);
                }
            },
            /** A picture of one part of the page, or of the window when no part is named, with rings round what the text points at. */
            shot: async (name, target, rings = []) => {
                // The pointer is parked first: a hover state on a button is not what the reader will see.
                await page.mouse.move(2, 2);
                if (target) await target.evaluate((el) => el.scrollIntoView({ block: 'center' }));
                else await page.locator('main').first().evaluate((el) => { el.scrollTop = 0; }).catch(() => {});
                await wait(450);
                for (const r of rings) await r.evaluate((el) => el.classList.add('guide-ring'));
                await wait(150);
                const file = path.join(OUT, `${name}.png`);
                if (target) await target.screenshot({ path: file });
                else await page.screenshot({ path: file });
                for (const r of rings) await r.evaluate((el) => el.classList.remove('guide-ring')).catch(() => {});
                taken.push(`${name}.png`);
            },
        };
        people[label] = me;
        return me;
    }

    try {
        // ═════ an ambassador raises a claim ═══════════════════════════════════════════════════════════════
        {
            const a = await person('ambassador', SIGN_INS.ambassador);
            const { page } = a;
            const venues = (await a.call('GET', '/api/sales/venues')).body.venues || [];
            const free = venues.filter((v) => !v.claimed && !v.claimPending && v.name);
            const venue = free.find((v) => v.address && v.name.length <= 32) || free.find((v) => v.name.length <= 32) || free[0];
            if (!venue) throw new Error('no venue in this territory is free to claim: nothing was changed');
            await a.open('/dashboard/sales');
            await a.until(async () => /raise a claim/i.test(await page.locator('main').innerText()));
            await a.shot('amb-1-open', null, [page.locator('a[href="/dashboard/sales"]').first()]);
            const panel = page.locator('section', { has: page.getByRole('heading', { name: /raise a claim/i }) }).first();
            await panel.locator('input[type="search"]').pressSequentially(venue.name.split(/\s+/).slice(0, 2).join(' '), { delay: 20 });
            const pick = panel.getByRole('button', { name: new RegExp(venue.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
            await a.until(async () => (await pick.count()) === 1);
            await a.wait(600);
            await pick.click();
            const vendorBox = panel.getByPlaceholder('Vendor account username (exact)');
            await a.until(async () => (await vendorBox.count()) === 1);
            await vendorBox.pressSequentially(T.vendor, { delay: 20 });
            await panel.getByPlaceholder('Note for the approver (optional)').pressSequentially(SHOWN_NOTE, { delay: 10 });
            const send = panel.getByRole('button', { name: /send for approval/i });
            await a.shot('amb-2-form', panel, [send]);
            await send.click();
            await a.until(async () => /sent for approval/i.test(await panel.innerText()));
            claimed = venue;
            const mine = page.locator('section', { has: page.getByRole('heading', { name: /claims you raised/i }) }).first();
            const raised = mine.locator('li', { hasText: venue.name }).first();
            await a.until(async () => /waiting for approval/i.test(await raised.innerText()));
            await a.shot('amb-3-waiting', raised);
        }

        // ═════ a regional manager: the team, and deciding the claim ═══════════════════════════════════════
        {
            const m = await person('manager', SIGN_INS.manager);
            const { page } = m;
            const teamBefore = ((await m.call('GET', '/api/sales/team')).body.ambassadors || []).map((x) => x.username);
            if (teamBefore.includes(T.added)) throw new Error(`@${T.added} is already on this team: nothing more was changed`);
            await m.open('/dashboard/sales');
            const team = page.locator('[data-sales-team]');
            await m.until(async () => (await team.count()) === 1 && (await team.locator('[data-sales-team-member]').count()) === teamBefore.length);
            await m.shot('mgr-1-open', null, [page.locator('a[href="/dashboard/sales"]').first()]);

            const queuePanel = page.locator('section', { has: page.getByRole('heading', { name: /waiting for your approval/i }) }).first();
            const row = queuePanel.locator('li', { hasText: claimed.name }).first();
            await m.until(async () => (await row.count()) === 1);
            await m.shot('mgr-5-decide', queuePanel, [row.getByRole('button', { name: 'Approve', exact: true }), row.getByRole('button', { name: 'Reject', exact: true })]);

            const teamPanel = page.locator('section', { has: team }).first();
            const add = team.getByRole('button', { name: /add ambassador/i });
            await team.getByLabel('Ambassador username').pressSequentially(T.added, { delay: 20 });
            await m.shot('mgr-2-add', teamPanel, [add]);
            await add.click();
            const added = team.locator(`[data-sales-team-member="${T.added}"]`);
            await m.until(async () => (await added.count()) === 1);
            await m.wait(600);
            await m.shot('mgr-3-added', teamPanel);
            await added.getByRole('button', { name: 'Remove', exact: true }).click();
            await m.wait(500);
            await m.shot('mgr-4-remove', teamPanel, [added.getByRole('button', { name: /yes, remove/i })]);
            await added.getByRole('button', { name: /yes, remove/i }).click();
            await m.until(async () => (await added.count()) === 0);

            // The claim is rejected, never approved: nobody is to end up owning a venue because of a picture.
            await row.getByPlaceholder('Note (optional)').pressSequentially('Not the venue', { delay: 10 });
            await row.getByRole('button', { name: 'Reject', exact: true }).click();
            await m.until(async () => (await row.count()) === 0);
        }

        // ═════ a super admin: Accounts ════════════════════════════════════════════════════════════════════
        {
            const s = await person('superAdmin', SIGN_INS.superAdmin);
            const { page } = s;
            const staffOf = async (username) => ((await s.call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`)).body.users || []).find((u) => u.username === username);
            const start = {};
            for (const username of [T.setUp, T.under, T.waiting]) {
                start[username] = await staffOf(username);
                const u = start[username];
                if (!u || u.adminRole !== 'NONE' || u.salesRole !== 'NONE' || u.adminCityCode || u.accountTier === 'ADMIN') throw new Error(`@${username} is missing or already has staff access: nothing more was changed`);
            }
            const rowOf = (username) => page.locator('tbody tr').filter({ has: page.getByRole('cell', { name: username, exact: true }) }).first();
            const setup = page.locator('[data-staff-setup]');
            const choice = setup.getByLabel('Set up as');
            const save = setup.getByRole('button', { name: 'Save', exact: true });
            const search = page.locator('input[type="search"]').first();
            const notice = page.locator('[data-admin-notice]');
            const find = async (username) => {
                await search.fill('');
                await search.pressSequentially(username, { delay: 20 });
                await s.until(async () => (await rowOf(username).count()) === 1 && (await page.locator('tbody tr:not(.admin-table-expanded-row)').count()) === 1);
                await s.wait(500);
            };
            const openAccount = async (username) => {
                await find(username);
                if (!(await setup.count())) await rowOf(username).click();
                await s.until(async () => (await setup.count()) === 1);
                await s.wait(1200);
            };
            const saved = (pattern) => s.until(async () => pattern.test((await notice.innerText().catch(() => '')) || '') && (await setup.count()) === 0);

            await s.open('/dashboard/admin/users');
            await s.until(async () => (await page.locator('tbody tr').count()) > 0);
            await find(T.setUp);
            await s.shot('admin-1-find', null, [page.locator('a[href="/dashboard/admin/users"]').first(), search]);

            await openAccount(T.setUp);
            await choice.selectOption({ label: 'City admin and regional manager' });
            await setup.getByLabel('City', { exact: true }).selectOption({ label: 'New York' });
            await s.wait(400);
            await s.shot('admin-2-choice', page.locator('tr.admin-table-expanded-row'), [choice, setup.getByLabel('City', { exact: true }), save]);
            await save.click();
            await saved(new RegExp(`@${T.setUp} is now: city admin and regional manager`));
            await s.until(async () => (await rowOf(T.setUp).locator('[data-staff-badge]').count()) === 2);
            await s.shot('admin-3-saved', null, [notice]);

            await openAccount(T.under);
            await choice.selectOption({ label: 'Ambassador' });
            await s.wait(400);
            await setup.getByLabel('Regional manager', { exact: true }).selectOption({ value: start[T.setUp].id });
            await s.wait(400);
            await s.shot('admin-4-ambassador', setup, [choice, setup.getByLabel('Regional manager', { exact: true }), save]);
            await save.click();
            await saved(new RegExp(`@${T.under} is now: ambassador`));

            // A setup the rules refuse: the manager has an ambassador now.
            await openAccount(T.setUp);
            await choice.selectOption({ label: 'No staff access' });
            await s.wait(300);
            await save.click();
            await s.until(async () => (await setup.locator('[data-staff-error]').count()) === 1);
            await s.shot('admin-5-refused', setup, [setup.locator('[data-staff-error]')]);
            await rowOf(T.setUp).click();
            await s.wait(500);

            // A role saved the old way, without its tier, and the warning that explains it.
            await openAccount(T.waiting);
            await page.locator('details[data-staff-advanced] summary').click();
            await s.wait(300);
            await page.getByLabel('Control-room role').selectOption('ADMIN');
            await s.until(async () => (await setup.count()) === 0);
            await s.until(async () => (await rowOf(T.waiting).locator('[data-staff-badge="off"]').count()) === 1);
            await openAccount(T.waiting);
            await s.shot('admin-6-not-on', setup, [setup.locator('[data-staff-warning]')]);
            await choice.selectOption({ label: 'No staff access' });
            await s.wait(300);
            await save.click();
            await saved(new RegExp(`@${T.waiting} has no staff access now`));
        }

        // ═════ an admin who is not a super admin ══════════════════════════════════════════════════════════
        if (SIGN_INS.cityAdmin) {
            const c = await person('cityAdmin', SIGN_INS.cityAdmin);
            await c.open('/dashboard/admin/users');
            await c.until(async () => (await c.page.locator('tbody tr').count()) > 0);
            await c.page.locator('tbody tr').first().click();
            const readonly = c.page.locator('[data-staff-readonly]');
            await c.until(async () => (await readonly.count()) === 1);
            await c.shot('admin-7-not-super-admin', readonly);
        }
    } catch (err) {
        console.log(`FAIL  ${String(err && err.message ? err.message : err).split('\n')[0]}`);
        process.exitCode = 1;
    } finally {
        // Put back whatever is not as it started.
        const m = people.manager;
        if (m) {
            const done = [];
            const team = ((await m.call('GET', '/api/sales/team').catch(() => ({ body: {} }))).body.ambassadors || []).map((x) => x.username);
            if (team.includes(T.added)) done.push(`@${T.added} taken off the team (${(await m.call('DELETE', `/api/sales/team/${T.added}`)).status})`);
            for (const c of ((await m.call('GET', '/api/sales/claims?view=queue').catch(() => ({ body: {} }))).body.claims || []).filter((x) => claimed && x.venue.id === claimed.id)) {
                done.push(`the test claim on ${c.venue.name} rejected (${(await m.call('POST', `/api/sales/claims/${c.id}/reject`, { note: CLAIM_NOTE })).status})`);
            }
            note(`manager, at the end: ${done.join('; ') || 'nothing left to undo'}; team is ${JSON.stringify(((await m.call('GET', '/api/sales/team').catch(() => ({ body: {} }))).body.ambassadors || []).map((x) => x.username))}`);
        } else if (claimed) {
            note(`a claim on ${claimed.name} was raised and no manager signed in to reject it: it is still waiting`);
        }
        const s = people.superAdmin;
        if (s) {
            const done = [];
            const after = [];
            // The ambassador before their manager: a manager with a team cannot be set back.
            for (const username of [T.under, T.waiting, T.setUp, T.added]) {
                let u = ((await s.call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`).catch(() => ({ body: {} }))).body.users || []).find((x) => x.username === username);
                if (u && (u.adminRole !== 'NONE' || u.salesRole !== 'NONE' || u.adminCityCode || u.accountTier === 'ADMIN')) {
                    done.push(`@${username} set back (${(await s.call('POST', `/api/admin/users/${u.id}/staff-access`, OFF)).status})`);
                    u = ((await s.call('GET', `/api/admin/users?q=${encodeURIComponent(username)}&limit=50`)).body.users || []).find((x) => x.username === username);
                }
                after.push(`@${username}: ${u ? `${u.accountTier}/${u.adminRole}/${u.salesRole}` : 'not found'}`);
            }
            note(`super admin, at the end: ${done.join('; ') || 'nothing left to undo'}; ${after.join(', ')}`);
        }
        console.log(`\n${taken.length} picture(s) in ${OUT}: ${taken.join(', ')}`);
        await browser.close().catch(() => {});
    }
}

(command === 'pdf' ? pdf(...args) : command === 'shots' ? shots() : Promise.reject(new Error('usage: guideDoc.cjs shots | pdf <html> <pdf>'))).catch((e) => {
    console.error(String(e && e.message ? e.message : e).split('\n')[0]);
    process.exit(1);
});
