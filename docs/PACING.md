# Pacing: the 8.5s loop

The best 3D app ads on Instagram (Raycast, Arc, Linear, Superwhisper) share a shape: violent motion in the first frame, a beat of mess, one satisfying snap into order, a slow beautiful hold, and a CTA that cuts straight back into the start. Every PXI template uses this shape. The frame numbers live in `pxi-engine/lib/beats.ts`.

| Time | Frames (30fps) | Beat | What happens | Sound |
|---|---|---|---|---|
| 0.0–0.8s | 0–24 | **HOOK** | Violent motion at the camera, from the hook bank (`pxi-engine/hooks/`). Frame 0 is the loop flash decaying onto the hero object already in flight, a face from the night on it; it rushes the lens and stops just short. | **pop** on impact (frame ~12) |
| 0.8–2.5s | 24–75 | **PROBLEM** | Chaos of camera rolls. Prints burst, pour or rain everywhere, flashes keep firing, the handheld shake doubles and the orange date stamp is on. This is "send me the pics" made physical. | shutter on every flash |
| 2.5–5.5s | 75–165 | **MAGIC** | Spring physics snap everything into order: tension 280, friction 22, mass 1, overshoot allowed. Items are staggered centre-out over about half a second, each print develops as it lands, and a mono counter reads `photos of you 0 → photoCount` (default 37). | capture click on the first snap, a queue-tick per count, success chime as the last lands |
| 5.5–7.5s | 165–225 | **PAYOFF** | A slow dolly across the "morning after" grid. The shake drops and the light leak finds the print you're in. | room tone |
| 7.5–8.5s | 225–255 | **CTA** | The PXI mark and three words ("buy the ticket."), the scene darkens, then the disposable fires: the last 4 frames ramp to pure white on frame 254, the flash frame 0 decays from. | shutter on the loop flash |

## The spring

Remotion's `spring()` takes stiffness and damping, which map 1:1 to tension and friction:

```ts
{ stiffness: 280, damping: 22, mass: 1, overshootClamping: false }
```

The damping ratio is 22 / (2·√280) ≈ 0.66, so a print passes its slot by about 6%, comes back and settles in roughly 0.4s. That single visible overshoot is the "snap". More damping looks soft, and less looks like jelly.

## Headlines

`headlines[0]` runs over the hook, `headlines[1]` over the problem and magic beats, and `headlines[2]` over the payoff. Each enters with a 7 frame masked rise and leaves in 4 frames.

## Rules

- Motion starts on frame 0 and the first headline is up by frame 4. There is no fade up from black.
- Nothing holds still: if an object has landed, the camera is moving.
- Loop flash to flash: frame 254 is pure white and frame 0 is the same flash one step into its decay, so the seam reads as one flash.
