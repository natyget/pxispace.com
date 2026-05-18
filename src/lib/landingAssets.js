/**
 * Static paths for funnel assets in /public/landing (from assets/Landing page(new asset)).
 */
export const L = '/landing';

/** App Store marketing badge (full-width asset; use APPLE_MARK + copy for hero CTAs) */
export const APP_STORE_BADGE = `${L}/icons/app-store-badge.svg`;

/** Apple logo mark for App Store buttons (funnel asset) */
export const APPLE_MARK = '/apple-logo-white.svg';

/**
 * Brand icons — order: Partiful, Posh.Vip, SWSH→BeReal, Lapse, Eventbrite, Drive, iMessage, WhatsApp→Instagram (funnel set).
 */
export const HERO_SCATTER_ICONS = [
  `${L}/icons/partiful.png`,
  `${L}/icons/posh-vip.png`,
  `${L}/icons/bereal.png`,
  `${L}/icons/lapse.png`,
  `${L}/icons/eventbrite.png`,
  `${L}/icons/google-drive.png`,
  `${L}/icons/imessage.png`,
  `${L}/icons/instagram.png`,
];

/**
 * Hero scatter icons that need a bit of inner padding (asset reads too “edge-to-edge” in the tile).
 * Match on path substring so Hero can apply padding only for these.
 */
export const HERO_SCATTER_ICON_EXTRA_PADDING = 'google-drive';

/** Polaroid / event photos (scattered hero) */
export const HERO_SCATTER_PHOTOS = [
  `${L}/scattered/birthday.jpg`,
  `${L}/scattered/crowd.jpg`,
  `${L}/scattered/group.jpg`,
  `${L}/scattered/img.jpg`,
  `${L}/scattered/interaction.jpg`,
  `${L}/scattered/outdoor.jpg`,
  `${L}/scattered/solo.jpg`,
];

/** Thread — scrapbook posts */
export const THREAD_POST_FIRST = `${L}/album/thread/1st-post.jpg`;
export const THREAD_POST_SECOND = `${L}/album/thread/2nd-post.jpg`;
export const THREAD_REACTION_GIF = `${L}/album/thread/reaction.gif`;

/** Thread — avatars (display names stay in components) */
export const AVATAR_TRINA = `${L}/album/thread/profiles/trina.jpg`;
export const AVATAR_GIFT = `${L}/album/thread/profiles/gift.jpg`;
export const AVATAR_KEVIN = `${L}/album/thread/profiles/kevin.jpg`;
export const AVATAR_BABA = `${L}/album/thread/profiles/baba.jpg`;

/** Feature story chapter tease art (compressed JPG) */
export const TEASE_BE_THERE = `${L}/tease/be-there-together.jpg`;
export const TEASE_AFTER_NIGHT = `${L}/tease/after-the-night-ends.jpg`;
export const TEASE_IDENTITY = `${L}/tease/your-event-identity.jpg`;
export const TEASE_SHOT = `${L}/tease/shot-on-pxi.jpg`;

const GALLERY_DIR = `${L}/album/gallery/afrodisiac`;

/** AFRODISIAC gallery filenames — curated set of 12 (optimized) */
export const GALLERY_FILENAMES = [
  'DSC02894.jpg',
  'DSC02905.jpg',
  'DSC02918.jpg',
  'DSC02929.jpg',
  'DSC02941.jpg',
  'DSC02954.jpg',
  'DSC02963.jpg',
  'DSC02978.jpg',
  'DSC02998.jpg',
  'DSC03010.jpg',
  'DSC03036.jpg',
  'DSC03070.jpg',
];

export const GALLERY_IMAGE_URLS = GALLERY_FILENAMES.map((f) => `${GALLERY_DIR}/${f}`);
