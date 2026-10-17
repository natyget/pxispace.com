// The storyboard is the contract between the planner (storyboard/build.ts,
// which thinks) and the renderer (src/Film.tsx, which only draws). Every
// word, photo, count and timing the film shows is decided here first, so it
// can be critiqued before a single frame is rendered.

export const FPS = 30;
export const DURATION_FRAMES = 255; // 8.5s
export const WIDTH = 1080;
export const HEIGHT = 1920;

const f = (s: number) => Math.round(s * FPS);

/** The four beats Naty set. Frames are [from, to). */
export const BEATS = {
  hook: [0, f(1)], // ticket flies at the lens out of a white flash; PXI mark pixel-builds into it
  camera: [f(1), f(3)], // disposable, the night in its viewfinder, flash burst: "send the pics??"
  magic: [f(3), f(6)], // every print springs into one album, count ticks, finds you, who was there
  payoff: [f(6), DURATION_FRAMES], // album presses into a passport stamp: verified; end line
} as const;

export type BeatName = keyof typeof BEATS;

export type EventType = 'brunch' | 'gallery' | 'rooftop' | 'loft' | 'night';

/** What a variant is made from. One of these per ad. */
export type EventInput = {
  eventType: EventType;
  /** A footage set ("set:brunch"), a single file in footage/, or empty to let the planner pick by eventType. */
  footageUrl: string;
  eventName: string;
  eventDate: string;
  city: string;
  ticketPrice: string;
  organizerName: string;
  /** Past albums on PXI for this organizer: shown as earlier stamps in the passport. */
  pastAlbumCount: number;
  attendeeNames: string[];
  /** Everyone who came; defaults to attendeeNames.length. Drives "maya and 12 others were there". */
  attendeeCount?: number;
  /** Photos of this person in the album; the planner picks a believable number if missing. */
  photoCount?: number;
  /** Changes every random choice (throws, which print is "you", copy variant) without changing the facts. */
  seed?: string;
};

export type Shot = {
  id: string;
  beat: BeatName;
  time: [number, number]; // seconds
  frames: [number, number];
  object: string;
  action: string;
  /** Words physically printed on an object in the scene. Never an overlay. */
  textInScene: string[];
  physics: string;
  /** Footage file(s) used as a texture on this shot's object. */
  footageAsTexture: string[];
};

export type Storyboard = {
  version: 1;
  id: string;
  seed: string;
  event: EventInput;
  footage: {
    /** Back of the ticket and the viewfinder: the strongest face in the set. */
    viewfinder: string;
    /** One per album slot, row-major. */
    prints: string[];
    /** Index into prints of the one that "finds you". */
    youIndex: number;
    avatars: string[];
  };
  copy: {
    ticketTitle: string;
    ticketMeta: string[]; // date · city · price · host
    pain: string;
    counter: string; // template with {n}
    socialProof: string;
    printLips: string[]; // first name on each print's bottom lip, "you" on youIndex
    stamp: { top: string; middle: string; bottom: string };
    endLines: [string, string];
    url: string;
  };
  counts: { photos: number; pastStamps: number };
  look: {
    /** Key light colour. Warm white, never orange: faces must read true. */
    key: string;
    /** Low tungsten rim, the only orange in the frame. */
    rim: string;
    keyIntensity: number;
  };
  timeline: Shot[];
};

export const asset = (file: string) => `footage/${file}`;
