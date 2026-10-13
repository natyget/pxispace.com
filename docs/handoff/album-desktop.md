# Album and event page on desktop

At 1024px and up, `/album/[id]` and `/events/[id]` are a two-column page (max 1440px, centred, under the site header).

- Left column scrolls: `src/components/events/EventDesktopDetails.jsx` (cover, name, date and time, place, host, Join / Get ticket and share, about, ticket tiers, line up, music, guest list, map, host passport, get the app). It reads the same `event` shape as the app's event view, built by `albumEventDetailsAdapter`.
- Right column is fixed to the viewport: the album (`PublicAlbumClient`, `embedded` on the event page) with its own scroll. An event with no album gets `EventTicketPanel` there (name, day, place, tiers, the action on a stub).
- Below 1024px nothing changes: the mobile album and `EventDetailsModal presentation="page"`.
- Layout CSS: `.public-album-page` / `.event-split` in `src/app/globals.css` (inside `@media (min-width: 1024px)`).
- `useMinWidth(1024)` (`src/hooks/useMinWidth.js`) picks the layout on the event page; the album page uses CSS only.
- `eventFormat.js` now holds the date, place and song helpers that used to live inside `EventDetailsModal`; the modal exports a few of its parts for the desktop column.
