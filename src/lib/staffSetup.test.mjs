// Staff setup on Admin, Accounts: one choice, turned into the four staff fields. Pure, no browser, no network.
//   npm run test:staff-setup
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    CUSTOM_SETUP,
    STAFF_SETUPS,
    claimSummary,
    cleanUsername,
    describeStaff,
    liveAdminRoleOf,
    roleIsWaiting,
    savedNotice,
    setupChanges,
    setupOf,
    setupProblem,
    staffBadges,
    staffBody,
} from './staffSetup.js';

const plain = { id: 'u', username: 'alex', accountTier: 'CITIZEN', adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null, liveAdminRole: 'NONE' };
const managers = [{ id: 'm1', name: 'McKenna', username: 'mck', cityCode: 'BOS' }];
const FIELDS = ['adminRole', 'adminCityCode', 'salesRole', 'salesManagerId'];

test('every choice names all four fields, so a choice replaces what the account had', () => {
    for (const s of STAFF_SETUPS) {
        const body = staffBody({ key: s.key, cityCode: 'NYC', managerId: 'm1' });
        assert.deepEqual(Object.keys(body).sort(), [...FIELDS].sort(), s.key);
    }
    assert.equal(staffBody({ key: 'CUSTOM' }), null);
    assert.equal(staffBody(null), null);
});

test('the two people Natan named: a city admin who is also the regional manager', () => {
    assert.deepEqual(staffBody({ key: 'CITY_ADMIN_AND_MANAGER', cityCode: 'NYC' }), {
        adminRole: 'ADMIN', adminCityCode: 'NYC', salesRole: 'REGIONAL_MANAGER', salesManagerId: null,
    });
});

test('a choice never carries a field it does not use', () => {
    // An ambassador's territory is the manager's city: no city of their own.
    assert.deepEqual(staffBody({ key: 'AMBASSADOR', cityCode: 'NYC', managerId: 'm1' }), {
        adminRole: 'NONE', adminCityCode: null, salesRole: 'AMBASSADOR', salesManagerId: 'm1',
    });
    // Support and moderation stay central: no city, even if one was picked for an earlier choice.
    assert.equal(staffBody({ key: 'MODERATOR', cityCode: 'NYC' }).adminCityCode, null);
    assert.equal(staffBody({ key: 'SUPPORT', cityCode: 'BOS' }).adminCityCode, null);
    assert.equal(staffBody({ key: 'GLOBAL_ADMIN', cityCode: 'BOS', managerId: 'm1' }).adminCityCode, null);
    assert.equal(staffBody({ key: 'CITY_ADMIN', cityCode: 'BOS', managerId: 'm1' }).salesManagerId, null);
    assert.deepEqual(staffBody({ key: 'NONE', cityCode: 'BOS', managerId: 'm1' }), { adminRole: 'NONE', adminCityCode: null, salesRole: 'NONE', salesManagerId: null });
});

test('an account reads back as the choice that made it', () => {
    for (const s of STAFF_SETUPS) {
        const setup = { key: s.key, cityCode: s.needs === 'city' ? 'BOS' : null, managerId: s.needs === 'manager' ? 'm1' : null };
        assert.deepEqual(setupOf({ ...plain, ...staffBody(setup) }), setup, s.key);
    }
});

test('a mix that is none of the choices is called a mix, not the nearest choice', () => {
    assert.equal(setupOf({ ...plain, adminRole: 'MODERATOR', salesRole: 'AMBASSADOR', salesManagerId: 'm1' }).key, CUSTOM_SETUP.key);
    assert.equal(setupOf({ ...plain, adminRole: 'ADMIN', salesRole: 'AMBASSADOR', salesManagerId: 'm1' }).key, CUSTOM_SETUP.key);
    // A city left behind with no role.
    assert.equal(setupOf({ ...plain, adminCityCode: 'NYC' }).key, CUSTOM_SETUP.key);
    assert.equal(setupOf({}).key, 'NONE');
    assert.equal(setupOf(null).key, 'NONE');
});

