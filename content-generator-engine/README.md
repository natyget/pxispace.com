# content-generator-engine

Event props in, storyboard JSON and an 8.5s 1080×1920 film out. The planner
thinks, the critic checks, the renderer only draws.

```
events/brunch.json ──► storyboard/build.ts ──► storyboard.json ──► critique (plan)
                                                     │
                                                     ▼
                                    src/Film.tsx (Remotion + R3F) ──► key stills ──► critique (frames) ──► mp4
```

## Run

```bash
npm install
node storyboard/generate.ts events/brunch.json                    # plan + critique only
node storyboard/generate.ts events/*.json --stills                # + key frames, frame critique, contact sheet
node storyboard/generate.ts events/*.json --video                 # + the mp4 (only if both critiques pass)
node storyboard/generate.ts events/brunch.json --stills --frames=0,20,76
npm run studio                                                    # scrub the brunch plan
```

Output lands in `out/<event-type>-<event-name>/`: `storyboard.json`, `critique-plan.json`,
`frame-NNN.png`, `critique-frames.json`, `contact-sheet.jpg`, `<id>.mp4`.

Headless Linux without a GPU: `REMOTION_BROWSER=<chrome-headless-shell> REMOTION_GL=swangle`.
`REMOTION_CONCURRENCY` sets render threads (default 2).

## Props

```json
{
  "eventType": "brunch",
  "footageUrl": "",
  "eventName": "sunday table",
  "eventDate": "SUN MAY 4",
  "city": "boston",
  "ticketPrice": "$35",
  "organizerName": "sanaa groove",
  "pastAlbumCount": 6,
  "attendeeNames": ["maya", "kevin", "trina", "gift", "baba"],
  "attendeeCount": 13
}
```

`footageUrl` is empty (pick by `eventType`), `set:<tag>`, or one file in `footage/`. Optional:
`photoCount` (the album count; defaults to an odd number in 21–47) and `seed` (reshuffles throws,
copy variant and photo order without changing the facts). A hundred variants is a hundred
event files, or one event with a hundred seeds.

## The film

| beat | frames | what a stranger sees, muted |
|---|---|---|
| hook | 0–30 | white flash; the PXI mark flies at the lens and glitch-builds into a paper ticket: event, date, city, price |
| pain | 30–90 | a disposable camera, a guest's face in its viewfinder; three flashes fire prints everywhere; a torn card: "send the pics??" |
| magic | 90–180 | every print springs into one album; "37 photos" counts up; the centre print lifts: "you"; "maya and 12 others were there" |
| payoff | 180–255 | the album becomes a rubber stamp, slams "verified" onto a passport full of earlier stamps; "every event in your city. every photo from the room." pxispace.com |

Every word is printed on an object in the scene (ticket, card, print lip, album page, stamp ink,
passport). Footage is only ever a texture: ticket back, viewfinder, prints. Lighting is a
warm-white key so faces read true, a low tungsten rim from behind, no tone mapping, grain, pitch
black.

## The critic

Before render (`storyboard/critique.ts`, `critiqueBoard`): impact at the lens by frame 9, three
words max per beat, banned words, repeated lines, footage matches the event type (no night
footage in a day event), the "you" print and the viewfinder have faces, every piece of text
projects big enough on a phone, and the stranger test (pain, magic, payoff, track record).

After render (`critiqueFrames`): frame 0 is white, no orange cast on lit frames, photos lit.

When a check fails, change the storyboard (or the layout constants it is checked against), not
the render settings.

## Files

- `storyboard/build.ts` planner · `storyboard/critique.ts` critic · `storyboard/generate.ts` pipeline
- `src/lib/storyboard.ts` the storyboard type and beats · `src/lib/layout.ts` sizes the renderer and critic share
- `src/Film.tsx` the timeline · `src/scene/` Stage, Paper material, objects, Camera, Stamp, textures
- `footage/library.json` tagged photos (see `footage/README.md`) · `events/` the first three test events
