// Web app manifest. Without one, Chrome on Android had no icon declaration to
// read and fell back to the transparent tab favicon — which it composites on
// WHITE for the home screen, so the badge landed in a white tile.
//
// Two icon purposes, deliberately different files (see scripts/build-icons.mjs):
//  - "any"      → the circular badge on transparency, for surfaces that don't mask.
//  - "maskable" → the badge over its own purple gradient with a safe-zone inset,
//                 because the launcher crops this one to its own shape.
// Shipping one file as both is the usual mistake: a maskable-tagged transparent
// icon gets cropped AND whitened.

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
    // Sampled from the badge gradient by scripts/build-icons.mjs.
    theme_color: '#781b93',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