test('a choice cannot be saved until what it needs is picked', () => {
    assert.equal(setupProblem({ key: 'CITY_ADMIN_AND_MANAGER' }), 'Choose a city.');
    assert.equal(setupProblem({ key: 'REGIONAL_MANAGER', cityCode: '' }), 'Choose a city.');
    assert.equal(setupProblem({ key: 'AMBASSADOR', cityCode: 'NYC' }), 'Choose their regional manager.');
    assert.equal(setupProblem({ key: 'AMBASSADOR', managerId: 'm1' }), null);
    assert.equal(setupProblem({ key: 'CITY_ADMIN', cityCode: 'NYC' }), null);
    assert.equal(setupProblem({ key: 'NONE' }), null);
    assert.equal(setupProblem({ key: 'CUSTOM' }), 'Choose what this person is.');
});

test('Save is offered only when it would change the account', () => {
    assert.equal(setupChanges(plain, { key: 'NONE' }), false);
    assert.equal(setupChanges(plain, { key: 'CITY_ADMIN', cityCode: 'NYC' }), true);
    const cityAdmin = { ...plain, accountTier: 'ADMIN', adminRole: 'ADMIN', adminCityCode: 'NYC', liveAdminRole: 'ADMIN' };
    assert.equal(setupChanges(cityAdmin, { key: 'CITY_ADMIN', cityCode: 'NYC' }), false);
    assert.equal(setupChanges(cityAdmin, { key: 'CITY_ADMIN', cityCode: 'BOS' }), true);
    assert.equal(setupChanges(cityAdmin, { key: 'CUSTOM' }), false);
});

test('a role that is saved but not switched on is said so, and saving the same choice switches it on', () => {
    // The old controls: role set to admin, tier left at CITIZEN. Nothing works, and nothing said why.
    const waiting = { ...plain, adminRole: 'ADMIN', adminCityCode: 'NYC', liveAdminRole: 'NONE' };
    assert.equal(roleIsWaiting(waiting), true);
    const said = describeStaff(waiting, managers);
    assert.equal(said.text, 'No staff access.');
    assert.match(said.warning, /admin for New York role is saved but not switched on/);
    assert.equal(setupOf(waiting).key, 'CITY_ADMIN');
    assert.equal(setupChanges(waiting, setupOf(waiting)), true);
    assert.deepEqual(staffBadges(waiting), [{ label: 'Admin for New York, not on', tone: 'off' }]);
});

test('with a backend that does not send the live role, it is worked out from the tier', () => {
    const { liveAdminRole: _gone, ...older } = plain;
    assert.equal(liveAdminRoleOf({ ...older, adminRole: 'ADMIN' }), 'NONE');
    assert.equal(liveAdminRoleOf({ ...older, adminRole: 'ADMIN', accountTier: 'ADMIN' }), 'ADMIN');
    assert.equal(liveAdminRoleOf({ ...older, adminRole: 'ADMIN', accountTier: 'ADMIN', suspendedAt: '2026-10-01' }), 'NONE');
    assert.equal(roleIsWaiting({ ...older, adminRole: 'SUPPORT' }), true);
    assert.equal(roleIsWaiting({ ...older, adminRole: 'SUPPORT', accountTier: 'ADMIN' }), false);
});

test('what an account can do right now, in words', () => {
    const on = { accountTier: 'ADMIN', liveAdminRole: 'ADMIN' };
    assert.equal(describeStaff(plain).text, 'No staff access.');
    assert.equal(describeStaff({ ...plain, ...on, adminRole: 'ADMIN', adminCityCode: 'NYC', salesRole: 'REGIONAL_MANAGER' }).text, 'Admin for New York and regional manager for New York.');
    assert.equal(describeStaff({ ...plain, ...on, adminRole: 'ADMIN' }).text, 'Admin for all cities.');
    assert.equal(describeStaff({ ...plain, accountTier: 'ADMIN', adminRole: 'MODERATOR', liveAdminRole: 'MODERATOR' }).text, 'Moderator.');
    assert.equal(describeStaff({ ...plain, adminCityCode: 'BOS', salesRole: 'REGIONAL_MANAGER' }).text, 'Regional manager for Boston.');
    assert.equal(describeStaff({ ...plain, salesRole: 'AMBASSADOR', salesManagerId: 'm1' }, managers).text, 'Ambassador under McKenna.');
    assert.equal(describeStaff({ ...plain, salesRole: 'AMBASSADOR', salesManagerId: 'gone' }, managers).text, 'Ambassador.');
    for (const row of [plain, { ...plain, ...on, adminRole: 'ADMIN' }]) assert.equal(describeStaff(row).warning, null);
});

