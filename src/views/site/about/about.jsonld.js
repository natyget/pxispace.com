// Structured data, ported verbatim from pxispace-redesign/site/about.html.
// About: AboutPage pointing at the homepage Organization + breadcrumb.

export const ABOUT_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://pxispace.com/about#page",
      "name": "About PXI",
      "url": "https://pxispace.com/about",
      "image": "https://pxispace.com/og-hero.png",
      "description": "PXI builds event technology around the memory of the night: tickets in the organizer's own brand, one shared camera roll and a scrapbook by morning.",
      "mainEntity": {
        "@id": "https://pxispace.com/#organization"
      },
      "isPartOf": {
        "@id": "https://pxispace.com/#website"
      },
      "breadcrumb": {
        "@id": "https://pxispace.com/about#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://pxispace.com/about#breadcrumb",
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
          "name": "About",
          "item": "https://pxispace.com/about"
        }
      ]
    }
  ]
};
