/* eslint-disable react-refresh/only-export-components -- a Next page exports its metadata next to the page, like every page here */
import PublicProfileClient from '@/views/public/PublicProfileClient';
import OrganizerPage from '@/views/public/organizer/OrganizerPage';
import { getPublicProfile } from '@/lib/publicProfile';
import { getOrganizer, getOrganizerCatalogue, getOrganizerScrapbooks } from '@/lib/organizer';
import { organizerDescription, organizerHref, organizerTitle } from '@/lib/organizerPage';
import { canonicalUrl, getSiteUrl } from '@/lib/siteUrl';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { toOpenGraphImageUrl } from '@/lib/ogImageUrl';
import { buildShareMetadata, getOgFallbackUrl } from '@/lib/shareMetadata';
import { ogImageUrl } from '@/lib/seo/pageMetadata';

/** Netlify/SSR: always run profile fetch at request time with runtime env (see `API_BASE_URL`). */
export const dynamic = 'force-dynamic';

/** Netlify Open Next: ensure Node runtime so `process.env` + `fetch` match serverless (not Edge). */
export const runtime = 'nodejs';

/**
 * The passport preview's profile. An API that cannot be reached reads as "not found", the way any link we cannot
 * resolve does, instead of as an error page.
 */
async function loadProfile(id) {
    try {
        return await getPublicProfile(id);
    } catch (error) {
        console.error('[u/[id]] profile fetch failed', { id, error });
        return null;
    }
}

/**
 * The organizer's page is indexable and says who they are. Its address is the username form when they have one (the
 * id form names the same page), always on the production origin.
 */
function organizerMetadata(organizer, site) {
    // An avatar is the most meaningful card for a person, but we do not know its pixel size, and asserting
    // dimensions we cannot verify makes some crawlers reject the card. So: the avatar with no declared size, or a
    // generated 1200×630 card carrying the name, whose dimensions we do know.
    const avatar = toOpenGraphImageUrl(site, organizer.avatarUrl);
    return buildShareMetadata({
        site,
        canonical: canonicalUrl(organizerHref(organizer) ?? `/u/${organizer.id}`),
        title: organizerTitle(organizer),
        description: organizerDescription(organizer),
        ogImage: avatar || ogImageUrl({ title: organizer.name, eyebrow: 'Organizer' }),
        ogAlt: organizer.name,
        ...(avatar ? {} : { ogWidth: 1200, ogHeight: 630 }),
        type: 'profile',
    });
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const site = getSiteUrl();

    const organizer = await getOrganizer(id);
    if (organizer) return organizerMetadata(organizer, site);

    const profile = await loadProfile(id);
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

    // A Diplomat's address is their organizer page. Anyone else's is the read-only passport preview, as it was.
    const organizer = await getOrganizer(id);
    if (organizer) {
        const [catalogue, scrapbooks] = await Promise.all([
            getOrganizerCatalogue(organizer.id),
            getOrganizerScrapbooks(organizer.id),
        ]);
        return (
            <OrganizerPage
                organizer={organizer}
                upcoming={catalogue.upcoming}
                past={catalogue.past}
                scrapbooks={scrapbooks}
            />
        );
    }

    const profile = await loadProfile(id);
    return <PublicProfileClient userId={id} initialProfile={profile} />;
}
