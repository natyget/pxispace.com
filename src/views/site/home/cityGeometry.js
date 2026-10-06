// The drawn map behind the "every event in your city" scene: the app's dark Apple Maps look (muted standard, no
// buildings, no points of interest), drawn here as one SVG because the page may not load map tiles or a map library.
// A made-up waterfront city, not any real one: a harbour down the right with a channel cutting in, four
// neighbourhoods whose street grids meet at different angles (the way real ones do), a few avenues, an
// expressway, parks. Colours are the ones sampled from the app's own screenshots.
//
// Pure and deterministic (a seeded generator, no Math.random), so the server and the browser draw the same lines.
//   node -e "import('./src/views/site/home/cityGeometry.js').then(m => console.log(m.CITY_MAP_SVG))" > map.svg

export const MAP_W = 820;
export const MAP_H = 1400;

const LAND = '#1d2e43';
const STREET = '#38495f';
const COLLECTOR = '#43556e';
const WATER = '#16265a';
const SHORE = '#243a8c';
const PARK = '#0d4047';
const ZONE = '#26304f';
const ROAD_CASING = '#18263a';
const ROAD_MINOR = '#3b4d66';
const ROAD_MAJOR = '#4a5d78';
const HIGHWAY = '#62779a';
const LABEL = '#8696b0';

/** A small seeded generator (LCG): the same numbers on the server and in the browser. */
function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

const r1 = (n) => Math.round(n * 10) / 10;

/**
 * Two sets of parallel street lines over a rectangle, turned by `angle` around its centre. The spacing varies a
 * little from block to block, so a neighbourhood does not look like graph paper. Returns one path per direction.
 */
function streetGrid({ x, y, w, h, angle, dx, dy, seed }) {
    const next = rng(seed);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const reach = Math.hypot(w, h) / 2 + 4;
    const point = (u, v) => `${r1(cx + u * cos - v * sin)} ${r1(cy + u * sin + v * cos)}`;
    const lines = (step, across) => {
        let minor = '';
        let major = '';
        let pos = -reach;
        let n = 0;
        while (pos < reach) {
            const d = across ? `M${point(pos, -reach)}L${point(pos, reach)}` : `M${point(-reach, pos)}L${point(reach, pos)}`;
            // Every fourth to sixth street is a collector.
            if (n > 0 && n % (4 + Math.floor(next() * 3)) === 0) major += d;
            else minor += d;
            pos += step * (0.72 + next() * 0.56);
            n += 1;
        }
        return { minor, major };
    };
    const a = lines(dx, true);
    const b = lines(dy, false);
    return { minor: a.minor + b.minor, major: a.major + b.major };
}

// The four neighbourhoods. Each clip is a polygon whose edges are not straight up and down, which is what makes
// the seams between two grids read as streets and not as tiles.
const HOODS = [
    { id: 'north', clip: 'M0 0H820V528L600 540L330 560L0 548Z', grid: { x: -60, y: -60, w: 940, h: 700, angle: -24, dx: 24, dy: 17, seed: 11 } },
    { id: 'west', clip: 'M0 548L330 560L450 700L426 840L0 820Z', grid: { x: -60, y: 500, w: 560, h: 400, angle: 17, dx: 21, dy: 16, seed: 23 } },
    { id: 'south', clip: 'M0 820L426 840L560 800L600 1400H0Z', grid: { x: -60, y: 760, w: 720, h: 720, angle: -8, dx: 31, dy: 22, seed: 37 } },
    { id: 'seaport', clip: 'M330 560L600 540L820 520V1400H600L560 800L450 700Z', grid: { x: 300, y: 500, w: 560, h: 940, angle: 11, dx: 38, dy: 27, seed: 53 } },
];

// Patches of commercial land: a faint purple-slate shade on the land, as the app's map has under its downtown.
const ZONES = [
    'M226 596L318 574L430 620L440 690L350 712L252 690Z',
    'M120 770L236 748L286 812L196 846L120 826Z',
    'M520 700L640 690L660 760L560 790Z',
    'M410 880L520 860L560 940L470 990L400 950Z',
    'M300 330L420 300L470 380L380 430Z',
];

