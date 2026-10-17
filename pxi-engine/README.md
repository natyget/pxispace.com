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
| `pxi-ticket-flip` | the ticket | flies at the lens, flips, prints burst out, snap to a 3×4 roll |
| `pxi-avalanche` | the disposable | flash in your face, 35 prints pour down, snap to a 5×7 wall |
| `pxi-morning-table` | the morning after | top-down on black felt, the pile becomes a contact sheet |

All three take the same props:

```json
{
  "footageUrl": "sanaa-test.mp4",
  "headlines": ["the ticket,", "the camera,", "the morning after."],
  "eventDate": "APR 12",
  "photoCount": 37,
  "hook": "ticket-at-lens"
}
```

`footageUrl` is a file name inside `footage/` or a full URL (video or image).
Leave it `""` to render with procedural film frames. With a video, each print
shows a different moment of the clip (`FootageSlice`), so one clip fills the wall.
`photoCount` (default 37) and `hook` (default `ticket-at-lens`) are optional.
The flash-to-flash loop and the hook bank are wired into `pxi-ticket-flip`;
`pxi-avalanche` and `pxi-morning-table` still use their built-in openers.

## Setup

```
cd pxi-engine
npm install
npm run studio        # live preview + prop editor at localhost:3000
npm run typecheck
```

## Render

```
npx remotion render index.ts pxi-ticket-flip out/ticket-flip.mp4 \
  --props='{"footageUrl":"sanaa-test.mp4","headlines":["the ticket,","the camera,","the morning after."],"eventDate":"APR 12","photoCount":37}'
```

Swap the id for `pxi-avalanche` or `pxi-morning-table`. Settings (h264,
yuv420p, CRF 16, ANGLE GL) come from `remotion.config.ts`.

On a Linux box or cloud container with no GPU, point Remotion at a local
headless Chrome and use software GL (about 3s a frame on 4 CPUs, so ~13 min a Reel):

```
--browser-executable=/path/to/chrome-headless-shell --gl=swangle --concurrency=3
```
