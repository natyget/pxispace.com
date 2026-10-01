// Structured data, ported verbatim from pxispace-redesign/site/fashion-week-brooklyn.html.
// Fashion Week Brooklyn guide: Article, breadcrumb and one Event per night.
// Facts verified in pxispace-redesign/research/06.md. During Oct 4–9 update eventStatus if a show
// is cancelled or moved. Never describe PXI as the official platform of Fashion Week Brooklyn.

export const FWBK_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://pxispace.com/editorial/fashion-week-brooklyn#article",
      "headline": "Fashion Week Brooklyn 2026: The October Schedule",
      "description": "Fashion Week Brooklyn 2026 runs Oct 4–8: runway times, venue addresses, who can get in and RSVP links for every night, plus Oct 9 in Times Square.",
      "url": "https://pxispace.com/editorial/fashion-week-brooklyn",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://pxispace.com/editorial/fashion-week-brooklyn"
      },
      "image": [
        {
          "@type": "ImageObject",
          "url": "https://pxispace.com/og?title=Fashion+Week+Brooklyn+2026%3A+The+October+Schedule&eyebrow=Guide",
          "width": 1200,
          "height": 630
        }
      ],
      "datePublished": "2026-09-27T18:00:00-04:00",
      "dateModified": "2026-09-27T22:00:00-04:00",
      "author": {
        "@type": "Organization",
        "@id": "https://pxispace.com/#organization",
        "name": "PXI",
        "url": "https://pxispace.com"
      },
      "publisher": {
        "@type": "Organization",
        "@id": "https://pxispace.com/#organization",
        "name": "PXI",
        "url": "https://pxispace.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://pxispace.com/logo-square.png",
          "width": 512,
          "height": 512
        }
      },
      "about": {
        "@type": "Organization",
        "name": "Fashion Week Brooklyn",
        "url": "https://www.fashionweekbrooklyn.com"
      },
      "articleSection": "Guides",
      "inLanguage": "en-US",
      "isAccessibleForFree": true
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://pxispace.com/editorial/fashion-week-brooklyn#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://pxispace.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Editorial",
          "item": "https://pxispace.com/editorial"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Fashion Week Brooklyn 2026",
          "item": "https://pxispace.com/editorial/fashion-week-brooklyn"
        }
      ]
    },
    {
      "@type": "Event",
      "name": "Brooklyn x Japan Festival: Pratt Creative Exhibition & Fashion Runway Show – Fashion Week Brooklyn",
      "alternateName": [
        "Japan X Brooklyn Festival",
        "Pratt Creative Exhibition & Fashion Runway Show"
      ],
      "description": "Exhibition from 12 pm and a runway show at 4 pm, hosted by J-Collabo with Brooklyn Beauty Fashion Labo during Fashion Week Brooklyn 2026.",
      "startDate": "2026-10-04T12:00:00-04:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Brooklyn Beauty Fashion Labo",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "300 7th St",
          "addressLocality": "Brooklyn",
          "addressRegion": "NY",
          "postalCode": "11215",
          "addressCountry": "US"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "BK Style Foundation",
        "url": "https://www.bkstyle.org"
      },
      "image": [
        "https://pxispace.com/og?title=Fashion+Week+Brooklyn+2026%3A+The+October+Schedule&eyebrow=Guide"
      ],
      "url": "https://pxispace.com/editorial/fashion-week-brooklyn#oct-4"
    },
    {
      "@type": "Event",
      "name": "Slayway (LGBTQAI+ Designers) Collection – Fashion Week Brooklyn",
      "alternateName": "Slayway Runway",
      "description": "Slayway Runway: LGBTQAI+ designers with Catch These Compliments at Atolye NYC in Park Slope during Fashion Week Brooklyn 2026.",
      "startDate": "2026-10-05T19:00:00-04:00",
      "doorTime": "2026-10-05T18:00:00-04:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Atolye NYC",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "236B 6th St",
          "addressLocality": "Brooklyn",
          "addressRegion": "NY",
          "postalCode": "11215",
          "addressCountry": "US"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "BK Style Foundation",
        "url": "https://www.bkstyle.org"
      },
      "image": [
        "https://pxispace.com/og?title=Fashion+Week+Brooklyn+2026%3A+The+October+Schedule&eyebrow=Guide"
      ],
      "url": "https://pxispace.com/editorial/fashion-week-brooklyn#oct-5"
    },
    {
      "@type": "Event",
      "name": "Young Designers Runway – Fashion Week Brooklyn",
      "alternateName": "Young Designers",
      "description": "Student and emerging designers presented with Rutgers University at Atolye NYC in Park Slope during Fashion Week Brooklyn 2026.",
      "startDate": "2026-10-06T19:00:00-04:00",
      "doorTime": "2026-10-06T18:00:00-04:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Atolye NYC",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "236B 6th St",
          "addressLocality": "Brooklyn",
          "addressRegion": "NY",
          "postalCode": "11215",
          "addressCountry": "US"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "BK Style Foundation",
        "url": "https://www.bkstyle.org"
      },
      "image": [
        "https://pxispace.com/og?title=Fashion+Week+Brooklyn+2026%3A+The+October+Schedule&eyebrow=Guide"
      ],
      "url": "https://pxispace.com/editorial/fashion-week-brooklyn#oct-6"
    },
    {
      "@type": "Event",
      "name": "Very Brooklyn Show (A Very Brooklyn Fashion Show 2026) – Fashion Week Brooklyn",
      "alternateName": [
        "A Very Brooklyn Fashion Show 2026",
        "Very Brooklyn Show"
      ],
      "description": "Runway show with Brooklyn Made and the Brooklyn Chamber of Commerce at Industry City during Fashion Week Brooklyn 2026.",
      "startDate": "2026-10-08T18:00:00-04:00",
      "doorTime": "2026-10-08T17:00:00-04:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "bkONE Productions, Industry City",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "51 35th St, Building 5",
          "addressLocality": "Brooklyn",
          "addressRegion": "NY",
          "postalCode": "11232",
          "addressCountry": "US"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "BK Style Foundation",
        "url": "https://www.bkstyle.org"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "url": "https://brooklynmadestore.com/pages/brooklyn-fashion-show-2026"
      },
      "image": [
        "https://pxispace.com/og?title=Fashion+Week+Brooklyn+2026%3A+The+October+Schedule&eyebrow=Guide"
      ],
      "url": "https://pxispace.com/editorial/fashion-week-brooklyn#oct-8"
    }
  ]
};