const PARKS = [
    { x: 300, y: 842, w: 64, h: 44 },
    { x: 196, y: 596, w: 50, h: 76 },
    { x: 468, y: 962, w: 92, h: 56 },
    { x: 588, y: 704, w: 40, h: 28 },
    { x: 118, y: 872, w: 72, h: 40 },
    { x: 540, y: 428, w: 62, h: 50 },
    { x: 80, y: 360, w: 90, h: 60 },
    { x: 250, y: 1090, w: 84, h: 62 },
    { x: 470, y: 1180, w: 70, h: 90 },
];

// The harbour down the right-hand side, and the channel that cuts in from it and ends in a basin.
const HARBOUR = 'M820 0V1400H742C746 1330 728 1290 738 1230C748 1170 724 1120 740 1060C752 1010 716 930 724 880C732 830 700 800 676 770C650 738 668 700 700 668C736 632 726 580 690 548C656 518 668 470 704 440C744 406 760 360 742 310C726 262 770 210 752 150C740 110 760 60 748 0Z';
const CHANNEL = 'M704 560L612 574L522 614L452 668L424 742L420 806';
const CHANNEL_WIDTH = 26;

// Piers: short blocks of land reaching out into the harbour along the Seaport waterfront.
const PIERS = [
    { x: 716, y: 842, w: 46, h: 9 },
    { x: 722, y: 872, w: 38, h: 9 },
    { x: 724, y: 902, w: 44, h: 9 },
    { x: 716, y: 940, w: 40, h: 9 },
    { x: 718, y: 1000, w: 42, h: 9 },
    { x: 728, y: 1060, w: 36, h: 9 },
    { x: 712, y: 784, w: 34, h: 8 },
];

// Roads, as centre lines. Anything that crosses the channel is a bridge: roads are drawn after the water.
const AVENUES = [
    { d: 'M-20 1400L40 1160L220 930L318 800L405 700L470 640L560 588L720 556', w: 5.2, c: ROAD_MAJOR },
    { d: 'M0 740L200 745L420 745L560 770L700 800', w: 3.6, c: ROAD_MINOR },
    { d: 'M345 300L352 700L340 1000L356 1400', w: 3.6, c: ROAD_MINOR },
    { d: 'M130 440L330 640L470 780L600 840L700 880', w: 3.6, c: ROAD_MINOR },
    { d: 'M620 380L604 600L612 800L592 1000L606 1200L600 1400', w: 3.6, c: ROAD_MINOR },
    { d: 'M0 520L260 530L520 482L700 470', w: 3.6, c: ROAD_MINOR },
    { d: 'M0 980L180 960L400 990L560 1040', w: 3.2, c: ROAD_MINOR },
    { d: 'M0 1220L200 1190L420 1230L600 1290L720 1330', w: 3.2, c: ROAD_MINOR },
    { d: 'M150 1000L170 1200L150 1400', w: 3.2, c: ROAD_MINOR },
];
const EXPRESSWAY = 'M484 0L470 220C458 400 442 470 452 600L438 720C426 800 410 900 408 1000L412 1400';

// Names, set the way the app sets them: small capitals, letter-spaced, in a quiet blue-grey.
const HOODS_LABELS = [
    { text: 'SEAPORT', x: 612, y: 902, size: 12.5, spacing: 2.4 },
    { text: 'FORT POINT', x: 346, y: 632, size: 11.5, spacing: 2.2 },
    { text: 'SOUTH END', x: 345, y: 968, size: 12, spacing: 2.4 },
    { text: 'DOWNTOWN', x: 400, y: 380, size: 12, spacing: 2.4 },
    { text: 'NORTH WHARF', x: 640, y: 300, size: 10.5, spacing: 2 },
    { text: 'WEST SIDE', x: 130, y: 1130, size: 11.5, spacing: 2.2 },
    { text: 'DOCKS', x: 560, y: 1330, size: 11, spacing: 2.2 },
];
const STREET_LABELS = [
    { text: 'SUMMER ST', x: 335, y: 790, angle: 0, size: 8.5 },
    { text: 'ATLANTIC AVE', x: 540, y: 778, angle: 11, size: 8.5 },
    { text: 'HARBOR WAY', x: 640, y: 584, angle: -8, size: 8.5 },
    { text: 'COMMERCIAL ST', x: 150, y: 508, angle: 3, size: 8.5 },
];

