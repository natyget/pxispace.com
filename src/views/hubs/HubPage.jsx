import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { eventImageUrl, eventPriceUsd } from '@/lib/publicEvents';
import { resolveEventCity } from '@/lib/seo/cities';

/**
 * Server-rendered shell for the discovery hubs (/artists, /genres, /discover/[city]/[genre]).
 *
 * These are SERVER components on purpose and must stay that way. Their entire job is to put
 * real, crawlable content and dense internal links into the FIRST HTML response — the city
 * hubs previously shipped a hero plus six skeleton divs, so Google saw a page with no events
 * on it. No 'use client', no useEffect fetching, no framer-motion (it drags in the client
 * runtime and would defeat the point).
 */

const DEFAULT_IMG = '/og-hero.png';

function formatDate(value) {
  if (!value) return 'Date TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date TBA';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatPrice(event) {
  const p = eventPriceUsd(event);
  if (p == null) return null;
  return p === 0 ? 'Free' : `$${p.toFixed(p % 1 === 0 ? 0 : 2)}`;
}

/** One event card. Plain anchor + img so it costs nothing on the client. */
export function HubEventCard({ event }) {
  const city = resolveEventCity(event);
  const price = formatPrice(event);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-white/25"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={eventImageUrl(event) || DEFAULT_IMG}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold leading-snug text-white">{event.name || 'Event'}</h3>
        <p className="mt-2 text-sm text-zinc-500">
          {formatDate(event.startDate)}
          {city ? ` · ${city.name}` : event.location ? ` · ${event.location}` : ''}
        </p>
        {price ? <p className="mt-1 text-sm font-semibold text-pxi-purple">{price}</p> : null}
      </div>
    </Link>
  );
}

export function HubEventGrid({ events = [], emptyMessage = 'No upcoming events yet.' }) {
  if (!events.length) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <HubEventCard key={e.id} event={e} />
      ))}
    </div>
  );
}

/**
 * A rail of related internal links. Dense internal linking between artist, genre, city and
 * event pages is the whole point of these hubs — it is what lets crawl equity flow into the
 * long tail instead of pooling on the homepage.
 */
export function HubLinkRail({ title, links = [] }) {
  if (!links.length) return null;
  return (
    <div className="mt-14">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Breadcrumb trail, rendered visibly as well as in JSON-LD. */
export function HubBreadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden className="text-zinc-700">/</span> : null}
            {i === items.length - 1 ? (
              <span className="text-zinc-300">{item.name}</span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-white">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Standard hub layout: breadcrumbs, h1, intro copy, the event grid, then link rails.
 */
export default function HubPage({
  breadcrumbs = [],
  eyebrow,
  title,
  intro,
  events = [],
  emptyMessage,
  children,
  rails = [],
}) {
  return (
    <div className="landing-v2 bg-black text-white">
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <HubBreadcrumbs items={breadcrumbs} />
          {eyebrow ? (
            <span className="mt-8 block text-[11px] font-bold uppercase tracking-[0.2em] text-pxi-purple">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="display-1 mt-4 max-w-3xl">{title}</h1>
          {intro ? <p className="body-lead mt-5 max-w-2xl text-zinc-400">{intro}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-14">
        {children}
        <HubEventGrid events={events} emptyMessage={emptyMessage} />
        {rails.map((rail) => (
          <HubLinkRail key={rail.title} title={rail.title} links={rail.links} />
        ))}
        <div className="mt-16 border-t border-white/10 pt-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
          >
            Browse every event on PXI <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
