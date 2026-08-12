import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import EditorialArticle from '@/views/editorial/EditorialArticle';
import { EDITORIAL_STORIES, getEditorialStory } from '@/content/editorial';
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildVideoObjectJsonLd,
  posterPathForVideo,
} from '@/lib/seo/schemas';

export function generateStaticParams() {
  return EDITORIAL_STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const story = getEditorialStory(slug);
  if (!story) return {};
  const url = `${SITE_URL}/editorial/${slug}`;
  return {
    title: story.title,
    description: story.dek,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: story.title,
      description: story.dek,
      url,
      images: [{ url: story.cover, width: 1200, height: 630, alt: story.title }],
    },
    twitter: { card: 'summary_large_image', title: story.title, description: story.dek, images: [story.cover] },
  };
}

export default async function EditorialStoryPage({ params }) {
  const { slug } = await params;
  const story = getEditorialStory(slug);
  if (!story) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.dek,
    image: `${SITE_URL}${story.cover}`,
    datePublished: story.date,
    author: { '@type': 'Organization', name: 'PXI' },
    // Opaque square — publisher logos are composited on white by Google.
    publisher: { '@type': 'Organization', name: 'PXI', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-square.png` } },
    mainEntityOfPage: `${SITE_URL}/editorial/${slug}`,
  };

  // One VideoObject per clip. Google reported this page under "video indexing
  // issues" — it saw the <video> elements but had no thumbnail, title or
  // duration for any of them, which is a hard blocker on video indexing.
  const videoJsonLd = (story.videos ?? [])
    .map((video) =>
      buildVideoObjectJsonLd({
        name: video.name,
        description: video.description,
        contentPath: video.src,
        thumbnailPath: posterPathForVideo(video.src),
        uploadDate: story.date,
        durationSeconds: video.durationSeconds,
        pagePath: `/editorial/${slug}`,
      }),
    )
    .filter(Boolean);

  return (
    <>
      <EditorialArticle story={story} />
      <JsonLd data={articleJsonLd} />
      {videoJsonLd.map((node) => (
        <JsonLd key={node.contentUrl} data={node} />
      ))}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Editorial', path: '/editorial' },
          { name: story.title, path: `/editorial/${slug}` },
        ])}
      />
    </>
  );
}
