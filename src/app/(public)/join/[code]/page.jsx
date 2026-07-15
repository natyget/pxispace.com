import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { getSiteUrl } from '@/lib/siteUrl';
import { buildShareMetadata } from '@/lib/shareMetadata';

// Minimal landing for album invite links so uninstalled users don't 404.
// Installed users never see this page — the universal link opens the app first.
// No public endpoint resolves an invite code to an album name, so copy stays generic.

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { code } = await params;
  const site = getSiteUrl();
  return buildShareMetadata({
    site,
    canonical: `${site}/join/${encodeURIComponent(String(code ?? ''))}`,
    title: 'Join an album on PXI',
    description: 'You’ve been invited to join an album on PXI — get the app to jump in.',
    ogImage: `${site}/og-hero.png`,
    ogAlt: 'PXI',
    ogWidth: 1200,
    ogHeight: 630,
    robots: { index: false, follow: false },
  });
}

export default async function JoinCodePage({ params }) {
  const { code } = await params;
  const site = getSiteUrl();
  /** Same URL as this page — when the app is installed, the universal link intercepts it. */
  const openHref = `${site}/join/${encodeURIComponent(String(code ?? ''))}`;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 py-24 text-center text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pxi-purple">Invitation</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          You&apos;ve been invited to join an album on PXI
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Get the app to join the album, add your photos, and relive the night with everyone who
          was there.
        </p>
        <div className="mt-8">
          <AppStoreCtaPair variant="row" />
        </div>
        <a
          href={openHref}
          className="mt-6 inline-block text-sm font-medium text-pxi-purple hover:text-white"
        >
          Already have PXI? Open the app
        </a>
      </div>
    </div>
  );
}
