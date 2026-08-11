import { JsonLd } from '@/components/seo/JsonLd';
import PricingView from '@/views/pricing/PricingView';
import { PRICING_FAQS } from '@/content/faqs';
import { buildFaqJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/schemas';

const TITLE = 'Pricing — Free To Host, $0.99 Per Paid Ticket';
const DESCRIPTION =
  'PXI is free to host and free events cost nothing. On paid tickets a flat $0.99 comes out of your payout and buyers pay a 5.49% service fee plus card processing. No monthly fees, no subscriptions, no setup cost.';
const URL = 'https://pxispace.com/pricing';
const OG = '/og-hero.png';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: OG, width: 1200, height: 630, alt: 'PXI Pricing' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

export default function PricingPage() {
  return (
    <>
      <h1 className="sr-only">PXI Pricing — free to host, flat $0.99 per paid ticket, 5.49% buyer service fee</h1>
      <PricingView />
      <JsonLd data={buildFaqJsonLd(PRICING_FAQS)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />
    </>
  );
}
