# footage/

Event photos the planner turns into textures. The files are git-ignored; only
`library.json` is committed.

Each entry in `library.json` is `{ file, src, tags, faces }`:

- `tags[0]` is the event type the photo belongs to (`brunch`, `gallery`, `rooftop`, `loft`, `night`).
  Later tags let other event types borrow it (`day`, `dusk`, `night`, `portrait`, ...).
- `faces: true` means a face reads clearly. The viewfinder and the "you" print must have one.
- Day events never use photos tagged `night` (brunch also skips `dusk`).

`avatars` are small face crops for the "who was there" row on the album page.

To add an event type, drop its photos here, add entries with that type as the first tag, and
add the type to `EventType` in `src/lib/storyboard.ts` and `LOOK` / `EXCLUDE` in `storyboard/build.ts`.
