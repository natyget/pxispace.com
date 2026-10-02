import './discover.css';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * WEB-1: what /events, a city hub or a genre hub shows when it has nothing on.
 *
 * The founder's ask was specific — "a CTA to create events instead of trying to load them
 * constantly when there isnt any events. the cta tells them to create one." An empty hub used
 * to offer "Explore all events", which sends someone who came looking for a night in their
 * city off to a list that may also be thin. The primary action is now to put one on.
 *
 * The create link points straight at /dashboard/events/new: middleware redirects a signed-out
 * visitor to /login with `redirect` set to the full return path, so they land back on the
 * create flow after signing in. Linking at /login directly would bounce a signed-in user
 * through a login screen they do not need.
 *
 * Written stranger-first: the reader may never have heard of PXI, so the copy says what
 * happens next rather than naming our features.
 *
 * `secondary` replaces the default "Browse everything on PXI" link; pass `null` for none.
 * /events uses it because that link would point at the page the reader is already on, where
 * the useful second action is clearing the filters that emptied the list.
 *
 * The artwork is an empty album sleeve with its record tucked behind: the Discover look, with
 * nothing on the shelf yet. No card around it — our surfaces don't use borders.
 */
export default function CreateEventEmptyState({ title, blurb, className = '', secondary }) {
    return (
        <div className={`dsc-empty ${className}`}>
            <div className="dsc-empty-art" aria-hidden="true">
                <span className="dsc-empty-disc" />
                <span className="dsc-empty-cover">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </span>
            </div>
            <h2 className="dsc-empty-title">{title}</h2>
            <p className="dsc-empty-blurb">{blurb}</p>
            <div className="dsc-empty-actions">
                <Link href="/dashboard/events/new" className="dsc-join">
                    Create an event <ArrowRight className="h-4 w-4" />
                </Link>
                {secondary === undefined ? (
                    <Link href="/events" className="dsc-link">
                        Browse everything on PXI
                    </Link>
                ) : (
                    secondary
                )}
            </div>
        </div>
    );
}
