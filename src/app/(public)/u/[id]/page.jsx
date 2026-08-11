import PublicProfileClient from '@/views/public/PublicProfileClient';
import { getPublicProfile } from '@/lib/publicProfile';
import { getSiteUrl } from '@/lib/siteUrl';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { getOgFallbackUrl } from '@/lib/shareMetadata';
import { ogImageUrl } from '@/lib/seo/pageMetadata';

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
    // An avatar is the most meaningful card for a profile, but we do not know its pixel
    // size — asserting dimensions we cannot verify makes some crawlers reject the card.
    // So: emit the avatar with no declared size, or fall back to a generated 1200×630
    // card carrying the member's name, whose dimensions we do know.
    const avatar = resolveDisplayImageUrl(profile.avatarUrl);
    const ogImage =
        avatar || ogImageUrl({ title: displayName, eyebrow: 'PXI Passport' }) || getOgFallbackUrl(site);
    const ogImageEntry = avatar
        ? { url: avatar, alt: displayName }
        : { url: ogImage, width: 1200, height: 630, alt: displayName };

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
            images: [ogImageEntry],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${displayName} — PXI Passport`,
            description: rawDesc,
            images: [ogImage],
        },
    };
}

export default async function PublicUserProfilePage({ params }) {
    const { id } = await params;
    const profile = await getPublicProfile(id);

    return <PublicProfileClient userId={id} initialProfile={profile} />;
}
