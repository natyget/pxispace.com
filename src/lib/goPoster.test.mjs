// The typographic poster's colours: every genre has one, a listing without a genre keeps its own, and the lettering
// stays readable on every ink. Pure, no browser and no network.
//   npm run test:go
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FALLBACK_INKS, GENRE_INKS, cardTitleSize, posterColors } from './goPoster.js';

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

// The contract's genre values (BRIEF-W2-CONTRACT.md), minus "other", which has no colour of its own.
const GENRES = ['house', 'techno', 'hip-hop', 'r-and-b', 'afrobeats', 'amapiano', 'latin', 'reggaeton', 'edm', 'pop', 'indie', 'rock', 'jazz', 'drag', 'comedy'];

test('every genre in the contract has an ink', () => {
    for (const genre of GENRES) {
        const colors = posterColors({ id: 'x', genre });
        assert.deepEqual(colors, GENRE_INKS[genre], genre);
        assert.match(colors.ink, /^#[0-9A-F]{6}$/i);
        assert.match(colors.on, /^#[0-9A-F]{6}$/i);
    }
    assert.deepEqual(Object.keys(GENRE_INKS).sort(), [...GENRES].sort());
});

test('the genre is read the way the API writes it', () => {
    assert.deepEqual(posterColors({ genre: 'House' }), GENRE_INKS.house);
    assert.deepEqual(posterColors({ genre: ' techno ' }), GENRE_INKS.techno);
});

test('the lettering is readable on every ink (4.5 to 1)', () => {
    for (const [name, { ink, on }] of [...Object.entries(GENRE_INKS), ...FALLBACK_INKS.map((c, i) => [`fallback ${i}`, c])]) {
        const ratio = contrast(ink, on);
        assert.ok(ratio >= 4.5, `${name}: ${ink} with ${on} is ${ratio.toFixed(2)}`);
    }
});

test('a listing with no genre keeps the same colour every time, and not every listing has the same one', () => {
    const a = { id: '3f2b6c1e-6f0a-4a4e-9d7e-2b0f6a9c1d11', genre: null };
    assert.deepEqual(posterColors(a), posterColors({ ...a }));
    assert.deepEqual(posterColors({ ...a, genre: 'other' }), posterColors(a));
    assert.ok(FALLBACK_INKS.some((c) => c === posterColors(a)));
    const seen = new Set();
    for (let i = 0; i < 60; i += 1) seen.add(posterColors({ id: `listing-${i}` }).ink);
    assert.ok(seen.size >= 4, `only ${seen.size} colours over 60 listings`);
});

test('a listing with nothing to go on still gets a colour', () => {
    assert.ok(FALLBACK_INKS.some((c) => c === posterColors({})));
    assert.ok(FALLBACK_INKS.some((c) => c === posterColors(null)));
});

test('the card title steps down as it gets longer', () => {
    const sizes = ['Rave', 'Late Checkout', 'After Dark: Nacho Isa', 'After Dark: Nacho Isa, Santelises and more', 'x'.repeat(70)].map(cardTitleSize);
    assert.deepEqual(sizes, [168, 128, 100, 78, 62]);
    assert.equal(cardTitleSize(''), 168);
    assert.equal(cardTitleSize(null), 168);
});