function buildSvg(crop = { x: 0, y: 0, w: MAP_W, h: MAP_H }) {
    const defs = HOODS.map((h) => `<clipPath id="cm-clip-${h.id}"><path d="${h.clip}"/></clipPath>`).join('');
    const grids = HOODS.map((h) => {
        const { minor, major } = streetGrid(h.grid);
        return `<g clip-path="url(#cm-clip-${h.id})" fill="none"><path d="${minor}" stroke="${STREET}" stroke-width="1"/><path d="${major}" stroke="${COLLECTOR}" stroke-width="1.7"/></g>`;
    }).join('');
    const zones = ZONES.map((d) => `<path d="${d}" fill="${ZONE}" opacity="0.75"/>`).join('');
    const parks = PARKS.map((p) => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="5" fill="${PARK}"/>`).join('');
    const water =
        `<path d="${HARBOUR}" fill="${WATER}" stroke="${SHORE}" stroke-width="1.2"/>` +
        `<path d="${CHANNEL}" fill="none" stroke="${SHORE}" stroke-width="${CHANNEL_WIDTH + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${CHANNEL}" fill="none" stroke="${WATER}" stroke-width="${CHANNEL_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const piers = PIERS.map((p) => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${LAND}" stroke="${STREET}" stroke-width="1"/>`).join('');
    const roads = AVENUES.map(
        (a) =>
            `<path d="${a.d}" fill="none" stroke="${ROAD_CASING}" stroke-width="${a.w + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>` +
            `<path d="${a.d}" fill="none" stroke="${a.c}" stroke-width="${a.w}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ).join('');
    const expressway =
        `<path d="${EXPRESSWAY}" fill="none" stroke="${ROAD_CASING}" stroke-width="8.4" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${EXPRESSWAY}" fill="none" stroke="${HIGHWAY}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${EXPRESSWAY}" fill="none" stroke="${ROAD_CASING}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const names = HOODS_LABELS.map(
        (l) =>
            `<text x="${l.x}" y="${l.y}" font-family="Inter,system-ui,sans-serif" font-size="${l.size}" font-weight="700" letter-spacing="${l.spacing}" fill="${LABEL}" text-anchor="middle">${l.text}</text>`,
    ).join('');
    const streets = STREET_LABELS.map(
        (l) =>
            `<text transform="rotate(${l.angle} ${l.x} ${l.y})" x="${l.x}" y="${l.y}" font-family="Inter,system-ui,sans-serif" font-size="${l.size}" font-weight="600" letter-spacing="1.4" fill="${LABEL}" fill-opacity="0.8" text-anchor="middle">${l.text}</text>`,
    ).join('');

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" width="${crop.w}" height="${crop.h}" focusable="false" aria-hidden="true">` +
        `<defs>${defs}</defs>` +
        `<rect width="${MAP_W}" height="${MAP_H}" fill="${LAND}"/>` +
        grids +
        zones +
        parks +
        water +
        piers +
        roads +
        expressway +
        names +
        streets +
        `</svg>`
    );
}

/**
 * The map as one SVG string, whole or cropped to a rectangle of map units (the scene crops it to what its camera
 * will ever show, so a phone rasterises half the pixels). Static decoration: it is built from the constants above
 * and nothing a visitor sends.
 */
export function cityMapSvg(crop) {
    return buildSvg(crop);
}

export const CITY_MAP_SVG = buildSvg();
