import Link from 'next/link';
import { formatNightLine, formatTimeLine, venueLabel } from '@/lib/goListing';
import { listingPath } from '@/lib/seo/listings';

/**
 * The other outside nights in the same city, soonest first, and the city's hub. A plain list: each night is one line
 * of when, what and where, set by weight and colour.
 *
 * @param {{ city: { name: string, slug: string }, nights: object[] }} props
 */
export default function GoMoreNights({ city, nights }) {
  return (
    <section className="go-more" aria-labelledby="go-more-title">
      <h2 id="go-more-title" className="go-more-title">More nights in {city.name}</h2>
      <ul className="go-more-list">
        {nights.map((night) => (
          <li key={night.id}>
            <Link className="go-more-link" href={listingPath(night)}>
              <span className="go-more-when">{formatNightLine(night)}</span>
              <span className="go-more-time">{formatTimeLine(night.startsAt, night.endsAt, night.timeZone)}</span>
              <span className="go-more-what">{night.title}</span>
              <span className="go-more-where">{venueLabel(night)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link className="go-more-hub" href={`/discover/${city.slug}`}>All events in {city.name}</Link>
    </section>
  );
}
