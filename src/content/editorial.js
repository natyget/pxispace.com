/**
 * Lightweight editorial content source. Powers the home EditorialStrip and the
 * /editorial index + /editorial/[slug] article pages. Add stories here; each
 * `body` block is a paragraph. Photos are real event sets from /public/landing.
 */

export const EDITORIAL_STORIES = [
  {
    slug: 'sanaa-groove-boston',
    title: 'SANAA GROOVE: the in-between space Boston nightlife needed',
    dek: 'A community-first music collective building rooms where open-minded young professionals discover new sounds, new people, and new experiences.',
    cover: '/landing/editorial/afrodisiac-boston.png',
    articleCover: '/landing/sanaa-groove/sanaa-article-cover.jpg',
    date: '2026-05-18',
    readMinutes: 4,
    tag: 'Field notes',
    body: [
      'Sanaa Groove is not a party brand and it is not a promo company. It is a community-first music collective, a platform built around a simple idea: Boston needed a space that lived before the night, not just during it.',
      'That idea started as a "pregame ecosystem," a lower-pressure alternative to the city\'s rigid 10PM–2AM club model. No performance culture, no section parties, no pretense. Just speakers, a room, and people who came to dance freely, network naturally, and trade ideas before the rest of the night even started. Turn a room into something real, and the rest follows.',
      'The sound is DJ-led and experimental by design. The DJs set the tone, and the "Groovists," Sanaa\'s community, follow wherever it goes. The palette leans Afrocentric and diasporic: Afrohouse, Amapiano, Gqom, Afrobeats, Dancehall, Kompa, R&B and Soul, Hip Hop, and the wider spread of global Black electronic sound. Discovery over repetition. Sanaa is part of what is pushing newer genres into Boston in the first place.',
      'For the Groovists, it is a place to belong before you even go out. An entry point for young Black professionals, artists, and creatives in a city with few cultural markers of its own. A bridge between Black-owned spaces and the people looking for them, and a room where connections, professional, personal, creative, happen because the room is actually built for it.',
      'For DJs, Sanaa is a safe stage to experiment outside the standard club formula. Real creative direction, visibility in front of an intentional crowd, and a home base rather than a one-off booking. For emerging DJs especially, it is a launch pad.',
      'The track record backs it up: an AFCON watch party, Brooklyn Fashion Week, The Ramen Room (a late-night Boiler Room feel built from scratch), Mzuri Sanaa, a panel at Harvard, and a collaboration with Zakes Bantwini. Every activation is a prototype, by design, a test of what the next room could be.',
      'The vision reaches past Boston. Sanaa Groove wants to become a recognizable cultural force, not just at home but on the road: NYC, LA, Chicago, Atlanta, Paris, London, Cape Town, Johannesburg, Nairobi, Lagos, Accra, Rio, and beyond. If you are part of the Afrodiaspora and you find yourself in Boston wanting to dance, vibe, and meet cool people, Sanaa Groove is the answer. The goal is to grow from living rooms to cultural landmarks and festivals, and to become the cultural stamp: when people see Sanaa, they trust the room.',
      'Their nights run on PXI: tickets in their own colors, one shared camera roll instead of a dozen scattered group chats, and stamps that prove the room was real. Their branding leads, with just a subtle PXI mark for verification, so the spotlight stays on Sanaa.',
    ],
    gallery: [
      '/landing/sanaa-groove/gallery-01.jpg',
      '/landing/sanaa-groove/gallery-02.jpeg',
      '/landing/sanaa-groove/gallery-03.jpg',
      '/landing/sanaa-groove/gallery-04.jpg',
      '/landing/sanaa-groove/gallery-05.jpg',
      '/landing/sanaa-groove/gallery-06.jpg',
      '/landing/sanaa-groove/gallery-07.jpg',
      '/landing/sanaa-groove/gallery-08.jpeg',
      '/landing/sanaa-groove/gallery-09.jpeg',
      '/landing/sanaa-groove/gallery-10.jpg',
      '/landing/sanaa-groove/gallery-11.jpg',
      '/landing/sanaa-groove/gallery-12.jpg',
    ],
  },
  {
    slug: 'how-scrapbooks-work',
    title: 'The scrapbook is the product',
    dek: 'Why we built PXI around the morning after, not the RSVP.',
    cover: '/landing/scrapbook-product/sanaa-groove-poster.jpg',
    storyIndexCardAspectClass: 'aspect-[309/362]',
    articleCover: '/landing/scrapbook-product/sanaa-groove-poster.jpg',
    articleImageStyle: { objectPosition: 'center 10%' },
    articleImageAspectClass: 'aspect-[4/3.5]',
    articleMaxWidthClass: 'max-w-[700px]',
    date: '2026-04-02',
    readMinutes: 3,
    tag: 'Product',
    body: [
      'Most event apps stop caring the moment the doors close. We think that is exactly when the memory begins.',
      'Every event on PXI gets a shared album. Everyone shoots into it, nobody begs for pics, and the result is a scrapbook that becomes your event catalogue, a record of where you have been that stamps can prove.',
      'Then, in one tap, any frame becomes a framed post card ready for Instagram. Your night, ready to post.',
    ],
    gallery: [
      '/landing/scrapbook-product/scrapbook-clip-1.mp4',
      '/landing/scrapbook-product/scrapbook-clip-2.mp4',
      '/landing/scrapbook-product/scrapbook-clip-3.mp4',
    ],
  },
  {
    slug: 'passport-and-legacy',
    title: 'Proof you were there',
    dek: 'Verified attendance stamps, an Odyssey score, and a passport that is actually yours.',
    cover: '/landing/editorial/culture-proof.jpg',
    cardAspectClass: 'aspect-[309/362]',
    preserveCardFrame: true,
    cardOverlayClass: 'bg-gradient-to-t from-black/30 via-black/5 to-transparent',
    articleCover: '/landing/passport-legacy/passport-article-cover.jpg',
    date: '2026-03-11',
    readMinutes: 3,
    tag: 'Culture',
    body: [
      'Screenshots are not proof. PXI issues a cryptographic stamp when you actually show up, and those stamps accumulate into an Odyssey score that only goes up.',
      'It is a record of your social calendar that no one can fake. Bronze to Platinum, earned one real night at a time.',
      'Your passport, your scrapbooks, your catalogue of nights. That is the legacy PXI is built to keep.',
    ],
    gallery: [
      '/landing/passport-legacy/gallery-01.jpeg',
      '/landing/passport-legacy/gallery-02.jpg',
      '/landing/passport-legacy/gallery-03.jpeg',
    ],
  },
];

export function getEditorialStory(slug) {
  return EDITORIAL_STORIES.find((s) => s.slug === slug) ?? null;
}
