import PublicProfileClient from '@/views/public/PublicProfileClient';
import { getPublicProfile } from '@/lib/publicProfile';
import { getSiteUrl } from '@/lib/siteUrl';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = getSiteUrl();
  const profile = await getPublicProfile(id);
  const canonical = `${site}/u/${id}`;

  if (!profile) {
    return buildShareMetadata({
      site,
      canonical,
      title: 'Profile',
      description: 'This PXI profile could not be found.',
      ogImage: resolveShareOgImage(site),
      ogAlt: 'PXI',
      robots: { index: false, follow: false },
    });
  }

  if (profile.isPrivateAccount) {
    return buildShareMetadata({
      site,
      canonical,
      title: 'Private profile',
      description: 'This profile is private. Open the PXI app to connect.',
      ogImage: resolveShareOgImage(site),
      ogAlt: 'PXI',
      type: 'profile',
      robots: { index: false, follow: false },
      privatePreview: true,
    });
  }

  const displayName = profile.name || profile.username || 'PXI member';
  const rawDesc =
    profile.isPassportIssued && profile.bio && String(profile.bio).trim()
      ? String(profile.bio).trim().slice(0, 200)
      : `View ${displayName}'s PXI Passport`;

  const ogImage = resolveShareOgImage(site, profile.avatarUrl);

  return buildShareMetadata({
    site,
    canonical,
    title: `${displayName} — PXI Passport`,
    description: rawDesc,
    ogImage,
    ogAlt: displayName,
    type: 'profile',
  });
}

export default async function PublicUserProfilePage({ params }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  return <PublicProfileClient userId={id} initialProfile={profile} />;
}
