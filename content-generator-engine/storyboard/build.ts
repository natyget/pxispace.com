// The planner: event facts in, storyboard out. It decides every word, photo,
// count and shot so the critic can judge the film before it renders.

import { BEATS, FPS, type EventInput, type EventType, type Shot, type Storyboard } from '../src/lib/storyboard.ts';

export type LibraryEntry = { file: string; tags: string[]; faces: boolean };
export type Library = { footage: LibraryEntry[]; avatars: { name: string; file: string }[] };

// Small seeded PRNG so the same event always plans the same film.
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rand = (seed: string) => hash(seed) / 4294967296;
const shuffle = <T>(xs: T[], seed: string) =>
  xs
    .map((x, i) => ({ x, k: rand(`${seed}-${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((e) => e.x);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Day events must never borrow night footage.
const EXCLUDE: Record<EventType, string[]> = {
  brunch: ['night', 'dusk'],
  gallery: [],
  rooftop: ['night'],
  loft: [],
  night: ['day'],
};

const LOOK: Record<EventType, Storyboard['look']> = {
  brunch: { key: '#FFF3E4', rim: '#FF8C42', keyIntensity: 1.15 },
  gallery: { key: '#F5F3EF', rim: '#FF8C42', keyIntensity: 1.05 },
  rooftop: { key: '#FFEBD6', rim: '#FF8C42', keyIntensity: 1.2 },
  loft: { key: '#F7F0E6', rim: '#FF8C42', keyIntensity: 1.05 },
  night: { key: '#F2ECE4', rim: '#FF8C42', keyIntensity: 1.0 },
};

const PAIN = ['send the pics??', 'who has pics??', 'pics please??'];

const SLOTS = 9;
const CENTRE = 4;

const pickFootage = (event: EventInput, library: Library, seed: string) => {
  const url = event.footageUrl.trim();
  const tag = url.startsWith('set:') ? url.slice(4) : event.eventType;
  const exclude = EXCLUDE[event.eventType];
  const pool = library.footage.filter((e) => e.tags.includes(tag) && !e.tags.some((t) => exclude.includes(t)));
  // Footage whose primary tag is this event type comes first; borrowed shots fill in.
  const own = shuffle(pool.filter((e) => e.tags[0] === tag), seed);
  const borrowed = shuffle(pool.filter((e) => e.tags[0] !== tag), seed);
  let ordered = [...own, ...borrowed];
  if (url && !url.startsWith('set:')) {
    ordered = [{ file: url, tags: [tag, 'faces'], faces: true }, ...ordered.filter((e) => e.file !== url)];
  }
  if (!ordered.length) throw new Error(`No footage tagged "${tag}" in footage/library.json`);

  const faces = ordered.filter((e) => e.faces);
  // The viewfinder is the first face anyone sees: this event's own footage beats a borrowed portrait.
  const ownFaces = faces.filter((e) => e.tags[0] === tag);
  const portrait = ownFaces.find((e) => e.tags.includes('portrait')) ?? ownFaces[0] ?? faces.find((e) => e.tags.includes('portrait')) ?? faces[0] ?? ordered[0];

  // Fill 9 slots; the centre slot is "you" and must have a face. "You" appears once.
  const you = faces.find((e) => e !== portrait) ?? portrait;
  const rest = ordered.filter((e) => e !== portrait && e !== you);
  const fill = rest.length ? rest : [portrait];
  const prints: string[] = [];
  for (let i = 0, k = 0; i < SLOTS; i++) prints.push(i === CENTRE ? you.file : fill[k++ % fill.length].file);

  return { viewfinder: portrait.file, prints, youIndex: CENTRE, tag };
};

export const buildStoryboard = (event: EventInput, library: Library): Storyboard => {
  const seed = event.seed ?? slug(event.eventName);
  const footage = pickFootage(event, library, seed);
  const names = event.attendeeNames.map((n) => n.toLowerCase());
  const first = names[0] ?? 'maya';
  const others = Math.max(1, (event.attendeeCount ?? names.length) - 1);
  const photos = event.photoCount ?? 21 + 2 * Math.floor(rand(`${seed}-photos`) * 14); // odd, 21–47
  const pain = PAIN[Math.floor(rand(`${seed}-pain`) * PAIN.length)];
  const title = event.eventName.toLowerCase();
  const date = event.eventDate.toLowerCase();
  const city = event.city.toLowerCase();

  const avatars = [first, ...names.slice(1)]
    .map((n) => library.avatars.find((a) => a.name === n)?.file)
    .filter((f): f is string => Boolean(f));
  const fallbackAvatars = library.avatars.map((a) => a.file);

  const lipNames = names.length > 1 ? names.slice(1) : ['kevin', 'trina', 'gift'];
  const printLips = footage.prints.map((_, i) => (i === footage.youIndex ? 'you' : lipNames[i % lipNames.length]));

  const copy: Storyboard['copy'] = {
    ticketTitle: title,
    ticketMeta: [date, city, event.ticketPrice.toLowerCase(), `hosted by ${event.organizerName.toLowerCase()}`],
    pain,
    counter: '{n} photos',
    socialProof: `${first} and ${others} others were there`,
    printLips,
    stamp: { top: 'verified', middle: title, bottom: `${date} · ${city}` },
    endLines: ['every event in your city.', 'every photo from the room.'],
    url: 'pxispace.com',
  };

  const sec = (fr: number) => Math.round((fr / FPS) * 100) / 100;
  const shot = (
    id: string,
    beat: keyof typeof BEATS,
    frames: [number, number],
    object: string,
    action: string,
    textInScene: string[],
    physics: string,
    footageAsTexture: string[],
  ): Shot => ({ id, beat, frames, time: [sec(frames[0]), sec(frames[1])], object, action, textInScene, physics, footageAsTexture });

  const timeline: Shot[] = [
    shot('flash-in', 'hook', [0, 9], 'pxi mark → ticket', 'Frame 0 is a white flash. The PXI mark comes out of it straight at the lens and hits the near plane by frame 9.', [], 'accelerating (ease-in cubic), pop on impact', []),
    shot('glitch-build', 'hook', [6, 24], 'ticket', 'The mark pixel-glitches block by block into a paper ticket while it recoils to reading distance.', [title, ...copy.ticketMeta], 'spring recoil (stiffness 200, damping 14)', [footage.viewfinder]),
    shot('ticket-exit', 'hook', [24, 34], 'ticket', 'The ticket tips back and drops out of frame, revealing the event photo printed on its back.', [], 'gravity + spin', [footage.viewfinder]),
    shot('camera-in', 'camera', [26, 52], 'disposable camera', 'A disposable swings in back-first; the lens pushes into its viewfinder, where the night is playing.', [], 'spring swing-in, slow push', [footage.viewfinder]),
    shot('flash-burst', 'camera', [52, 90], 'disposable camera + prints', 'Three flashes. Each one fires prints out of the camera at the lens; they scatter everywhere, every face a different camera roll. A paper card tumbles through the mess.', [pain], 'ballistic: velocity + drag + gravity + tumble', footage.prints),
    shot('snap-album', 'magic', [90, 140], 'album page + 9 prints', 'Every print springs into one album page, landing centre-out with a 6% overshoot. The page header counts up.', [copy.counter.replace('{n}', String(photos))], 'spring 280/22/1, staggered', footage.prints),
    shot('finds-you', 'magic', [130, 180], 'the centre print', 'The centre print lifts towards the lens: its lip says "you". Avatars and who was there print in at the foot of the page.', ['you', copy.socialProof], 'spring lift', [footage.prints[footage.youIndex]]),
    shot('press-stamp', 'payoff', [180, 214], 'album → rubber stamp → passport', 'The prints collapse into a rubber stamp that slams onto a passport page beside earlier stamps.', [], 'spring collapse, slam with kick', footage.prints),
    shot('verified', 'payoff', [214, 251], 'passport page', 'The stamp lifts: verified, the event and the date in ink, among earlier stamps. The end line is printed on the page.', [copy.stamp.top, copy.stamp.middle, copy.stamp.bottom, ...copy.endLines, copy.url], 'slow dolly', []),
    shot('flash-out', 'payoff', [251, 255], 'flash', 'The disposable fires: the last frame is the white frame 0 decays from.', [], 'flash ramp', []),
  ];

  return {
    version: 1,
    id: `${footage.tag}-${slug(event.eventName)}`,
    seed,
    event,
    footage: { viewfinder: footage.viewfinder, prints: footage.prints, youIndex: footage.youIndex, avatars: avatars.length ? avatars : fallbackAvatars.slice(0, 4) },
    copy,
    counts: { photos, pastStamps: Math.max(0, Math.min(8, event.pastAlbumCount)) },
    look: LOOK[event.eventType],
    timeline,
  };
};
