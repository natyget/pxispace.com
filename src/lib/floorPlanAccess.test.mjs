// PART-3: who is offered floor plans, read from one API answer. Pure, no browser and no network.
//   npm run test:floor-plans
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NO_FLOOR_PLAN_ACCESS, floorPlanAccess } from './floorPlanAccess.js';

const plan = { id: 'p1', name: 'Elsewhere' };

test('a venue account is offered everything, with or without a saved venue', () => {
    assert.deepEqual(floorPlanAccess({ floorPlans: [], canCreate: true }), { plans: [], canCreate: true, hasPlans: false, canOpen: true });
    assert.equal(floorPlanAccess({ floorPlans: [plan], canCreate: true }).canOpen, true);
});

test('an account that is not one, with nothing saved, is offered nothing', () => {
    assert.deepEqual(floorPlanAccess({ floorPlans: [], canCreate: false }), { plans: [], canCreate: false, hasPlans: false, canOpen: false });
});

test('a venue saved before the rule keeps the page open, without a way to add another', () => {
    const access = floorPlanAccess({ floorPlans: [plan], canCreate: false });
    assert.equal(access.canOpen, true);
    assert.equal(access.canCreate, false);
    assert.deepEqual(access.plans, [plan]);
});

test('an API from before the rule sends no canCreate, and is read as it behaved then', () => {
    assert.equal(floorPlanAccess({ floorPlans: [] }).canCreate, true);
    assert.equal(floorPlanAccess({ floorPlans: [] }).canOpen, true);
});

test('a missing or malformed answer offers nothing more than the API said', () => {
    assert.deepEqual(floorPlanAccess({ canCreate: false }), { plans: [], canCreate: false, hasPlans: false, canOpen: false });
    assert.deepEqual(floorPlanAccess({ floorPlans: 'nope', canCreate: false }).plans, []);
});

test('while the answer is not in, nothing is offered', () => {
    assert.equal(NO_FLOOR_PLAN_ACCESS.canOpen, false);
    assert.equal(NO_FLOOR_PLAN_ACCESS.canCreate, false);
    assert.throws(() => { NO_FLOOR_PLAN_ACCESS.canCreate = true; });
});
