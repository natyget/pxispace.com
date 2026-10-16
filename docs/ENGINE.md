# PXI video engine: architecture

`pxi-engine/` renders 1080×1920, 30fps, 8.5s Instagram Reels entirely in code: Remotion drives the timeline, `@react-three/fiber` draws the 3D, and event footage only appears as a texture on a ticket or a print. Nothing is filmed for it, and it runs with no footage at all.

## Layout

```
pxi-engine/
  index.ts              registerRoot
  Root.tsx              one <Composition> per template, shared size/fps/length and props schema
  remotion.config.ts    h264, yuv420p, CRF 16, ANGLE GL, concurrency 2
  templates/
    ticket-flip.tsx     hero: the ticket. Flies at the lens, flips, prints burst out, snap to a 3×4 roll
    avalanche.tsx       hero: the disposable. Flash in your face, 35 prints pour down, snap to a 5×7 wall
    morning-table.tsx   hero: the morning after. Top-down on black felt, pile becomes a contact sheet
  components/
    Stage.tsx           the void: 35mm camera + handheld shake, lights, DOF, footage, grain, overlays
    Polaroid.tsx        instant print shader: curl, develop, light leak, footage window with crop
    Ticket.tsx          card-stock shader: bend, perforated stub, printed type, footage duotone + back
    DisposableCamera.tsx  plastic camera from primitives; flash window fires on cue
    FlashLight.tsx      tungsten key, lens flash, flashEnvelope(), on-screen flash frame
    FilmGrain.tsx       app grain tile, re-offset per frame, plus vignette
    Type.tsx            Headline (Instrument Serif) and DateStamp (mono, tungsten LED)
    EndCard.tsx         CTA: mark + three words, loop fade
    Sfx.tsx             foley cues from the app's own sounds
  lib/
    tokens.ts           colors, camera, spring, safe zone, CTA (mirrors DESIGN_SYSTEM.md)
    beats.ts            HOOK/PROBLEM/MAGIC/PAYOFF/CTA frame ranges, snap(), loopFade()
    motion.ts           seeded throws, grid slots, pose mixing, snap stagger
    footage.tsx         footageUrl → texture (video, image or procedural fallback)
    paperShader.ts      shared GLSL: paper noise, derivative normals, matte lighting
    fonts.ts            Instrument Serif + DM Mono (stand-in for ABC Diatype Mono)
    props.ts            zod schema for { footageUrl, headlines[3], eventDate }
  public/
    brand/              grain.png and pxi-mark.png from the app
    sfx/                pop, shutter, success, capture-chk from the app
    footage → ../footage
  footage/              drop event clips and stills here (git-ignored)
```

## How a frame is made

