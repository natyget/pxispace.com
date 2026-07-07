import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import EditorialArticle from '@/views/editorial/EditorialArticle';
import { EDITORIAL_STORIES, getEditorialStory } from '@/content/editorial';
import { SITE_URL, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

export function generateStaticParams() {
  return EDITORIAL_STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const story = getEditorialStory(slug);
  if (!story) return {};
  const url = `${SITE_URL}/editorial/${slug}`;
  const og = `/og?title=${encodeURIComponent(story.title)}&eyebrow=Editorial`;
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
    twitter: { card: 'summary_large_image', title: story.title, description: story.dek, images: [og] },
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
    publisher: { '@type': 'Organization', name: 'PXI', logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` } },
    mainEntityOfPage: `${SITE_URL}/editorial/${slug}`,
  };

  return (
    <>
      <EditorialArticle story={story} />
      <JsonLd data={articleJsonLd} />
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
