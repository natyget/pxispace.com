import PublicProfileClient from '@/views/public/PublicProfileClient';
import { getPublicProfile } from '@/lib/publicProfile';
import { getSiteUrl } from '@/lib/siteUrl';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { getOgFallbackUrl } from '@/lib/shareMetadata';

/** Netlify/SSR: always run profile fetch at request time with runtime env (see `API_BASE_URL`). */
export const dynamic = 'force-dynamic';

/** Netlify Open Next: ensure Node runtime so `process.env` + `fetch` match serverless (not Edge). */
export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const site = getSiteUrl();
    const profile = await getPublicProfile(id);
    const canonical = `${site}/u/${id}`;

    if (!profile) {
        return {
            title: 'Profile | PXI',
            description: 'This PXI profile could not be found.',
            robots: { index: false, follow: false },
        };
    }

    if (profile.isPrivateAccount) {
        return {
            title: 'Private profile | PXI',
            description: 'This profile is private. Open the PXI app to connect.',
            robots: { index: false, follow: false },
            openGraph: {
                type: 'profile',
                url: canonical,
                siteName: 'PXI',
                title: 'Private profile | PXI',
                description: 'This profile is private. Open the PXI app to connect.',
            },
            twitter: {
                card: 'summary',
                title: 'Private profile | PXI',
                description: 'This profile is private. Open the PXI app to connect.',
            },
        };
    }

    const displayName = profile.name || profile.username || 'PXI member';
    const rawDesc =
        profile.isPassportIssued && profile.bio && String(profile.bio).trim()
            ? String(profile.bio).trim().slice(0, 200)
            : `View ${displayName}'s PXI Passport`;
    const ogImage = resolveDisplayImageUrl(profile.avatarUrl) || getOgFallbackUrl(site);

    return {
        title: `${displayName} — PXI Passport`,
        description: rawDesc,
        metadataBase: new URL(site),
        alternates: { canonical },
        openGraph: {
            type: 'profile',
            url: canonical,
            siteName: 'PXI',
            title: `${displayName} — PXI Passport`,
            description: rawDesc,
            images: ogImage
                ? [
                      {
                          url: ogImage,
                          width: 1200,
                          height: 1200,
                          alt: displayName,
                      },
                  ]
                : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${displayName} — PXI Passport`,
            description: rawDesc,
            images: ogImage ? [ogImage] : undefined,
        },
    };
}

export default async function PublicUserProfilePage({ params }) {
    const { id } = await params;
    const profile = await getPublicProfile(id);

    return <PublicProfileClient userId={id} initialProfile={profile} />;
}
