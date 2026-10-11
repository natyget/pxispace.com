import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkBadge01Icon, InstagramIcon } from '@hugeicons/core-free-icons';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { countLabel, instagramUrl, nightWhen, scrapbookCaption, statWord } from '@/lib/organizerPage';
import { getHypeTierBadgeTheme } from '@/utils/hypeTier';
import OrganizerFollow from './OrganizerFollow';
import ShowMore from './ShowMore';

// Flat, on the site's black: the surfaces are the event view's #1C1C1C and #2E2E2E (bg-pxi-surface, bg-pxi-field), the
// one purple is #A523EF, and values are told apart by weight, size and opacity, never by a dot.
const CAPS = 'text-[11px] font-extrabold uppercase tracking-[0.12em]';
const SECTION_TITLE = 'text-[1.5rem] font-bold normal-case leading-none tracking-[-0.02em] text-white';
const FOCUS = 'outline-offset-4 focus-visible:outline-2 focus-visible:outline-white';
const CAVEAT = { fontFamily: "'Caveat', 'Bradley Hand', 'Segoe Print', cursive" };
// How many past nights show before "Show more". The API sends up to 50.
const PAST_SHOWN = 8;
// Each scrapbook print leans its own way, like prints pinned to a wall.
const TILTS = ['-rotate-[1.4deg]', 'rotate-[1.1deg]', '-rotate-[0.7deg]', 'rotate-[1.6deg]'];

/** The name steps down with its length, so a long brand name holds a few lines instead of filling the screen. */
function nameSize(name) {
  if (name.length > 48) return 'text-[1.55rem]';
  if (name.length > 24) return 'text-[1.9rem]';
  return 'text-[2.25rem]';
}

/** The hype tier as a letter in the tier's colour (the Odyssey badges' language) and its word beside it. */
function Hype({ hype }) {
  const theme = getHypeTierBadgeTheme(hype.tier);
  return (
    <p className="mt-4 flex items-center gap-2.5 text-[15px] font-semibold text-white/85">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-black"
        style={{ backgroundColor: theme.fill, color: theme.letter, border: `1px solid ${theme.stroke}` }}
      >
        {hype.letter}
      </span>
      <span>
        <span className="sr-only">Hype: </span>
        {hype.label}
      </span>
    </p>
  );
}

/** Nights, people, followers: three numbers, each with its one small word. A rounded count reads "1.2k+". */
function Stats({ organizer }) {
  const items = [
    ['nights', organizer.totals.events, false],
    ['people', organizer.totals.attendees, organizer.totals.attendeesRounded],
    ['followers', organizer.followers, organizer.followersRounded],
  ];
  return (
    <ul className="mt-9 grid w-full grid-cols-3 gap-2 text-center">
      {items.map(([kind, value, rounded]) => (
        <li key={kind} className="min-w-0">
          <p className="text-[clamp(1.5rem,7.2vw,2.1rem)] font-extrabold leading-none tracking-[-0.03em] text-white tabular-nums">
            {countLabel(value, rounded)}
          </p>
          <p className={`mt-2.5 ${CAPS} text-white/50`}>{statWord(kind, value, rounded)}</p>
        </li>
      ))}
    </ul>
  );
}

/** A coming night as a ticket: its poster, then the day, the name, the hours and the place. */
function Ticket({ night, now }) {
  const when = nightWhen(night, now);
  const cover = displayImageSrc(night.coverImage, null);
  const label = [night.name, when?.spoken, night.venue].filter(Boolean).join(', ');
  return (
    <Link
      href={`/events/${encodeURIComponent(night.id)}`}
      aria-label={label}
      className={`flex items-stretch gap-4 rounded-[24px] bg-pxi-surface p-3 pr-5 transition-colors hover:bg-pxi-field ${FOCUS}`}
    >
      <div className="relative h-28 w-[5.25rem] shrink-0 overflow-hidden rounded-[14px] bg-pxi-field">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        ) : when ? (
          <div className="grid size-full place-content-center text-center" aria-hidden="true">
            <p className={`${CAPS} text-pxi-purple`}>{when.month}</p>
            <p className="text-[2rem] font-extrabold leading-none tracking-[-0.03em] text-white tabular-nums">{when.day}</p>
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1">
        {when ? <p className={`${CAPS} text-pxi-purple`}>{when.label}</p> : null}
        <p className="line-clamp-2 break-words text-[17px] font-extrabold leading-[1.2] text-white">{night.name}</p>
        {when ? <p className="text-[13px] font-semibold text-white/70 tabular-nums">{when.hours}</p> : null}
        {night.venue ? <p className="truncate text-[13px] font-medium text-white/45">{night.venue}</p> : null}
      </div>
    </Link>
  );
}

/** A night that has happened: its date as a stub, then its name. */
function Stub({ night, now }) {
  const when = nightWhen(night, now);
  const label = [night.name, when?.spoken].filter(Boolean).join(', ');
  return (
    <Link
      href={`/events/${encodeURIComponent(night.id)}`}
      aria-label={label}
      className={`flex items-center gap-4 rounded-[18px] px-3 py-3 transition-colors hover:bg-pxi-field ${FOCUS}`}
    >
      <div className="w-12 shrink-0 text-center" aria-hidden="true">
        {when ? (
          <>
            <p className={`${CAPS} text-pxi-purple`}>{when.month}</p>
            <p className="text-[1.5rem] font-extrabold leading-none tracking-[-0.02em] text-white tabular-nums">{when.day}</p>
            {when.year ? <p className="mt-0.5 text-[10px] font-bold text-white/40 tabular-nums">{when.year}</p> : null}
          </>
        ) : null}
      </div>
      <p className="line-clamp-2 min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug text-white">{night.name}</p>
    </Link>
  );
}

