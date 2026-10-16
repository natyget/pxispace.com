# pxi-engine

Code-rendered 3D Instagram Reels for PXI: 1080×1920, 30fps, 8.5s, looping.
Remotion + @react-three/fiber. Event footage only appears as a texture on 3D
objects, and every template also runs with no footage at all.

Docs: [`../docs/ENGINE.md`](../docs/ENGINE.md) (architecture),
[`BRAND.md`](../docs/BRAND.md), [`DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md),
[`PACING.md`](../docs/PACING.md).

## Templates

| id | Hero | Story |
|---|---|---|
| `ticket-flip` | the ticket | flies at the lens, flips, prints burst out, snap to a 3×4 roll |
| `avalanche` | the disposable | flash in your face, 35 prints pour down, snap to a 5×7 wall |
| `morning-table` | the morning after | top-down on black felt, the pile becomes a contact sheet |

All three take the same props:

```json
{
  "footageUrl": "sanaa-groove.mp4",
  "headlines": ["the ticket,", "the camera,", "the morning after."],
  "eventDate": "sat 10.18"
}
```

`footageUrl` is a file name inside `footage/` or a full URL (video or image).
Leave it `""` to render with procedural film frames.

## Setup

```
cd pxi-engine
npm install
npm run studio        # live preview + prop editor at localhost:3000
npm run typecheck
```

## Render

Rendering is gated on approval (Phase 2). When approved:

```
npx remotion render ticket-flip out/ticket-flip.mp4 \
  --props='{"footageUrl":"sanaa-groove.mp4","headlines":["the ticket,","the camera,","the morning after."],"eventDate":"sat 10.18"}'
```

Swap `ticket-flip` for `avalanche` or `morning-table`. Settings (h264, yuv420p,
CRF 16, ANGLE GL) come from `remotion.config.ts`. On a machine without a GPU,
add `--gl=swangle`.
