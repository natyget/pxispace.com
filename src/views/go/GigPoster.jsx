import { posterTitleSize } from '@/lib/goPoster';
import './gigPoster.css';

/**
 * The typographic gig poster, for a listing whose source gave no flyer: a flat ink colour from the genre, the title
 * huge in the display face, the venue and the night small at the foot. The title's size is in container-width
 * units (see posterTitleSize), so the longest word always fits and a long name steps down instead of spilling
 * out. The link-preview card (/og/go) draws the same poster.
 *
 * @param {{ title: string, venue?: string, night?: string, colors: { ink: string, on: string }, ratio?: string }} props
 *   `ratio` is the box's aspect ("3 / 4" for a cover thumbnail); the default is the page's 4 / 5.
 */
export default function GigPoster({ title, venue = '', night = '', colors, ratio }) {
  const label = [`Poster for ${title}`, venue, night].filter(Boolean).join(', ');
  return (
    <div
      className="gig-poster"
      role="img"
      aria-label={label}
      style={{ '--ink': colors.ink, '--on': colors.on, '--fs': posterTitleSize(title), ...(ratio ? { '--ar': ratio } : {}) }}
    >
      <p className="gig-poster-title" aria-hidden="true">{title}</p>
      <p className="gig-poster-foot" aria-hidden="true">
        {venue ? <span className="gig-poster-venue">{venue}</span> : null}
        {night ? <span className="gig-poster-night">{night}</span> : null}
      </p>
    </div>
  );
}
