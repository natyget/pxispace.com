import PlatformView from '@/views/site/platform/PlatformView';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata } from '@/lib/seo/pageMetadata';
import { PLATFORM_JSONLD } from '@/views/site/platform/platform.jsonld';

export const metadata = buildPageMetadata({
  title: 'Branded Event Ticketing, Door Scanning & Analytics',
  description:
    'Sell tickets under your own brand, get paid to your own Stripe account, scan signed passes at the door and see who came. Free to host, no monthly fees.',
  ogTitle: 'Sell out. Get paid. Know who came.',
  ogDescription:
    "Ticketing in your own brand, a door that can't be faked, and analytics on the night itself. Free to host.",
  eyebrow: 'For organizers',
  imageAlt: 'PXI for organizers: sell out, get paid, know who came',
  path: '/platform',
});

export default function PlatformPage() {
  return (
    <>
      <PlatformView />
      <JsonLd data={PLATFORM_JSONLD} />
    </>
  );
}
