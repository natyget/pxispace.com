import Link from 'next/link';
import { getPublicPost } from '@/lib/publicPost';
import { getSiteUrl } from '@/lib/siteUrl';
import { resolveDisplayImageUrl } from '@/lib/mediaUrl';
import { buildShareMetadata, resolveShareOgImage } from '@/lib/shareMetadata';
import PublicPostBottomBar from '@/views/public/PublicPostBottomBar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
  const { postId } = await params;
  const site = getSiteUrl();
  const canonical = `${site}/p/${postId}`;
  const post = await getPublicPost(postId);

  if (!post) {
    return buildShareMetadata({
      site,
      canonical,
      title: 'Post',
      description: 'This post could not be found.',
      ogImage: resolveShareOgImage(site),
      ogAlt: 'PXI',
      robots: { index: false, follow: false },
    });
  }

  const titleBase = post.isPrivateAccount ? 'Private post' : post.posterName || 'Post';
  const desc = post.isPrivateAccount
    ? 'This account is private. Open the PXI app to connect.'
    : post.caption && String(post.caption).trim()
      ? String(post.caption).trim().slice(0, 200)
      : `Photo by ${post.posterName} on PXI`;

  const ogImage = post.isPrivateAccount
    ? resolveShareOgImage(site)
    : resolveShareOgImage(site, post.ogImageUrl, post.imageUrl);

  return buildShareMetadata({
    site,
    canonical,
    title: titleBase,
    description: desc,
    ogImage,
    ogAlt: post.isPrivateAccount ? 'PXI' : titleBase,
    ogWidth: post.ogImageWidth,
    ogHeight: post.ogImageHeight,
    type: 'article',
    privatePreview: Boolean(post.isPrivateAccount),
  });
}

export default async function PublicPostPage({ params }) {
  const { postId } = await params;
  const post = await getPublicPost(postId);

  if (!post) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center bg-[#0a0a0a] px-4 pb-40 pt-28 text-center text-white md:pt-32">
        <p className="text-lg font-semibold">Post not found</p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">This link may be invalid or the post was removed.</p>
        <Link href="/" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
          Back to PXI
        </Link>
        <PublicPostBottomBar postId={postId} />
      </div>
    );
  }

  const resolvedImg = post.imageUrl ? resolveDisplayImageUrl(post.imageUrl) : null;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] pb-32 pt-18 text-white md:pb-24 md:pt-24">
      <div className="mx-auto flex max-w-lg flex-col px-4">
        {post.isPrivateAccount ? (
          <div className="relative aspect-[3/4] w-full max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.25), transparent 50%), linear-gradient(180deg, #18181b, #09090b)',
                filter: 'blur(24px)',
                transform: 'scale(1.08)',
              }}
              aria-hidden
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="text-lg font-bold tracking-tight">This account is private</p>
              <p className="mt-2 text-sm text-zinc-400">Media is only visible in the app for approved connections.</p>
            </div>
          </div>
        ) : resolvedImg ? (
          <img
            src={resolvedImg}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="w-full rounded-2xl border border-white/10 bg-black object-contain max-h-[85vh]"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-500">
            Preview unavailable
          </div>
        )}

        {!post.isPrivateAccount ? (
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-lg font-bold">{post.posterName}</p>
              {post.username ? (
                <span className="text-sm text-zinc-500">@{post.username}</span>
              ) : null}
            </div>

            {post.caption ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{post.caption}</p>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Reactions</p>
              {post.reactionCounts?.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {post.reactionCounts.map((r) => (
                    <li
                      key={r.emoji}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-sm"
                    >
                      <span>{r.emoji}</span>
                      <span className="text-zinc-300">{r.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">No reactions yet</p>
              )}
              <p className="mt-2 text-xs text-zinc-500">Total: {post.totalReactions ?? 0}</p>
            </div>
          </div>
        ) : null}
      </div>

      <PublicPostBottomBar postId={postId} />
    </div>
  );
}