/** A scrapbook as a print: the cover in a white border, the night written under it by hand. */
function Print({ scrapbook, index }) {
  const { label } = scrapbookCaption(scrapbook);
  const cover = displayImageSrc(scrapbook.coverImage, null);
  return (
    <Link href={`/album/${encodeURIComponent(scrapbook.albumId)}`} aria-label={`${label}, scrapbook`} className={`group block ${FOCUS}`}>
      <figure
        className={`rounded-[3px] bg-white px-[7px] pt-[7px] pb-1 ${TILTS[index % TILTS.length]} motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-0`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-300">
          {cover ? (
            <img src={cover} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
          ) : null}
        </div>
        {/* Two lines of handwriting, so "Afrohouse Sunday 2026" is not cut; the box keeps every print the same height. */}
        <figcaption className="flex min-h-12 items-center justify-center px-1 pt-1 pb-1 text-center text-[17px] leading-[1.05] text-[#2b2920] min-[420px]:text-[19px]" style={CAVEAT}>
          <span className="line-clamp-2 break-words">{label}</span>
        </figcaption>
      </figure>
    </Link>
  );
}

function PastNights({ nights, now }) {
  const shown = nights.slice(0, PAST_SHOWN);
  const more = nights.slice(PAST_SHOWN);
  return (
    <section aria-labelledby="organizer-past" className="mt-16">
      <h2 id="organizer-past" className={SECTION_TITLE}>
        Past nights
      </h2>
      <div className="mt-5 rounded-[24px] bg-pxi-surface p-2">
        <ul>
          {shown.map((night) => (
            <li key={night.id}>
              <Stub night={night} now={now} />
            </li>
          ))}
        </ul>
        {more.length ? (
          <ShowMore count={more.length} noun="past nights">
            {more.map((night) => (
              <li key={night.id}>
                <Stub night={night} now={now} />
              </li>
            ))}
          </ShowMore>
        ) : null}
      </div>
    </section>
  );
}

/**
 * The organizer's page, top to bottom: who they are, three numbers, a word about them, Instagram, Follow; then the
 * nights to come, the nights that were, and their scrapbooks. A section with nothing in it is left out.
 *
 * Server-rendered: everything is read from the API, and the hours are printed in each night's own time zone, so
 * there is no flash and no script except Follow's.
 *
 * @param {{
 *   organizer: object,
 *   upcoming: object[],
 *   past: object[],
 *   scrapbooks: object[],
 *   now?: Date,
 * }} props see src/lib/organizerPage.js for the shapes
 */
export default function OrganizerPage({ organizer, upcoming = [], past = [], scrapbooks = [], now = new Date() }) {
  const instagram = instagramUrl(organizer.instagramHandle);
  return (
    <div className="min-h-screen overflow-x-clip bg-black pt-[calc(var(--public-navbar-height)+2rem)] pb-28 font-inter text-white">
      <div className="mx-auto w-full max-w-[720px] px-5">
        <header className="flex flex-col items-center text-center">
          <UserAvatar user={{ avatarUrl: organizer.avatarUrl }} size={104} className="shrink-0" />
          <h1
            className={`mt-5 max-w-full text-balance [overflow-wrap:anywhere] font-bold normal-case leading-[1.04] tracking-[-0.03em] text-white ${nameSize(organizer.name)}`}
          >
            {organizer.name}
            {organizer.isVerified ? (
              <span role="img" aria-label="Verified" className="ml-2 inline-block align-[-0.08em] text-pxi-purple">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={28} strokeWidth={2} aria-hidden="true" />
              </span>
            ) : null}
          </h1>
          {organizer.username ? (
            <p className="mt-1.5 max-w-full text-[15px] font-medium text-white/50 [overflow-wrap:anywhere]">@{organizer.username}</p>
          ) : null}
          {organizer.hype ? <Hype hype={organizer.hype} /> : null}
          <Stats organizer={organizer} />
          {organizer.bio ? (
            <p className="mt-8 max-w-[34rem] whitespace-pre-line text-[15px] leading-[1.6] text-white/80 [overflow-wrap:anywhere]">{organizer.bio}</p>
          ) : null}
          {instagram ? (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram, @${organizer.instagramHandle}`}
              className={`mt-4 inline-flex min-h-11 items-center gap-2 px-3 text-[15px] font-semibold text-white/65 transition-colors hover:text-white ${FOCUS}`}
            >
              <HugeiconsIcon icon={InstagramIcon} size={18} aria-hidden="true" />@{organizer.instagramHandle}
            </a>
          ) : null}
          <div className="mt-7 flex w-full justify-center">
            <OrganizerFollow organizerId={organizer.id} name={organizer.name} />
          </div>
        </header>

        {upcoming.length ? (
          <section aria-labelledby="organizer-next" className="mt-16">
            <h2 id="organizer-next" className={SECTION_TITLE}>
              Next up
            </h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {upcoming.map((night) => (
                <li key={night.id} className="min-w-0">
                  <Ticket night={night} now={now} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {past.length ? <PastNights nights={past} now={now} /> : null}

        {scrapbooks.length ? (
          <section aria-labelledby="organizer-scrapbooks" className="mt-16">
            <h2 id="organizer-scrapbooks" className={SECTION_TITLE}>
              Scrapbooks
            </h2>
            <ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
              {scrapbooks.map((scrapbook, index) => (
                <li key={scrapbook.albumId} className="min-w-0">
                  <Print scrapbook={scrapbook} index={index} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
