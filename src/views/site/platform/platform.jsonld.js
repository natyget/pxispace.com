// Structured data, ported verbatim from pxispace-redesign/site/platform.html.
// Platform: the organizer product (SoftwareApplication) + breadcrumb.

export const PLATFORM_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://pxispace.com/platform#app",
      "name": "PXI for Organizers",
      "operatingSystem": "iOS, Web",
      "applicationCategory": "BusinessApplication",
      "url": "https://pxispace.com/platform",
      "image": "https://pxispace.com/og-hero.png",
      "publisher": {
        "@id": "https://pxispace.com/#organization"
      },
      "description": "Event ticketing in the organizer's own brand with payouts to their own Stripe account, signed tickets and live door scanning, sales and turnout analytics, a venue heat map, audience segments with email and SMS campaigns, and a photo recap marketing kit.",
      "featureList": [
        "Branded event ticketing",
        "Payouts to your own Stripe account",
        "Signed tickets and live door scanning",
        "Live operations: gates, entry pace and capacity",
        "Sales pace and turnout analytics",
        "Venue heat map from event photos",
        "Audience CRM with email and SMS campaigns",
        "Top moments marketing kit"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free to host"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://pxispace.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Platform",
          "item": "https://pxispace.com/platform"
        }
      ]
    }
  ]
};
