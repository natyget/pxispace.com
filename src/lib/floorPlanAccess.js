// PART-3: floor plans ("Venues" in the dashboard) are for venue accounts, the ones PXI has given a venue.
// The API decides and says so as `canCreate` on GET /api/floor-plans; this file is how every screen reads
// that one answer, so they cannot disagree about who is offered what.
//
// A venue made before the rule keeps working for its owner, so there are three cases, not two:
//   - a venue account: everything, as before;
//   - not a venue account, but with venues already saved: those keep working; no new one is offered;
//   - not a venue account, nothing saved: the feature is not offered at all.

/**
 * @param {{ floorPlans?: object[], canCreate?: boolean } | null | undefined} res the GET /api/floor-plans body
 */
export function floorPlanAccess(res) {
    const plans = Array.isArray(res?.floorPlans) ? res.floorPlans : [];
    // An API from before PART-3 sends no `canCreate`. That API lets anyone create, so read it as yes: the
    // dashboard must not hide a working feature because it was deployed ahead of the backend.
    const canCreate = res?.canCreate !== false;
    return { plans, canCreate, hasPlans: plans.length > 0, canOpen: canCreate || plans.length > 0 };
}

/** What a screen shows while the answer is not in yet, or could not be fetched: nothing is offered. */
export const NO_FLOOR_PLAN_ACCESS = Object.freeze({ plans: [], canCreate: false, hasPlans: false, canOpen: false });
