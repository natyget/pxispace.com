// The typographic gig poster: what a listing looks like when its source gave no flyer. A flat ink colour from the
// genre, the title huge in the display face, the venue and the night small. Used by the /go page and by the
// link-preview card (/og/go), which must agree, so the colours live here once.
//   npm run test:go

// The page is near black, so a poster reads as an object only in a mid-tone ink. Each pair is an ink and the
// colour its lettering is printed in; the test file checks that every pair stays readable (4.5 to 1).
const CREAM = '#F6EFE4';
const NIGHT = '#17130F';

export const GENRE_INKS = {
    house: { ink: '#C63817', on: CREAM },
    techno: { ink: '#1B1B1D', on: CREAM },
    'hip-hop': { ink: '#F2C230', on: NIGHT },
    'r-and-b': { ink: '#6E1F3A', on: CREAM },
    afrobeats: { ink: '#1C7A4A', on: CREAM },
    amapiano: { ink: '#E8960F', on: NIGHT },
    latin: { ink: '#C21E56', on: CREAM },
    reggaeton: { ink: '#E8338B', on: NIGHT },
    // The one purple. Cream on it reads 4.4985 to 1, a hair short, so this poster is lettered in white.
    edm: { ink: '#A523EF', on: '#FFFFFF' },
    pop: { ink: '#F4A6C8', on: NIGHT },
    indie: { ink: '#1A6F75', on: CREAM },
    rock: { ink: '#7A1B1B', on: CREAM },
    jazz: { ink: '#17325E', on: CREAM },
    drag: { ink: '#B8D62C', on: NIGHT },
    comedy: { ink: '#4AA3DF', on: NIGHT },
};

// A listing with no genre (most DICE and Posh nights) still gets a colour of its own, the same one every time.
export const FALLBACK_INKS = [
    { ink: '#C63817', on: CREAM },
    { ink: '#17325E', on: CREAM },
    { ink: '#1C7A4A', on: CREAM },
    { ink: '#6E1F3A', on: CREAM },
    { ink: '#E8960F', on: NIGHT },
    { ink: '#E8E1D2', on: NIGHT },
];

/** FNV-1a: small, stable, and good enough to spread ids over six colours. */
function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** { ink, on } for a listing: its genre's colour, else one picked from its id. */
export function posterColors(listing) {
    const genre = String(listing?.genre || '').trim().toLowerCase();
    if (GENRE_INKS[genre]) return GENRE_INKS[genre];
    const seed = String(listing?.id || listing?.title || '');
    return FALLBACK_INKS[hash(seed) % FALLBACK_INKS.length];
}

/**
 * The title's size on the 1200 x 630 link-preview card, in pixels. The renderer there cannot measure text, so the
 * size steps down with the length and the title stays within about three lines.
 */
export function cardTitleSize(title) {
    const length = String(title || '').trim().length;
    if (length <= 10) return 168;
    if (length <= 18) return 128;
    if (length <= 30) return 100;
    if (length <= 48) return 78;
    return 62;
}