test('an admin by company email is described as that, with nothing stored', () => {
    const colleague = { ...plain, email: 'someone@pxispace.com', liveAdminRole: 'ADMIN' };
    assert.equal(describeStaff(colleague).text, 'Admin for all cities, through their company email.');
    assert.equal(describeStaff(colleague).warning, null);
    assert.deepEqual(staffBadges(colleague), [{ label: 'Admin for all cities', tone: 'admin' }]);
    assert.equal(roleIsWaiting(colleague), false);
});

test('a super admin is not something this page changes', () => {
    const boss = { ...plain, liveAdminRole: 'SUPER_ADMIN' };
    assert.match(describeStaff(boss).text, /^Super admin\. This is set by email on the server/);
    assert.deepEqual(staffBadges(boss), [{ label: 'Super admin', tone: 'admin' }]);
});

test('a suspended staff account is said to be switched off by the suspension', () => {
    const row = { ...plain, accountTier: 'ADMIN', adminRole: 'ADMIN', liveAdminRole: 'NONE', suspendedAt: '2026-10-01T00:00:00Z' };
    assert.equal(roleIsWaiting(row), false);
    assert.match(describeStaff(row).warning, /suspended/);
    assert.equal(describeStaff({ ...plain, suspendedAt: '2026-10-01T00:00:00Z' }).warning, null);
});

test('the badges in the table say what is in force', () => {
    assert.deepEqual(staffBadges(plain), []);
    assert.deepEqual(
        staffBadges({ ...plain, accountTier: 'ADMIN', adminRole: 'ADMIN', adminCityCode: 'BOS', salesRole: 'REGIONAL_MANAGER', liveAdminRole: 'ADMIN' }),
        [{ label: 'Admin for Boston', tone: 'admin' }, { label: 'Regional manager, Boston', tone: 'sales' }],
    );
    assert.deepEqual(staffBadges({ ...plain, salesRole: 'AMBASSADOR', salesManagerId: 'm1' }), [{ label: 'Ambassador', tone: 'sales' }]);
    assert.deepEqual(staffBadges({ ...plain, accountTier: 'ADMIN', adminRole: 'SUPPORT', liveAdminRole: 'SUPPORT' }), [{ label: 'Support', tone: 'admin' }]);
});

test('the line shown after Save says who is now what', () => {
    assert.equal(savedNotice(plain, { key: 'CITY_ADMIN_AND_MANAGER', cityCode: 'NYC' }), 'Saved. @alex is now: city admin and regional manager for New York.');
    assert.equal(savedNotice(plain, { key: 'AMBASSADOR', managerId: 'm1' }), 'Saved. @alex is now: ambassador.');
    assert.equal(savedNotice(plain, { key: 'NONE' }), 'Saved. @alex has no staff access now.');
    assert.equal(savedNotice({ email: 'a@b.co' }, { key: 'SUPPORT' }), 'Saved. a@b.co is now: support.');
});

test("a manager's team: claim counts and typed usernames", () => {
    assert.equal(claimSummary({ waiting: 1, approved: 2, rejected: 0, revoked: 0 }), 'Claims: 2 approved, 1 waiting');
    assert.equal(claimSummary({ waiting: 0, approved: 0, rejected: 3, revoked: 1 }), 'Claims: 3 rejected, 1 revoked');
    assert.equal(claimSummary({}), 'No claims yet');
    assert.equal(claimSummary(undefined), 'No claims yet');
    assert.equal(cleanUsername('  @Alex '), 'Alex');
    assert.equal(cleanUsername('@@alex'), 'alex');
    assert.equal(cleanUsername(null), '');
});
