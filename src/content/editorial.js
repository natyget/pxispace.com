/**
 * Lightweight editorial content source. Powers the home EditorialStrip and the
 * /editorial index + /editorial/[slug] article pages. Add stories here; each
 * `body` block is a paragraph. Photos are real event sets from /public/landing.
 */

export const EDITORIAL_STORIES = [
  {
    slug: 'afrodisiac-boston',
    title: 'AFRODISIAC: one shared camera roll, one night in Boston',
    dek: 'How a sold-out night became a scrapbook nobody had to assemble, every phone feeding one living thread.',
    cover: '/landing/editorial/afrodisiac-boston.png',
    articleCover: '/landing/album/gallery/afrodisiac/DSC02918.jpg',
    date: '2026-05-18',
    readMinutes: 4,
    tag: 'Field notes',
    body: [
      'By midnight the room was full and every phone was a camera. Nobody was tagging, nobody was chasing a group chat for photos the next day. On PXI the shots landed in one shared thread as they happened.',
      'The morning after, the whole night was already compiled: hundreds of frames from dozens of people, ranked so the best rose to the top. No one had to build the album. It built itself.',
      'That is the point of PXI. The ticket gets you in; the camera roll is what you keep. The scrapbook is the memory, and it is the thing you actually share.',
    ],
    gallery: [
      '/landing/album/gallery/afrodisiac/DSC02929.jpg',
      '/landing/album/gallery/afrodisiac/DSC02963.jpg',
      '/landing/album/gallery/afrodisiac/DSC03036.jpg',
    ],
  },
  {
    slug: 'how-scrapbooks-work',
    title: 'The scrapbook is the product',
    dek: 'Why we built PXI around the morning after, not the RSVP.',
    cover: '/landing/assets/scrapbook_cover_new.jpg',
    articleCover: '/landing/album/gallery/afrodisiac/DSC02941.jpg',
    date: '2026-04-02',
    readMinutes: 3,
    tag: 'Product',
    body: [
      'Most event apps stop caring the moment the doors close. We think that is exactly when the memory begins.',
      'Every event on PXI gets a shared album. Everyone shoots into it, nobody begs for pics, and the result is a scrapbook that becomes your event catalogue, a record of where you have been that stamps can prove.',
      'Then, in one tap, any frame becomes a framed post card ready for Instagram. Your night, ready to post.',
    ],
    gallery: [
      '/landing/album/gallery/afrodisiac/DSC02998.jpg',
      '/landing/album/gallery/afrodisiac/DSC03010.jpg',
      '/landing/album/gallery/afrodisiac/DSC03070.jpg',
    ],
  },
  {
    slug: 'passport-and-legacy',
    title: 'Proof you were there',
    dek: 'Verified attendance stamps, an Odyssey score, and a passport that is actually yours.',
    cover: '/landing/editorial/culture-proof.jpg',
    imageClass: 'scale-[1.06] -translate-y-2',
    imageStyle: {},
    articleCover: '/landing/scattered/birthday.jpg',
    date: '2026-03-11',
    readMinutes: 3,
    tag: 'Culture',
    body: [
      'Screenshots are not proof. PXI issues a cryptographic stamp when you actually show up, and those stamps accumulate into an Odyssey score that only goes up.',
      'It is a record of your social calendar that no one can fake. Bronze to Platinum, earned one real night at a time.',
      'Your passport, your scrapbooks, your catalogue of nights. That is the legacy PXI is built to keep.',
    ],
    gallery: [
      '/landing/scattered/group.jpg',
      '/landing/scattered/interaction.jpg',
      '/landing/scattered/outdoor.jpg',
    ],
  },
];

export function getEditorialStory(slug) {
  return EDITORIAL_STORIES.find((s) => s.slug === slug) ?? null;
}