1. **Props** come in as `{ footageUrl, headlines: [a, b, c], eventDate }`, validated by `lib/props.ts` and editable live in Remotion Studio.
2. **Timing**: the template reads `BEATS` from `lib/beats.ts`. Each object's pose is a pure function of the frame number and a seed, so any frame renders on its own, in any order, on any worker.
3. **Chaos to order**: `makeThrows()` gives every print a seeded flight (velocity, spin, drag, gravity), `gridSlots()` gives it a slot, and `mixPose(chaos, slot, snap(frame, delay))` blends them with the 280/22/1 spring. The spring's overshoot past 1 is what makes prints pass their slot and settle.
4. **Footage**: `Stage` mounts `FootageProvider` inside the canvas. A video URL goes through `useOffthreadVideoTexture` at render time (frame-exact) and a hidden `<video>` + `useVideoTexture` in Studio. An image goes through a `TextureLoader` held by `delayRender`. An empty string gives `null`, and each object then draws its own seeded procedural "flash photo of a dark room". Each print shows a different `crop` of the same clip, so one clip can fill a wall.
5. **Light and lens**: `Stage` sets a 35mm camera, adds two-layer noise shake (0.2° × the beat's multiplier), the tungsten key and the lens flash, and runs depth of field focused on `pose.focus`.
6. **Overlays**: grain, vignette, flash frame, headlines, date stamp and end card are DOM layers above the canvas, so type stays pixel-sharp.
7. **Sound**: `Sfx` places the app's own pop, shutter and success sounds on frame cues.

## Template contract

Every template:

- is a `React.FC<TemplateProps>` registered in `Root.tsx` at 1080×1920, 30fps, 255 frames;
- tells **ticket → camera → morning after** across the five beats;
- starts and ends on the black void (or the loop seam from idea 1 below);
- works with `footageUrl: ''`.

To add a template: copy the closest one, keep the `BEATS` structure, change the hero object, the throw shape and the slot layout, then register it in `Root.tsx`.

## Status

Phase 1 is scaffolded, typechecked (`npm run typecheck`) and webpack-bundled. **No frame has been rendered yet**, by design. Expect to tune light intensities, DOF strength and the procedural frames on the first render pass.

---

## MY 3 BETTER IDEAS

### 1. Make frame 0 the flash, not the void

A black first frame is the weakest frame we could pick. It is the cover in the profile grid, the frame the feed shows before autoplay starts, and the frame that has to stop a thumb. The best-performing 3D ads put their brightest, highest-contrast frame first.

- **Change:** loop **flash to flash** instead of void to void. The last 3 frames of the CTA blow out to white, as the disposable fires. Frame 0 is that same white decaying onto the ticket already mid-flight, with a real face from the footage on its back, 30% visible through the flash.
- **Why it works:** the flash is the most "PXI" image we have (it is literally the camera beat), a face in frame 0 is the strongest stop signal on Instagram, and the loop seam hides inside a white frame, which nobody can see.
- **Cost:** about 20 lines. `loopFade()` becomes `loopFlash()`, and each template's hook starts at `fly = 0.15` instead of 0.

### 2. Put a number on the payoff: "photos of you: 0 → 37"

The pain line is a number ("200 photos of your friends, 0 of you"), so the proof should be one too. Right now the MAGIC beat shows order, which looks nice but says nothing about *you*.

- **Change:** during MAGIC, a mono counter in the date-stamp corner reads `photos of you  0` and ticks up once per print that lands in the slot holding you (each tick plays the app's own `queue-tick.wav`, which we already have). It ends on a specific, odd number (37, not 40), held through the PAYOFF while the light leak finds those prints.
- **Why it works:** a counter gives the viewer something to read during the 3 seconds where most people decide to keep watching, and it turns "the night belongs to everyone" into a concrete fact. Specific numbers read as true, and round numbers read as marketing.
- **Cost:** one `<Counter>` component and a `youSlots` list per template. `eventDate`'s sibling `photoCount` would be a fourth prop, which is your call because it changes the contract you set.

### 3. Split the hook out and render a variant matrix, not three videos

On Reels the first second decides most of the result, and Meta's ad delivery does best when it has many creative variants to choose between and the losers are cut fast. Three handmade videos a week is the wrong unit.

- **Change:** make the HOOK (frames 0–24) its own module with a bank of 4: `ticket-at-lens`, `flash-in-face`, `prints-from-above` and `date-stamp-cold-open` (black, the orange `11:47 pm` stamp flickers on, then the flash). Each template body (24–255) accepts any hook. A `variants.json` lists hooks × templates × headline sets × footage, and one command renders the whole matrix with file names like `av__flash__set2__sanaa.mp4`, so Ads Manager results map straight back to the parts that made them.
- **The loop:** each week, ship 12 cuts (4 hooks × 3 bodies, same headlines), read 3-second hold and hook rate after 48 hours, keep the top 3 and swap in new footage. The engine already makes every frame a pure function of props, so this costs no new rendering code, only a hook interface and a matrix runner.
- **Sound, as part of this:** add an 8.5s score bed authored to the beat map (the pop lands on the downbeat at frame 12, and the last bar resolves into the first) so the loop is seamless by ear too, and the needle drop from the earlier films can come back as a hook variant.
