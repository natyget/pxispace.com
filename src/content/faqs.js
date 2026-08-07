/**
 * FAQ content shared between client views (accordion) and server pages
 * (FAQPage JSON-LD). Kept in a plain module — NOT a 'use client' file — so
 * server components can import the raw arrays.
 */

export const HOME_FAQS = [
  {
    q: 'How do I get into an event?',
    a: 'Find the event in the app, RSVP or buy your ticket, and your QR pass lands in your wallet. Show it at the door and you are in.',
  },
  {
    q: 'How does the shared camera work?',
    a: 'Every event has one shared album. When doors open, anyone attending can shoot straight into it, and every shot shows up in the live thread for the whole room.',
  },
  {
    q: 'Do I have to upload my photos afterwards?',
    a: 'No. The scrapbook compiles itself the morning after: every photo from every phone, organized and ranked so the best shots rise to the top.',
  },
  {
    q: 'Who can see my photos?',
    a: 'Only people in the event album. PXI does not track your location or sell your data, and private albums stay private.',
  },
  {
    q: 'What are stamps and the passport?',
    a: 'When you actually check in at an event you earn a verified stamp. Stamps build your passport, a running record of every night you made it out. Hosting earns rarer stamps.',
  },
  {
    q: 'How do I post my night to Instagram?',
    a: 'Open any shot in your scrapbook and tap share. PXI frames it into a captioned post card and hands it straight to Instagram.',
  },
];

export const INSTA_FAQS = [
  {
    q: 'Do I need to screenshot or crop anything?',
    a: 'No. PXI frames the shot for you, captioned with the event or trip name and location, and hands it straight to Instagram. One tap, no editing.',
  },
  {
    q: 'Does it work for organizers promoting an event?',
    a: 'Yes. Any shot from your event’s shared gallery becomes a branded, ready-to-post card, so your attendees and your team can promote the next one in seconds.',
  },
  {
    q: 'What can I share, a single photo or the whole scrapbook?',
    a: 'Either. Share a single framed frame, or post a set from the morning-after scrapbook. It works for private trip albums and public events alike.',
  },
  {
    q: 'Where do the photos come from?',
    a: 'From the live shared gallery. Every attendee shoots into one thread during the night, and the scrapbook compiles automatically the next morning.',
  },
];

export const PRICING_FAQS = [
  {
    q: 'How much does PXI cost?',
    a: 'PXI is free to use and free events cost nothing. On paid tickets there are two fees: a flat $0.99 per ticket deducted from your payout, and a 5.49% service fee paid by the buyer at checkout on top of the ticket price. Buyers also cover card processing. There are no monthly fees, no subscriptions and no setup cost.',
  },
  {
    q: 'Who pays the fee?',
    a: 'Both sides pay a share. The organizer pays the flat $0.99 per ticket, taken from the payout. The buyer pays the 5.49% service fee plus card processing, added at checkout. Your ticket revenue goes straight to your own Stripe account via destination charges — PXI never holds your money.',
  },
  {
    q: 'Are free events really free?',
    a: 'Yes. If your event is free to attend, there is no platform fee at all. You get the full toolset of gallery, scrapbook, scanning, and analytics at no cost.',
  },
  {
    q: 'What do early-access organizers get?',
    a: 'Organizers who get moving quickly on PXI receive free promotional credits and full access to the dashboard analytics and ops tools while we roll out. A head start on the whole stack.',
  },
  {
    q: 'How secure are the tickets?',
    a: 'Every pass is cryptographically signed with a modern token standard, meaningfully harder to forge than the aging token formats most platforms still rely on. Attendance is verified with cryptographic stamps, not screenshots.',
  },
];

/**
 * FAQ page content categorized for accordion rendering on /faq
 */
