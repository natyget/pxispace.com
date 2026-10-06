import Link from 'next/link';
import GoStoreButton from './GoStoreButton';
import { appStoreHref } from '@/lib/goListing';

// The three ways a share link can come up empty, in the look the site already uses for a link that leads nowhere
// (the event, post and album pages): a centred line on black, a quiet reason, one way on. The App Store button
// stays on all of them: a dead link is still a person who came to find a night.
const COPY = {
  // 404: unknown, hidden or taken down. We do not say which.
  missing: {
    title: "We couldn't find that night.",
    line: () => 'This link may be old, or the night was taken down.',
  },
  // 410: it ended more than a day ago. The city is named so the next step has somewhere to go.
  gone: {
    title: 'This night has passed.',
    line: (cityName) => (cityName ? `See what's on in ${cityName} tonight, in the app.` : "See what's on tonight, in the app."),
  },
  // The API did not answer. Not the same as the night not existing, so it does not say so.
  unavailable: {
    title: "We couldn't load that night.",
    line: () => 'Give it a moment and try again.',
  },
};

/**
 * @param {{ state: 'missing' | 'gone' | 'unavailable', id: string, cityName?: string, platform: 'ios' | 'android' | 'desktop' }} props
 */
export default function GoGone({ state, id, cityName = '', platform }) {
  const copy = COPY[state] || COPY.missing;
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-black px-4 pb-16 pt-10 text-center text-white">
      <p className="text-lg font-semibold">{copy.title}</p>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">{copy.line(cityName)}</p>
      <GoStoreButton className="go-store-solo" href={appStoreHref(id)} platform={platform} />
      {state === 'unavailable' ? (
        // A real navigation: the same address again, once the API is back.
        <a href={`/go/${encodeURIComponent(id)}`} className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
          Try again
        </a>
      ) : (
        <Link href="/" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
          Back to PXI
        </Link>
      )}
    </div>
  );
}
