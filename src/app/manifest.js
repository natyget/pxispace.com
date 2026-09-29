// Web app manifest. Without one, Chrome on Android had no icon declaration to
// read and fell back to the transparent tab favicon — which it composites on
// WHITE for the home screen, so the mark landed in a white tile.
//
// Two icon purposes, deliberately different files (built by
// pxispace-redesign/brand/temp-logo/_build — do not hand-edit them):
//  - "any"      → the mark on a Pitch Black disc over transparency, for surfaces that don't mask.
//  - "maskable" → the mark on opaque Pitch Black at 60% of the tile, inside the 80% safe
//                 circle, because the launcher crops this one to its own shape.
// Shipping one file as both is the usual mistake: a maskable-tagged transparent
// icon gets cropped AND whitened.
//
// `?v=grit` matches the favicon cache-buster in app/layout.jsx.

export const dynamic = 'force-static';

export default function manifest() {
  return {
    name: 'PXI | Event Operating System & Digital Scrapbook',
    short_name: 'PXI',
    description:
      'Plan the party, share the camera roll, relive the nostalgia. PXI unifies your best nights in one place.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    // Pitch Black, the brand canvas.
    theme_color: '#050505',
    icons: [
      { src: '/icon-192.png?v=grit', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png?v=grit', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-192.png?v=grit', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/maskable-512.png?v=grit', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