export const FAQ_PAGE_SECTIONS = [
  {
    heading: 'General',
    items: HOME_FAQS,
  },
  {
    heading: 'Account & Access',
    items: [
      {
        q: 'How do I create a PXI account?',
        a: 'Download the PXI app and sign up with your email, Apple ID, or Google account. Verification takes a few seconds and you can join or create events straight away.',
      },
      {
        q: "I can't log in, what should I do?",
        a: "Try the 'Forgot password' link on the login screen. If you signed up with Apple or Google, make sure you're using the same provider. Still stuck? Email support@pxispace.com with your account email and we'll sort it out.",
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Account → Delete Account in the app. This permanently removes your profile, photos, and data. If you need help completing the process, email support@pxispace.com.',
      },
    ],
  },
  {
    heading: 'Events & Albums',
    items: [
      {
        q: 'How do I join an event?',
        a: "Tap the event link or QR code shared by the host, or search for the event by name in the app. Some events require a valid ticket for access, so make sure you're checked in at the venue.",
      },
      {
        q: "Why can't I see the event album?",
        a: 'Album access is controlled by the host. Most albums unlock once you are checked in at the venue. Check that your location permissions are on and that you have the latest version of the app.',
      },
      {
        q: 'How do I create and host an event?',
        a: "Tap the '+' button on the Events tab and follow the setup flow. You can set a venue, upload a cover photo, enable ticketing, and configure album permissions, all from the app.",
      },
      {
        q: 'Can I download photos from an event?',
        a: 'Yes. Open any photo in the album, tap the download icon, and it will save to your camera roll. Hosts can set download permissions, so if the option is greyed out the host has disabled it for that event.',
      },
    ],
  },
  {
    heading: 'Tickets & Payments',
    items: [
      {
        q: 'How do I buy a ticket?',
        a: "Find the event in the app or via a shared link, tap 'Get Tickets', choose your ticket type, and complete checkout with Apple Pay, Google Pay, or a card. Your ticket lives in the Tickets tab and can be shown at the door.",
      },
      {
        q: "I was charged but can't access the event, what do I do?",
        a: "Pull to refresh on the Tickets tab first, as the ticket can take a moment to appear. If it still isn't there after a minute, email support@pxispace.com with your order confirmation and we'll resolve it right away.",
      },
      {
        q: 'How do host payouts work?',
        a: 'Ticket revenue is processed through Stripe. Once your event closes, funds are transferred to your connected bank account on a standard Stripe payout schedule (usually 2–7 business days). For payout questions, email support@pxispace.com with your event name.',
      },
    ],
  },
  {
    heading: 'Privacy & Safety',
    items: [
      {
        // ACCURACY IS A LEGAL REQUIREMENT HERE, NOT A STYLE CHOICE.
        // This answer previously said face recognition ran "on-device" and that "no
        // biometric data is sent to our servers". Both statements were false: enrollment
        // frames are uploaded over TLS and the FaceVector is derived and stored
        // SERVER-SIDE (see FaceVector / MediaFaceEmbedding / PhotoFaceTag). It also
        // contradicted our own Privacy Policy §2.3, which describes the real flow.
        // A public claim that conflicts with the privacy policy and the App Store
        // privacy label is an App Review rejection and, for biometrics, BIPA exposure.
        // Do not reintroduce "on-device" language for face matching.
        q: 'How does Find My Shots (face matching) work?',
        a: 'It is opt-in, and you have to turn it on yourself. When you do, you run a short guided face scan. Those frames are sent over an encrypted connection to our servers, where they are converted into a FaceVector — a string of numbers describing facial geometry that cannot be turned back into a picture of you. The scan frames are discarded once the vector exists. Photos uploaded to event albums are then matched against that vector so we can show you the shots you appear in. We never sell or rent biometric data. You can withdraw consent at any time in Settings → Privacy, which deletes your FaceVector and the face tags derived from it.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. PXI uses encrypted connections for all data in transit, session-based authentication, and strict access controls so event content is only visible to verified attendees. See our Privacy Policy for full details.',
      },
      {
        q: 'How do I report a safety or trust issue?',
        a: 'For content or behaviour that violates our community guidelines, use the in-app report button on any photo, profile, or event. For urgent trust and safety matters, email trust@pxispace.com directly.',
      },
    ],
  },
];

/**
 * A flat array of all questions/answers on the FAQ page, for JSON-LD schema
 */
export const FAQ_PAGE_FLAT = FAQ_PAGE_SECTIONS.reduce((acc, section) => {
  return acc.concat(section.items);
}, []);
