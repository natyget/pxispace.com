/**
 * Shared projection math for the floor-plan calibrator and heat-map viewer.
 *
 * Calibration is a 4-DOF similarity transform stored on the FloorPlan:
 * anchorLat/anchorLng map to the image center pixel, rotationDeg is clockwise
 * from true north of the image up-axis, metersPerPixel is uniform scale.
 * Equirectangular-around-anchor approximation — diverges from Web Mercator by
 * <0.1% at venue scale. METERS_PER_DEG must match the backend heatmap binning.
 */

export const METERS_PER_DEG = 111320;

/** lat/lng → floor-plan pixel coords. Returns { xPx, yPx } (may be off-image). */
export function latLngToPlanPx(lat, lng, plan) {
    const theta = (plan.rotationDeg * Math.PI) / 180;
    const cosLat = Math.cos((plan.anchorLat * Math.PI) / 180);
    const east = (lng - plan.anchorLng) * cosLat * METERS_PER_DEG;
    const north = (lat - plan.anchorLat) * METERS_PER_DEG;
    // World meters → image meters (rotation matrix is its own inverse, det -1).
    const xm = east * Math.cos(theta) - north * Math.sin(theta);
    const ym = -east * Math.sin(theta) - north * Math.cos(theta);
    return {
        xPx: plan.imageWidthPx / 2 + xm / plan.metersPerPixel,
        yPx: plan.imageHeightPx / 2 + ym / plan.metersPerPixel,
    };
}

/** Floor-plan pixel coords → lat/lng (inverse of latLngToPlanPx). */
export function planPxToLatLng(xPx, yPx, plan) {
    const theta = (plan.rotationDeg * Math.PI) / 180;
    const cosLat = Math.cos((plan.anchorLat * Math.PI) / 180);
    const xm = (xPx - plan.imageWidthPx / 2) * plan.metersPerPixel;
    const ym = (yPx - plan.imageHeightPx / 2) * plan.metersPerPixel;
    const east = xm * Math.cos(theta) - ym * Math.sin(theta);
    const north = -xm * Math.sin(theta) - ym * Math.cos(theta);
    return {
        lat: plan.anchorLat + north / METERS_PER_DEG,
        lng: plan.anchorLng + east / (cosLat * METERS_PER_DEG),
    };
}

/** Web-Mercator meters-per-screen-pixel for a Geoapify static map at zoom z. */
export function mapMetersPerPixel(lat, zoom) {
    return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

/** Geoapify static-map URL (dark style matches the dashboard). Key is already configured. */
export function staticMapUrl({ lat, lng, zoom, width = 1024, height = 640 }) {
    const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
    if (!key) return null;
    return `https://maps.geoapify.com/v1/staticmap?style=dark-matter-brown&width=${width}&height=${height}&center=lonlat:${lng},${lat}&zoom=${zoom}&apiKey=${key}`;
}

/** Screen-pixel pan delta → new map center. */
export function panMapCenter(center, dxPx, dyPx, zoom) {
    const mpp = mapMetersPerPixel(center.lat, zoom);
    const cosLat = Math.cos((center.lat * Math.PI) / 180);
    return {
        lat: center.lat + (dyPx * mpp) / METERS_PER_DEG,
        lng: center.lng - (dxPx * mpp) / (cosLat * METERS_PER_DEG),
    };
}
