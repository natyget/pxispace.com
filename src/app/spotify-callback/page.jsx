// Spotify connect was retired on 2026-10-06. Its development mode lets only a handful of allowlisted people log in
// (5 for apps created since February 2026; extended quota needs 250k monthly users), so Music Match moved to Apple
// Music and to "Pick your sound" in the app. The API answers 410 SPOTIFY_REMOVED to new connections; this route
// stays so an old link, a bookmark or a cached app build lands on a clear message instead of an error.

import Link from 'next/link';

export const metadata = {
  title: 'Spotify | PXI',
  robots: { index: false },
};

export default function SpotifyCallbackPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black tracking-tight">Spotify is no longer connected to PXI</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
          Music Match now uses Apple Music, or the sound you pick in the app. Open PXI to set yours up.
        </p>
        <Link
          href="/get"
          className="mt-8 inline-flex w-full justify-center rounded-full bg-[#A523EF] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white"
        >
          Open PXI
        </Link>
        <Link
          href="/dashboard/account"
          className="mt-3 inline-flex w-full justify-center py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
        >
          Connect Apple Music on the web
        </Link>
      </div>
    </main>
  );
}
