# PXI Space: design system for video

Every frame the engine renders lives in one world. Code values live in `pxi-engine/lib/tokens.ts`; change them here first.

## World: PXI Space

- **An infinite black void** (`#000000`). There is no floor, no horizon and no environment map. Objects exist only where light hits them.
- **Film grain** on every frame: the PXI app's own luma grain tile (`pxi-mobile-app/assets/filters/grain_luma_512.png`), overlay blend at 22%, jumped to a new offset every frame.
- **Vignette**: an elliptical falloff to 75% black at the corners.
- Frame 0 and the last frame are both pure void, so every Reel loops without a seam.

## Lighting

| Light | Value | Role |
|---|---|---|
| Tungsten key | `#FF8C42`, top-left (`-0.55, 0.75, 0.45`), soft spot, penumbra 0.9 | The only constant light. Warm and directional, like a bar lamp. |
| Flash | `#FFFFFF`, at the lens | Pops on cue: instant attack, 3 to 4 frame decay, plus a brief white frame on screen. It is the "camera" beat made visible. |
| Fill | tungsten at 4% | Just enough so shadows aren't digital black. |

No rim lights, no colored gels and no glow orbs.

## Materials

| Object | Material | Built in |
|---|---|---|
| **Ticket** | Matte card stock (`#EDE6D6`), visible fibre, slightly bowed with a twist, perforated stub that hinges a little. Front is a two-ink print (ink `#141210` plus tungsten) with a duotone window of the footage. Back is the footage full bleed, printed on the paper. | `components/Ticket.tsx` |
| **Polaroid** | Instant print: thin top and sides (6%), deep bottom lip (24%), paper tooth, a corner that curls up, emulsion that develops from milky grey, and an orange light leak (`#FF5A1F`) burned in from one edge. The back is dark card. | `components/Polaroid.tsx` |
| **Disposable camera** | Cheap black injection-moulded plastic (roughness 0.48, light clearcoat), a cream card sleeve with a tungsten stripe, a plastic lens and a frosted flash window that fires. | `components/DisposableCamera.tsx` |

Footage only ever appears as a texture on one of these objects. It is never played full screen.

## Typography

- **Instrument Serif** (regular) for every headline and the CTA. Lowercase, `-0.02em` tracking, 0.95 line height, 132px on a 1080 wide frame.
- **ABC Diatype Mono** for the date stamp, serials and small type. Lowercase. The date stamp is tungsten with a slight glow, like the LED imprint a disposable burns into the corner of a frame.
- **Licensing:** ABC Diatype Mono is a paid Dinamo typeface and we don't have its files. The engine uses **DM Mono** as a stand-in until a licensed `.woff2` lands in `pxi-engine/public/brand/`. Swapping it is one line in `lib/fonts.ts`.

## Camera

- **35mm** focal length on a 35mm gauge.
- **Shallow depth of field** that focuses on the hero object of each beat (ticket, then the pile, then the print you're in).
- **Micro handheld shake of 0.2**: at most 0.2° of rotation on each axis plus about 2mm of drift, built from two layers of noise at about 1.3 Hz. The shake goes up to 2.4× in the chaos beat and down to 0.7× in the payoff.
- **Never static.** There is always a push, a drift or a dolly on top of the shake.

## Layout

- Master: 1080×1920, 30fps, 8.5s (255 frames).
- Type sits inside the Reels safe zone: 220px clear at the top, 420px at the bottom, 72px at the sides.

## Where this departs from earlier PXI work (the new spec wins)

The site and the earlier films (The Record, Tonight's on the Map) used a different system. This spec replaces it for video:

| Earlier | Now |
|---|---|
| Background `#050505` with a violet `#2D1B4E` fall | Pure `#000000` void, no color fall |
| One accent, purple `#D84AFF`, saved for the payoff word | No purple. Tungsten `#FF8C42` is the only accent; the light leak uses the site orange `#FF5A1F` |
| Stack Sans Notch headlines, Inter small type, Codystar on tickets | Instrument Serif headlines, ABC Diatype Mono small type |
| "One motion curve: sharp ease-out, no bouncy overshoot" | Spring physics with a visible ~6% overshoot in the MAGIC beat |
| 2D polaroid frames with ±6° tilt | Real 3D prints with curl, develop and light leaks |

What carries over: no phone frames, no tilting mockups, no glow orbs, never open on the splash, the hook in frame one, and the loop back into frame 0.
