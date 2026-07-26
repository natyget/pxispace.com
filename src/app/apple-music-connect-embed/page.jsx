'use client';

// Apple Music connect was removed from PXI (App Store Guideline 4.5.2(iii) +
// a product decision to keep a single music provider, Spotify). This route is
// kept only so that any stale deep link / bookmark / cached app build that
// still opens it lands on a clear message instead of a broken MusicKit flow.
// The backend POST /api/music/apple/connect and GET /api/music/apple/developer-token
// endpoints also now return 410 Gone.

import React from 'react';

export default function AppleMusicConnectEmbedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-black uppercase tracking-[0.18em]">Apple Music</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Connecting Apple Music is no longer supported in PXI. Open the app and connect
          Spotify instead — your event match scores use that going forward.
        </p>
      </div>
    </div>
  );
}
