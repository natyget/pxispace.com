import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * WEB-1: what a city or genre hub shows when it has nothing on.
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
 */
export default function CreateEventEmptyState({ title, blurb, className = '' }) {
    return (
        <div className={`rounded-3xl border border-white/[0.08] bg-white/[0.02] p-10 text-center ${className}`}>
            <h2 className="display-3">{title}</h2>
            <p className="body-lead mx-auto mt-4 max-w-md">{blurb}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/dashboard/events/new" className="glow-cta inline-flex px-8 py-4 text-sm">
                    Create an event <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/events"
                    className="inline-flex px-6 py-4 text-sm text-zinc-400 underline underline-offset-4 hover:text-white"
                >
                    Browse everything on PXI
                </Link>
            </div>
        </div>
    );
}
