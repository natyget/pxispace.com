'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon } from '@hugeicons/core-free-icons';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';

const SECTIONS = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    tldr: "We collect only what we need to run the party. Face Matching sends scan frames to our servers solely to create an irreversible FaceVector, then discards the images. Your location is checked when you use nearby/discover or check in — not tracked continuously. You own your photos. We never sell your data. Mobile numbers and SMS consent are never shared with third parties for their marketing.",
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. Who We Are</h3>
          <p className="text-gray-400 leading-relaxed">
            PXIStudio ("PXI," "we," "us," "our") is a Social Media Studio combining event photo-sharing, ticketing, gamification, and analog-emulative media creation into one platform. We are operated by <strong>PXI LABS LLC</strong>, headquartered in Cambridge, Massachusetts, USA.
          </p>
          <p className="text-gray-400 leading-relaxed mt-2">
            Our Services include: (i) event discovery and ticketing, (ii) spatially-grouped event photo albums, (iii) the Odyssey gamification system, (iv) the Analog Engine media creation suite, (v) real-time event social features, and (vi) vendor/host management tools. These Terms apply to all of these Services collectively.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Information We Collect</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.1 Account & Identity Data</h4>
              <p className="text-gray-400">When you create a PXI account, we collect: Phone number (E.164 format; used for OTP/account verification and, where you separately opt in, for the PXI SMS Program described in Section 2.8; we do not store passwords), Display name and username, Date of birth (for age eligibility verification; birth year is never shared with other users), Optional: profile photo, biography, and social media handles, Optional: email address (for account recovery and legal notices).</p>
              <div className="mt-3 p-4 bg-legal-hub-surface rounded-lg border border-legal-hub-border">
                <p className="text-sm font-mono text-legal-hub-accent">Authentication: PXI uses PASETO v4 (public) tokens signed with Ed25519 for all session management. Tokens are cryptographically signed and encode your userId, role, and isVendor/isStaff status. No raw session UUIDs or passwords are stored server-side. Local encryption of sensitive payload data uses XChaCha20-Poly1305 with a 192-bit nonce.</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.2 Location Data — The Event Lock</h4>
              <p className="text-gray-400">To unlock event-specific photo albums and show nearby events, PXI may request your location while you use the app (when-in-use). Location is used to check your latitude and longitude against a ~1km Haversine radius around the event venue (for example at ticket scan / check-in) and to rank nearby events in Discover. We do NOT request Always/background location permission and we do NOT continuously track your location when the app is closed. Aggregate spatial metadata may be retained for safety and fraud prevention for up to 90 days.</p>
            </div>

            <div className="bg-legal-hub-surface border border-legal-hub-border p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-legal-hub-accent"></div>
              <h4 className="text-lg font-semibold text-legal-hub-accent mb-2 flex items-center gap-2">
                <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />
                2.3 Biometric Data — BIPA Disclosure (Illinois)
              </h4>
              <p className="text-gray-400 text-sm mb-4">PXI&apos;s Face Matching feature (also called &quot;Find My Shots&quot;) uses facial geometry vector scanning (&quot;FaceVector&quot;) to identify your photos within shared event albums. This feature is subject to the Illinois Biometric Information Privacy Act (BIPA), the California Consumer Privacy Act (CPRA Sensitive Data provisions), and analogous state laws.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                <li>If you opt in, guided capture frames from your camera are transmitted securely (TLS) to PXI servers solely so we can derive your FaceVector. Frames are held in memory during processing and permanently discarded immediately after vector extraction — we do not store raw biometric images or face crops from enrollment.</li>
                <li>The FaceVector is a mathematical list of numbers that cannot reasonably be reversed into a photo. Only this vector is retained on PXI servers, encrypted in transit (TLS) and encrypted at rest.</li>
                <li>The stored vector is used strictly to (a) match you in event photos you attend and (b) send you a &quot;you&apos;re in a photo&quot; alert. It is never used for advertising, identity verification for login, law-enforcement watchlists, or any purpose beyond photo matching.</li>
                <li>A distinct, upfront Biometric Consent Screen with plain-language explanation is required before this feature is activated — affirmative opt-in only.</li>
                <li>Photos uploaded to event albums are scanned to derive per-face vectors so opted-in attendees can be matched to their photos. We store vectors only — never face crops created solely for this matching process.</li>
                <li>Web guests without the app may run a one-time face scan to find themselves in an event gallery. The scan frame is sent once over an encrypted connection for that single gallery match; the frame is discarded after embedding and is not stored as an enrollment profile unless you separately opt in to Face Matching in the app.</li>
                <li>You may revoke consent at any time via Settings &gt; Apps &gt; Face Matching.</li>
                <li>Upon revocation, your server-stored enrollment vector is deleted immediately; previously matched photo tags remain visible until manually removed by you.</li>
                <li>We NEVER sell, lease, rent, trade, or profit from biometric data.</li>
                <li>Biometric data is never shared with third parties except: (i) infrastructure and cloud storage providers strictly as necessary to store and process the encrypted vector, and (ii) as required by valid legal process.</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4 italic">Retention: Enrollment vectors are retained until the earliest of: (i) revocation of your consent, (ii) deletion of your account, or (iii) three (3) years following your last interaction with the Services.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.4 Media & Content Data</h4>
              <p className="text-gray-400">We collect content you actively create or upload: Photos and videos uploaded to Event Albums, The Wall, The Vault, or The Circle. Voice notes you record in direct messages, group chats, or event album threads (audio files and duration metadata; typically capped at about 60 seconds). Metadata: upload timestamp, event association, media type, file size. Analog Engine processing parameters: ZSL (Zero Shutter Lag), Halation, Film Grain shader settings applied at render time. These parameters are PXI&apos;s proprietary aesthetic layer; the underlying raw photo remains yours. Captions, comments, reactions, and text messages you post. Number of retakes before posting (used to improve camera experience, not stored permanently). Uploaded media may be scanned by automated systems (for example NSFW safety classifiers) to enforce Community Standards.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.5 Usage, Engagement & Gamification Data</h4>
              <p className="text-gray-400">App interactions: album joins, ticket scans, photo uploads, reactions, shares, comment posts, messages sent. Odyssey/Gamification data: XP earned per action, Stamp tier achieved, Leaderboard position, event attendance history. Event-specific behavior: Hype Gate activity, Grace Time uploads, Circle content views, check-in confirmations. Device and network data: device type, OS version, browser/app version, IP-based approximate location (city-level), and push notification tokens. PXI does not use the advertising identifier (IDFA/GAID) for tracking. Crash logs, error diagnostics, and performance monitoring data. When you take a screenshot within the app (we may notify the relevant album host).</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.6 Event & Ticketing Data (Attendees)</h4>
              <p className="text-gray-400">Ticket purchase records and order history. RSVP and attendance status. Payment confirmation numbers (NOT full card details — those are held by Stripe). Event check-in timestamp and location confirmation. Contacts: with your permission, we may read your device contacts on-device to suggest people you may already know on PXI (Circle suggestions) and to help you invite friends. We do not upload or permanently store your full address book on PXI servers; only the connections or invites you choose to act on create server-side records.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.7 Vendor, Host & Organizer Data</h4>
              <p className="text-gray-400">If you register as a Tier 3 Vendor/Host, we additionally collect: Legal name, business name (DBA), address, EIN/tax identification number. Bank account/payout information (processed via Stripe Connect; PXI does not store raw bank details). Government-issued ID (when required for identity verification for high-volume payouts). Event proceeds history, fee records, chargeback history. Staff delegation records (who you assigned as Co-host, Photographer, Promoter, or Bouncer). Messaging Service communication logs (for SMS/event blast compliance).</p>
            </div>

            <div className="p-6 bg-legal-hub-surface border border-legal-hub-border rounded-xl">
              <h4 className="text-lg font-semibold text-white/90 mb-2">2.8 SMS / Mobile Messaging Data (A2P 10DLC)</h4>
              <p className="text-gray-400 mb-3">
                If you provide a mobile number and opt in to text messages, we collect and process: your mobile phone number; SMS/MMS opt-in and opt-out status and timestamps; message delivery logs (sent, delivered, failed); and keyword replies such as STOP and HELP. This data is used solely to operate the PXI SMS Program (transactional event notifications, account/security alerts, and — only with separate marketing consent — promotional messages from PXI or on behalf of Event Hosts).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                <li><strong className="text-white">Non-sharing of mobile information:</strong> We do not sell, rent, or share your mobile phone number or SMS opt-in consent with third parties, affiliates, or partners for their own marketing or promotional purposes. Mobile numbers are shared only with our SMS delivery provider (currently Twilio) as a processor necessary to send messages you consented to receive, or as required by law.</li>
                <li><strong className="text-white">Message frequency:</strong> Message frequency varies. You may receive recurring messages related to events you join or host; typical volume is up to several messages per event you attend or organize, plus occasional account or marketing messages if you opted in. Exact frequency depends on your activity and preferences.</li>
                <li><strong className="text-white">Rates:</strong> Message and data rates may apply. Your carrier&apos;s standard messaging rates apply to messages sent to you and from you.</li>
                <li><strong className="text-white">Consent:</strong> Providing a phone number for account verification is not the same as SMS marketing consent. Marketing texts require a separate affirmative opt-in. Consent to receive texts is not a condition of any purchase.</li>
                <li><strong className="text-white">Opt-out:</strong> Reply <strong className="text-white">STOP</strong> to any PXI SMS to unsubscribe, or manage SMS preferences in Settings. Reply <strong className="text-white">HELP</strong> for assistance, or email support@pxispace.com. Full program terms are in Terms of Service §12.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.9 In-App Messaging & Voice Notes</h4>
              <p className="text-gray-400 mb-3">
                PXI includes direct messages, group chats, and event album threads. When you use these features we process: message text; voice notes (audio recordings you create with the microphone, typically up to about 60 seconds) and their duration; shared media, GIFs, stickers, and event cards you attach; conversation participant IDs; delivery/read metadata; and report/block actions.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                <li>Voice notes and chat media are stored on our cloud storage providers (for example Cloudflare R2) so recipients can play them, subject to the retention rules in Section 5.</li>
                <li>Messages are visible to conversation participants. Event album threads may be visible to other attendees of that event.</li>
                <li>You can block or report users. We review reports under our Community Standards and may remove content or restrict accounts. Automated classifiers may scan uploaded images for prohibited content; voice notes and text are primarily moderated reactively via user reports.</li>
                <li>This section covers in-app chat. SMS/text messages with carriers are covered separately in Section 2.8 and Terms §12.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.10 Music Match (Spotify / Apple Music)</h4>
              <p className="text-gray-400 mb-3">
                Music Match is an optional feature. If you connect Spotify or Apple Music, we receive listening-history and taste signals (for example artists, genres, and related metadata available via that provider&apos;s APIs) solely to score how well your music taste overlaps with events and to help rank or recommend matches. We do not post to your music accounts.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                <li>Connection is affirmative opt-in via the provider&apos;s OAuth flow.</li>
                <li>You may disconnect at any time; disconnecting deletes your Music Match profile/taste data stored by PXI.</li>
                <li>Music providers process your account data under their own privacy policies when you authorize the connection.</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. How We Use Your Information</h3>
          <p className="text-gray-400 mb-4">We use your information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-400">
            <li>Providing and operating the Services (account creation, event access, album grouping, photo matching, ticketing, payouts).</li>
            <li>Running the Event Lock: computing your Haversine proximity to an event venue to unlock albums.</li>
            <li>Biometric photo matching: identifying photos you appear in at events you attend (opt-in only; enrollment frames processed to create vectors that are stored; raw enrollment images discarded after processing).</li>
            <li>Operating in-app messaging, including voice notes you send to other users.</li>
            <li>Music Match: ranking events and social matches from listening taste you optionally connect (Spotify / Apple Music).</li>
            <li>Running the Odyssey gamification system: awarding XP, Stamps, and Leaderboard rankings.</li>
            <li>Processing ticket purchases, distributing payouts to vendors via Stripe Connect.</li>
            <li>Personalizing your feed, event recommendations, and suggested connections based on attendance history.</li>
            <li>Safety, fraud prevention, and abuse detection (e.g., detecting spoofed GPS, fake tickets, account manipulation).</li>
            <li>Sending transactional communications: ticket confirmations, event reminders, payout notifications, and (where consented) SMS/MMS event and account alerts.</li>
            <li>Sending marketing communications by email or SMS (only with your explicit opt-in for that channel; unsubscribe available at any time via email Unsubscribe links or by replying STOP to SMS).</li>
            <li>Complying with legal obligations, responding to law enforcement requests, enforcing our Terms.</li>
            <li>Improving the platform through aggregated, anonymized analytics and A/B testing.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. How We Share Your Information</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white/90">4.1 With Other Users (by Design)</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li>Your profile photo, display name, and Odyssey rank are visible to users in shared event albums you join.</li>
                <li>Photos you upload to an Event Album are visible to other verified attendees of that event.</li>
                <li>The Wall (public archive): visible to all PXI users.</li>
                <li>The Vault: private (visible only to you).</li>
                <li>The Circle: ephemeral (visible only to your Circle contacts; auto-deleted after 24 hours).</li>
                <li>Hype Gate content: visible only to ticket-verified pre-event attendees.</li>
                <li>Photos you are tagged in remain visible to album participants even after you leave the album. You may request removal by contacting privacy@pxispace.com.</li>
                <li>Screenshots: we may notify the relevant album host when another user takes a screenshot within a private album.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">4.2 With Vendors and Hosts</h4>
              <p className="text-gray-400">When you purchase a ticket or join a host-created event album, the host receives: your RSVP status, display name, and check-in confirmation. Hosts are contractually bound by PXI's Vendor Agreement and may only use your data in connection with their event. Hosts may NOT sell or license your personal data to third parties.</p>
            </div>

            <div className="p-4 bg-legal-hub-surface/30 border border-legal-hub-border rounded-lg">
              <h4 className="text-white font-semibold mb-2">4.3 With Sub-Licensed Parties (Vendor Sub-Licensing)</h4>
              <p className="text-sm text-gray-400 mb-3">When you grant PXI a license to your content, PXI may sub-license that content to: a) Event Vendors/Hosts: for the specific event album you participated in; b) Staff delegated by the Host (Co-hosts, Photographers) under a sub-license tied strictly to that event; c) PXI's service providers (Cloudflare, cloud storage) as technically necessary to deliver the Services.</p>
              <p className="text-sm text-gray-400">Limitations: Sub-licenses to Vendors are SCOPED and expire when the event album closes or the Vendor's account is terminated. Vendors may NOT sub-license your content to unaffiliated third parties (e.g., ad agencies, data brokers). Vendors may NOT use your content for purposes beyond event documentation and promotion without your separate written consent. PXI does NOT sub-license your content for advertising or AI training purposes without separate explicit consent.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">4.4 With Service Providers</h4>
              <p className="text-gray-400">Stripe, Inc. (payments), Cloudflare (Edge middleware, CDN, R2 storage for photos, videos, and voice notes), facial geometry processing on PXI servers for Face Matching, Analytics providers (aggregated, non-PII data only), music platform APIs when you connect Music Match (Spotify / Apple Music), and SMS/Push notification providers (including Twilio, Inc., which processes mobile numbers and message content solely to deliver messages on our behalf).</p>
              <p className="text-gray-400 mt-3 text-sm border-l-2 border-legal-hub-accent pl-4">
                <strong className="text-white">SMS consent &amp; mobile numbers — no third-party marketing sharing:</strong> Mobile phone numbers collected for SMS/text messaging, and the associated opt-in consent records, will not be shared, sold, rented, or otherwise disclosed to third parties, affiliates, or any other entities for those parties&apos; marketing or promotional purposes. We share mobile numbers only with our SMS delivery provider as a data processor necessary to transmit messages you requested, or when required by applicable law.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">4.5 Legal Obligations & Business Transfers</h4>
              <p className="text-gray-400">We may disclose your information: (i) as required by law, court order, or valid legal process; (ii) to protect the safety of users or the public; (iii) in connection with a merger, acquisition, or sale of assets (with reasonable prior notice to users).</p>
            </div>

            <div className="p-4 bg-legal-hub-surface/30 border border-legal-hub-border rounded-lg">
              <h4 className="text-white font-semibold mb-2">4.6 No Sale of Personal Data; Mobile Information</h4>
              <p className="text-sm text-gray-400">We do not sell personal information. We do not sell, rent, or share mobile phone numbers or SMS consent data with third parties or affiliates for marketing or promotional purposes. Message and data rates may apply to SMS communications. Message frequency varies as described in Section 2.8.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">5. Data Retention</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-400">
            <li><strong className="text-white">Account data:</strong> Until account deletion + 30-day grace period.</li>
            <li><strong className="text-white">Event album photos (The Wall):</strong> Indefinite (public archive) unless deleted by user.</li>
            <li><strong className="text-white">The Circle content:</strong> 24 hours from upload (auto-deleted).</li>
            <li><strong className="text-white">The Vault content:</strong> Until manually deleted by user.</li>
            <li><strong className="text-white">Hype Gate content:</strong> Deleted at event start time.</li>
            <li><strong className="text-white">Biometric vectors:</strong> Until consent revoked, account deletion, or 3 years from last interaction — whichever is earliest.</li>
            <li><strong className="text-white">In-app messages &amp; voice notes:</strong> Retained for the life of the conversation or until deleted by participants / account deletion, subject to legal holds and safety investigations.</li>
            <li><strong className="text-white">Music Match taste profiles:</strong> Until you disconnect Music Match or delete your account.</li>
            <li><strong className="text-white">Location data (Event Lock):</strong> Deleted after proximity / clustering computation; aggregate metadata up to 90 days.</li>
            <li><strong className="text-white">Payment and ticketing records:</strong> 7 years (tax/legal/compliance requirements).</li>
            <li><strong className="text-white">Usage and analytics data:</strong> 24 months rolling.</li>
            <li><strong className="text-white">Odyssey/XP/Stamp data:</strong> For the life of your account; deleted upon account deletion.</li>
            <li><strong className="text-white">Vendor payout and chargeback records:</strong> 7 years.</li>
            <li><strong className="text-white">SMS/messaging logs:</strong> 3 years (TCPA compliance).</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">6. Your Privacy Rights</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-white/90">6.1 All Users</h4>
              <p className="text-gray-400">Access and download a copy of your data: Settings &gt; Privacy &gt; Download My Data. Correct inaccurate profile data at any time within Settings. Delete your account and associated data: Settings &gt; Account &gt; Delete Account. Revoke biometric consent: Settings &gt; Apps &gt; Face Matching. Disconnect Music Match from the Music Match / music connect screen or Settings. Opt out of marketing email: Settings &gt; Notifications &gt; Marketing, or click Unsubscribe in any email. Opt out of SMS at any time by replying <strong className="text-white">STOP</strong> to a PXI text message, or via Settings &gt; Notifications &gt; SMS; reply <strong className="text-white">HELP</strong> for SMS help. Report content or request removal of tagged photos: In-app report button or privacy@pxispace.com.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">6.2 California Residents (CCPA / CPRA)</h4>
              <p className="text-gray-400">California residents have the right to: Know, Access, Delete, Correct, Opt-Out of Sale/Sharing, and Limit Use of Sensitive Personal Data. <strong className="text-white">We do not sell personal data for money.</strong> We do use advertising cookies from Google, Meta, TikTok and X for remarketing and conversion measurement, which counts as &ldquo;sharing&rdquo; for cross-context behavioral advertising under the CPRA. To opt out, use the <strong className="text-white">Cookie settings</strong> link in the footer of any page, or send a Global Privacy Control signal from your browser — we honour GPC automatically. Biometric data is Sensitive Personal Data under CPRA, is collected only with explicit consent, and is never used for advertising. Submit any other request to privacy@pxispace.com with subject line: CCPA Request.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">6.3 EU / UK Residents (GDPR)</h4>
              <p className="text-gray-400">EU/UK residents have rights to: Access, Rectification, Erasure, Restriction of Processing, Data Portability, Objection, and the right to lodge a complaint with your local Supervisory Authority. Legal bases for PXI's processing: contractual necessity, legitimate interest, and consent. Contact privacy@pxispace.com or our EU/UK data representative.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">7. Payment Security</h3>
          <p className="text-gray-400 leading-relaxed">
            All payment data is processed directly by Stripe, Inc. PXI does not store raw credit card numbers, CVV codes, full bank account numbers, or payment method data on its servers. PXI uses Stripe Connect Destination Charges, meaning funds flow from the consumer to Stripe directly, with automated reconciliation and payout to Vendors. By using ticketing features, you also accept Stripe's Terms of Service and Privacy Policy.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">8. Children's Privacy</h3>
          <p className="text-gray-400 leading-relaxed">
            PXI is not directed to children under 16 years of age. We do not knowingly collect personal data from users under 16. If we become aware of such collection, we will delete it promptly. Age eligibility is verified at account creation via date of birth. Users between 16 and 17 require parental/guardian consent. Contact privacy@pxispace.com if you believe a minor's data has been collected.
          </p>
        </div>

        <div className="pt-8 border-t border-legal-hub-border">
          <h3 className="text-xl font-bold mb-3 text-white">9. Contact Information</h3>
          <p className="text-gray-400">
            Privacy inquiries: <span className="text-legal-hub-accent">privacy@pxispace.com</span><br />
            Legal inquiries: <span className="text-legal-hub-accent">legal@pxispace.com</span><br />
            In-app: Settings &gt; Help &gt; Privacy<br />
            Mailing address: PXI LABS LLC, 5850 Town and Country Blvd, Suite 403, Frisco, TX 75034.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    tldr: "PXI is a platform for real, in-person moments. Use it honestly. Don't fake locations, spam uploads, or manipulate the gamification system. You own your content; we need a license to show it. Vendors are responsible for their events and their teams. Breaking these rules gets you removed.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. Acceptance of Terms</h3>
          <p className="leading-relaxed">By creating a PXI account, accessing the Services, purchasing a ticket, or uploading content, you agree to these Terms of Service, our Privacy Policy, Cookie Policy, and Community Standards (together, the "User Agreement"). Material changes will be communicated via in-app notification and/or email at least 14 days before taking effect. Continued use of PXI after the effective date constitutes acceptance.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Eligibility</h3>
          <p className="leading-relaxed">You must be at least 16 years old to use PXI. Users aged 16-17 require parental/guardian consent. You may not use PXI if your account has been previously terminated, you are in a prohibited jurisdiction, or you are subject to applicable sanctions (OFAC SDN list or equivalent).</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. Account Tiers & Identity</h3>
          <p className="mb-4">PXI operates a tiered identity model:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Tier 1 — Partial Account (phone-verified):</strong> Browse events, discover content, view public Wall.</li>
            <li><strong className="text-white">Tier 2 — PXI Citizen (full profile completed):</strong> Post content, join albums, earn XP and Stamps, access The Vault and The Circle.</li>
            <li><strong className="text-white">Tier 3 — Verified Vendor/Host:</strong> Create and publish events, sell tickets, manage event albums, delegate Staff roles, receive payouts via Stripe Connect.</li>
          </ul>
          <p className="mt-4">Account security: You are responsible for maintaining the security of your PASETO session. One account per person: We reserve the right to merge or terminate duplicate accounts.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. The Platform License</h3>
          <p className="leading-relaxed">PXI grants you a personal, non-commercial, non-transferable, non-exclusive, revocable license to access and use the Services. You may not copy, reverse-engineer, scrape, or access PXI through unauthorized means.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">5. Intellectual Property</h3>
          <p className="leading-relaxed">PXI's intellectual property includes: the platform, UI/UX design, the Analog Engine shader suite (ZSL, Halation, Film Grain algorithms), the Odyssey system architecture, the Event Lock spatial algorithm, the PASETO-based identity system, trademarks, and brand assets. "PXI," "PXIStudio," "Odyssey," "The Event Lock," "Hype Gate," "The Wall," "The Vault," and "The Circle" are trademarks of PXI LABS LLC.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">6. Your Content & The License You Grant PXI</h3>
          <p className="leading-relaxed mb-4">You own your content. PXI does not claim ownership of photos, videos, captions, voice notes, or other original media you upload or send.</p>
          <p className="leading-relaxed mb-4">By uploading content, you grant PXI a worldwide, non-exclusive, royalty-free, perpetual, transferable, and sub-licensable license to: use, store, display, reproduce, modify (including applying Analog Engine filters), distribute, and make available your content, solely for operating the Services, improving the Services, and promoting PXI (with attribution; opt-out available).</p>
          <p className="leading-relaxed">Analog Engine: PXI applies proprietary shader filters. The original unprocessed image remains yours. The rendered output incorporating PXI's Analog Engine aesthetic layer embeds PXI's IP in the filter processing only.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">7. The Odyssey Gamification System</h3>
          <p className="leading-relaxed mb-4">PXI's Odyssey system awards XP, Stamps (Bronze &gt; Silver &gt; Gold &gt; Platinum &gt; Legendary), and Leaderboard rankings based on authentic event participation.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">XP and Stamps have no cash value:</strong> They are non-transferable and confer no legal rights.</li>
            <li><strong className="text-white">Anti-gaming policy:</strong> PXI reserves the right to revoke XP and Stamps if we determine manipulation occurred (spoofed GPS, botting, coordinated inauthentic uploads). PXI's determination is final.</li>
            <li><strong className="text-white">Leaderboard data is public</strong> within your event community and updates in real-time.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">8. Event Albums</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Hype Gate:</strong> Visible only to ticket-verified, location-confirmed pre-event attendees. Auto-deleted at event start.</li>
            <li><strong className="text-white">Live Album:</strong> Active during event window. Archived to The Wall after event closes.</li>
            <li><strong className="text-white">Grace Time:</strong> A post-event upload window set by the Host (typically 24-72 hours).</li>
            <li><strong className="text-white">The Wall:</strong> Permanent public archive visible to all PXI users.</li>
            <li><strong className="text-white">The Vault:</strong> Private archive visible only to you.</li>
            <li><strong className="text-white">The Circle:</strong> Ephemeral. Visible only to Circle contacts. Auto-deletes after 24 hours.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">9. Event Host Delegation & Staff Roles</h3>
          <p className="leading-relaxed mb-4">Tier 3 Hosts may delegate roles via the Staffing Portal: Co-host (full access), Photographer (media upload/download rights), Promoter (marketing tools), Bouncer (real-time moderation — requires Staff token).</p>
          <p className="leading-relaxed">Host liability: Hosts are fully responsible for all actions taken by their delegated staff. PXI is not liable for the actions of Host-delegated staff.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">10. Ticketing & Payments</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-white/90">10.1 For Attendees (Ticket Buyers)</h4>
              <p>Ticket purchases are final unless host policy permits refunds or event is cancelled. A Platform Service Fee ($0.99 flat per ticket, deducted from the organizer payout) and a Consumer Variable Fee (5.49% of ticket face value, paid by the buyer) are charged per transaction. All sales are in USD.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">10.2 For Vendors (Event Hosts)</h4>
              <p>Fee structure: Consumer Variable Fee (5.49% of ticket face value, paid by the buyer) and Platform Service Fee ($0.99 flat per ticket, deducted from the organizer payout). Payouts via Stripe Connect typically within 2–5 business days after the event, subject to Stripe processing. Vendors are responsible for chargebacks, refunds, and taxes.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">11. In-App Messaging &amp; Voice Notes</h3>
          <p className="leading-relaxed mb-4">
            PXI provides direct messages, group chats, and event album threads. By sending messages you agree that recipients (and, for event threads, other event attendees with access) may view that content. Voice notes are user-generated audio recordings stored so recipients can play them.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not send illegal, harassing, exploitative, or non-consensual intimate content. Community Standards apply to all chat and voice notes.</li>
            <li>You can block and report users. We may remove content, suspend accounts, and preserve data for safety or legal process.</li>
            <li>PXI is not responsible for messages sent by other users. Report abuse in-app or contact trust@pxispace.com.</li>
            <li>This section covers in-app chat. Carrier SMS is governed by Section 12 below.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">12. The Messaging Service (SMS Program Terms)</h3>
          <p className="leading-relaxed mb-4">
            Hosts may use the Messaging Service to communicate with attendees. All use must comply with the Telephone Consumer Protection Act (TCPA), CAN-SPAM, CASL, carrier A2P 10DLC rules, and these Terms. Informational and transactional messages may be sent to registered attendees in connection with an event they joined; marketing or promotional SMS requires a separate affirmative opt-in. PXI may monitor, throttle, or suspend Messaging Service usage for compliance, abuse prevention, or carrier requirements.
          </p>
          <div className="space-y-4 p-5 bg-legal-hub-surface border border-legal-hub-border rounded-xl text-sm">
            <p>
              <strong className="text-white">Program name:</strong> PXI SMS Program (operated by PXI LABS LLC / PXIStudio).
            </p>
            <p>
              <strong className="text-white">Description:</strong> By providing your mobile number and opting in, you agree to receive SMS and/or MMS messages from PXI and, where applicable, on behalf of Event Hosts. Message types may include: account verification (OTP), ticket and event confirmations, check-in and schedule alerts, host announcements related to events you joined, customer support replies, and — only if you separately opt in to marketing — promotional or campaign messages. Consent is not a condition of any purchase.
            </p>
            <p>
              <strong className="text-white">How to opt in:</strong> You opt in by affirmatively agreeing to SMS disclosures in the PXI app or on pxispace.com (for example, checking an unchecked consent box or enabling SMS in Settings), or by other methods we describe at the point of collection. Pre-checked boxes are not used. Providing a number solely for account verification does not constitute marketing consent.
            </p>
            <p>
              <strong className="text-white">Opt-out:</strong> You can cancel the SMS Program at any time. Reply <strong className="text-white">STOP</strong> to any message you receive from us. After you send STOP, we will send one confirmation SMS that you have been unsubscribed, and you will no longer receive SMS messages from the PXI SMS Program. You may also disable SMS in Settings &gt; Notifications. To re-join, opt in again through the app or website.
            </p>
            <p>
              <strong className="text-white">Help:</strong> For assistance with the messaging program, reply <strong className="text-white">HELP</strong> to any PXI SMS, or contact support@pxispace.com. Supported carriers include major US wireless carriers; delivery is not guaranteed on all networks.
            </p>
            <p>
              <strong className="text-white">Rates &amp; frequency:</strong> Message and data rates may apply for any messages sent to you from us and to us from you. Message frequency varies based on your account activity, events joined or hosted, and marketing selections. If you have questions about your text or data plan, contact your wireless provider.
            </p>
            <p>
              <strong className="text-white">Privacy:</strong> Mobile information will not be shared with third parties or affiliates for their marketing or promotional purposes. See our Privacy Policy (Section 2.8 and Section 4.4) at{' '}
              <Link href="/privacy" className="text-legal-hub-accent underline underline-offset-2">pxispace.com/privacy</Link>.
            </p>
            <p>
              <strong className="text-white">Host obligations:</strong> Event Hosts who use the Messaging Service must only message attendees with a lawful basis (transactional for the event, or marketing only with documented opt-in), must not send prohibited content, and must honor STOP immediately. Hosts may not export attendee phone numbers for off-platform SMS marketing.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">13. Prohibited Conduct</h3>
          <p className="mb-4">Strictly prohibited: GPS spoofing, fake accounts, ticket fraud, uploading content you don't own, botting, reverse-engineering shaders, and sending unsolicited marketing messages.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">14. Enforcement & Termination</h3>
          <p className="leading-relaxed">PXI reserves the right to remove content, issue warnings, suspend or ban accounts, and report illegal activity to law enforcement. Appeals must be submitted within 30 days to legal@pxispace.com.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">15. Disclaimers & Limitation of Liability</h3>
          <p className="leading-relaxed">Services provided "AS IS". PXI disclaims all warranties. Total liability shall not exceed the greater of $100 USD or the amount you paid PXI in the preceding 12 months.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">16. Indemnification</h3>
          <p className="leading-relaxed">You agree to defend and indemnify PXI from claims arising from your violation of these Terms, your content, or your operation of events.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">17. Dispute Resolution & Arbitration</h3>
          <p className="leading-relaxed">Binding individual arbitration via JAMS. You waive your right to a jury trial or class action. Governing law: Commonwealth of Massachusetts. Venue: Suffolk County, Massachusetts.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">18. General Provisions</h3>
          <p className="leading-relaxed">Entire agreement, severability, no waiver, and force majeure clauses apply.</p>
        </div>
      </div>
    )
  },
  {
    id: 'community',
    title: 'Community Standards',
    tldr: "PXI exists to capture real moments at real events with real people. These standards protect the party. They exist to keep the space authentic, safe, and fun. Violating them gets you removed — temporarily or permanently depending on severity.",
    content: (
      <div className="space-y-8 text-gray-400">
        <p className="italic">PXI is built on a simple principle: if you would not want someone doing it to you at a party, don’t do it on PXI.</p>
        
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. Authenticity & Honest Use</h3>
          <p>No GPS spoofing, no fake events, no deepfakes, and no presenting others' experiences as your own. PXI is for genuine, in-person moments.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Respect & Anti-Harassment</h3>
          <p>Zero tolerance for bullying, abuse, or threats. Misgendering, deadnaming, or using slurs to target individuals is strictly prohibited. Coordinated harassment campaigns are also banned.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. Privacy & Consent</h3>
          <p>No doxxing (sharing non-public personal info). No photos in private spaces (bathrooms, changing rooms). No sharing Circle content outside PXI. No surveillance or tracking of others&apos; location without knowledge. Do not record or send voice notes that capture private conversations without consent of the people involved.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. Sexual Content & Non-Consensual Imagery</h3>
          <p>Explicit sexual content prohibited in public spaces. Non-consensual intimate imagery ("revenge porn") is a zero-tolerance violation and will be reported to law enforcement.</p>
        </div>

        <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-3 text-red-500">5. Child Safety (Zero Tolerance)</h3>
          <p className="leading-relaxed mb-4">Absolute zero tolerance for child sexual abuse material (CSAM) or any content that exploits, endangers, or sexualizes minors. Any such content will be immediately removed and reported to NCMEC CyberTipline and law enforcement.</p>
          <p className="text-sm text-red-400/80">This includes: grooming, solicitation of minors, sharing CSAM, or organizing events targeting minors for predatory purposes.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">6. Hateful Content & Discrimination</h3>
          <p>No content promoting hatred, violence, or discrimination based on race, religion, gender, sexual orientation, disability, etc. Slurs and hate symbols are prohibited.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">7. Violence, Threats & Dangerous Content</h3>
          <p>No threats of violence or glorification of real-world violence. No graphic violent content. No promotion of self-harm or suicide. If you are in crisis, call or text 988.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">8. Illegal Activity & Prohibited Event Content</h3>
          <p>No facilitation of drug distribution, underage drinking, fraud, phishing, or scams. No listing of counterfeit tickets. No events in restricted jurisdictions (OFAC-listed regions).</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">9. Intellectual Property & Copyright</h3>
          <p>No infringing content. PXI responds to DMCA notices via <span className="text-legal-hub-accent">dmca@pxispace.com</span>. Counter-notices may be submitted to the same address.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">10. Spam & Platform Manipulation</h3>
          <p>No coordinated inauthentic behavior, XP farming, or spamming other users. No artificially inflating Odyssey rank or creating fake events for XP.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">11. Event Etiquette (Hosts & Attendees)</h3>
          <p className="mb-4"><strong>For Hosts:</strong> Event listings must be accurate. Honor ticket commitments. No transferring attendee data to third parties. Responsible for staff behavior.</p>
          <p><strong>For Attendees:</strong> Do not share access codes or ticket QR codes with non-attendees. Respect the event space and other attendees' privacy.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">12. Reporting Violations</h3>
          <p>Use in-app report buttons or contact <span className="text-legal-hub-accent">trust@pxispace.com</span>. Include violation description, username/content, and screenshots. Action for zero-tolerance violations within 24 hours.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">13. Enforcement Levels</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Level 1 — Warning:</strong> Content removed, user notified.</li>
            <li><strong className="text-white">Level 2 — Temporary Suspension:</strong> 24 hours to 30 days.</li>
            <li><strong className="text-white">Level 3 — Permanent Ban:</strong> Severe or repeated violations, fraud.</li>
            <li><strong className="text-white">Level 4 — Legal Action:</strong> Cooperation with law enforcement for zero-tolerance violations.</li>
          </ul>
          <p className="mt-4">Appeals: Contact trust@pxispace.com within 30 days of enforcement action.</p>
        </div>
      </div>
    )
  },
  {
    id: 'cookie',
    title: 'Cookie Policy',
    tldr: "We use essential cookies to keep the app working, Google Analytics to understand how you use it, and advertising cookies from Google, Meta, TikTok and X that do follow you to other sites and apps to show you PXI ads. We never sell cookie data. “Cookie settings” in the footer turns the optional ones off, in any country, at any time.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. What Are Cookies?</h3>
          <p className="leading-relaxed">Cookies are small text files placed on your device. Similar technologies include pixel tags, local storage, device identifiers (IDFA/GAID), and pre-signed URL tokens (Cloudflare R2 tokens used for media delivery authentication).</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. The Cookies We Use</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.1 Strictly Necessary (Always Active)</h4>
              <p className="text-sm mb-2">These cannot be switched off — without them you cannot stay signed in or pay.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><code className="text-legal-hub-accent">pxi_paseto</code>: your signed-in session (PASETO v4 token). HttpOnly, Secure, SameSite=Lax. Cleared when you log out.</li>
                <li><code className="text-legal-hub-accent">__stripe_mid</code> / <code className="text-legal-hub-accent">__stripe_sid</code>: set by Stripe for payment fraud prevention, and only on pages where you are checking out.</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.2 Analytics</h4>
              <p className="text-sm"><code className="text-legal-hub-accent">_ga</code> and <code className="text-legal-hub-accent">_ga_&lt;id&gt;</code>, set by Google Analytics 4, to count visitors and understand which pages and features get used. Google Analytics 4 does not log or store IP addresses, and we do not send it your name, email, or phone number.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.3 Advertising</h4>
              <p className="text-sm">We do use advertising cookies. They let us measure which ads lead to signups and ticket sales, and let us show PXI ads to you on other websites and apps (remarketing). None of them are set unless you have consented — see 2.7.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm mt-2">
                <li><strong className="text-white/90">Google Ads.</strong> <code className="text-legal-hub-accent">_gcl_au</code> (conversion linker), plus cookies set by <code className="text-legal-hub-accent">googletagmanager.com</code> and <code className="text-legal-hub-accent">doubleclick.net</code>.</li>
                <li><strong className="text-white/90">Meta (Facebook and Instagram).</strong> <code className="text-legal-hub-accent">_fbp</code> (a browser identifier Meta uses to recognise you across sites) and <code className="text-legal-hub-accent">_fbc</code> (recorded only if you arrived from a Meta ad). These are what allow a PXI ad to reach you on Instagram or Facebook after you have visited this site.</li>
                <li><strong className="text-white/90">TikTok.</strong> <code className="text-legal-hub-accent">_ttp</code> and <code className="text-legal-hub-accent">_tt_enable_cookie</code>, used the same way for ads on TikTok.</li>
                <li><strong className="text-white/90">X (Twitter).</strong> <code className="text-legal-hub-accent">personalization_id</code> and <code className="text-legal-hub-accent">muc_ads</code>.</li>
              </ul>
              <p className="text-sm mt-2">When you buy a ticket we may send Google a <strong>hashed, irreversible</strong> (SHA-256) version of your email address and phone number so a conversion can be matched to an ad click. The hashing happens in your browser: Google receives only the digest, never the address or number itself. This is skipped entirely if you have opted out. <strong className="text-white">We do not send your email address or phone number to Meta, TikTok or X in any form, hashed or otherwise.</strong></p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.4 Campaign Attribution (First-Party)</h4>
              <p className="text-sm"><code className="text-legal-hub-accent">pxi_attribution</code>, set by us and readable only by us, stores for up to 90 days the campaign tags and ad-click identifiers (<code className="text-legal-hub-accent">utm_*</code>, <code className="text-legal-hub-accent">gclid</code>, <code className="text-legal-hub-accent">gbraid</code>, <code className="text-legal-hub-accent">wbraid</code>, <code className="text-legal-hub-accent">fbclid</code>, <code className="text-legal-hub-accent">ttclid</code>, <code className="text-legal-hub-accent">twclid</code>, <code className="text-legal-hub-accent">msclkid</code>) plus the site that referred you, so we can tell which campaign brought you to PXI. It is written only if you have not opted out.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.5 Local Storage</h4>
              <p className="text-sm">Not cookies, but stored on your device the same way: <code className="text-legal-hub-accent">pxi_consent_v2</code> (your cookie choice — necessary, since it is how we remember to stop), <code className="text-legal-hub-accent">pxi_user</code> (your profile, cached so the app can render while signed in), and <code className="text-legal-hub-accent">pxi_pending_deeplink</code> (the page you were heading to before being asked to log in).</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.6 Third Parties</h4>
              <p className="text-sm">Google (Analytics, Ads, Tag Manager), Meta Platforms, TikTok, X Corp. and Stripe (payments) set cookies under their own privacy policies, and the four advertising partners may combine what they learn here with data they already hold about you on their own platforms. Cloudflare R2 stores and delivers event media for us, and Netlify hosts this website; neither sets advertising cookies on you here.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.7 Your Choices</h4>
              <p className="text-sm">Use the <strong>Cookie settings</strong> link in the footer of any page on pxispace.com. It works in every country, whether or not you were shown a banner, and you can change your answer as often as you like. Choosing <strong>Reject all</strong> switches off analytics and advertising storage, tells Meta and TikTok to stop collecting immediately, and deletes the cookies named in 2.3 and 2.4 that we are able to remove (<code className="text-legal-hub-accent">pxi_attribution</code>, <code className="text-legal-hub-accent">_fbp</code>, <code className="text-legal-hub-accent">_fbc</code>, <code className="text-legal-hub-accent">_ttp</code>, <code className="text-legal-hub-accent">_tt_enable_cookie</code>, <code className="text-legal-hub-accent">personalization_id</code>, <code className="text-legal-hub-accent">muc_ads</code>). Everything in 2.1 stays, and the site works exactly the same.</p>
              <p className="text-sm mt-2">If you are in the EEA, the UK, or Switzerland, nothing in 2.2–2.4 is set until you accept: those categories start denied and we ask you on your first visit.</p>
              <p className="text-sm mt-2">You can also clear or block cookies in your browser settings, though that will sign you out.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.8 Global Privacy Control &amp; Do Not Track</h4>
              <p className="text-sm">We honour the <strong>Global Privacy Control</strong> (GPC) signal. If your browser or extension sends it, we treat it as an opt-out of analytics and advertising storage — including as a request to opt out of “sale” or “sharing” under the CCPA/CPRA — without you having to do anything else. We treat a legacy <code className="text-legal-hub-accent">DNT: 1</code> header the same way. If you later press <strong>Accept all</strong> in our banner, that explicit choice takes precedence for this site.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. Contact Us About This Cookie Policy</h3>
          <p>Email: <span className="text-legal-hub-accent">privacy@pxispace.com</span><br />
          On the web: the <strong>Cookie settings</strong> link in the footer of any page<br />
          Mail: PXI LABS LLC, 5850 Town and Country Blvd, Suite 403, Frisco, TX 75034</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. Updates to This Cookie Policy</h3>
          <p className="leading-relaxed">We may update this policy periodically. Significant changes will be notified on the platform. Last Updated: August 5, 2026.</p>
        </div>
      </div>
    )
  },
  {
    id: 'child-safety',
    title: 'Child Safety',
    tldr: "Zero tolerance for CSAM and child exploitation of any kind. Every piece of content is scannable. Every account is age-gated. Any violation means immediate removal, permanent ban, and a report to NCMEC and law enforcement.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-3 text-red-400">Zero Tolerance for CSAE</h3>
          <p className="leading-relaxed mb-4">
            PXI Studio has an absolute zero-tolerance policy toward child sexual abuse and exploitation (CSAE)
            in any form — including child sexual abuse material (CSAM), grooming, solicitation of minors, and
            any activity that sexually exploits or endangers children.
          </p>
          <p className="leading-relaxed">
            Any content or behaviour that violates this policy results in immediate account termination,
            content removal, and mandatory reporting to the{' '}
            <strong className="text-white">NCMEC CyberTipline</strong> and relevant law enforcement.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">In-App Reporting</h3>
          <p className="leading-relaxed mb-4">
            Every profile and piece of content has a built-in <strong className="text-white">Report</strong> button
            (••• menu or long-press). Child safety reports are reviewed within 24 hours; zero-tolerance violations
            are acted upon immediately.
          </p>
          <p>
            Direct email: <span className="text-legal-hub-accent">trust@pxispace.com</span>
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">Moderation &amp; Enforcement</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Proactive detection:</strong> Automated scanning for known CSAM hashes is applied to all uploaded media.</li>
            <li><strong className="text-white">Human review:</strong> Flagged content is reviewed by Trust &amp; Safety before any reinstatement decision.</li>
            <li><strong className="text-white">Permanent ban:</strong> Confirmed violators are permanently terminated and device-fingerprinted to prevent re-registration.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">Age Eligibility</h3>
          <p className="leading-relaxed">
            PXI requires all users to be at least <strong className="text-white">16 years old</strong>. Date of birth is
            verified at account creation. We do not knowingly allow children under 16; accounts discovered to be underage
            are suspended immediately and their data deleted.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">Legal Compliance</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>18 U.S.C. § 2258A — mandatory NCMEC reporting</li>
            <li>PROTECT Our Children Act</li>
            <li>COPPA</li>
            <li>UK Online Safety Act (child safety provisions)</li>
          </ul>
          <p className="mt-4">
            We cooperate fully with law enforcement and preserve evidence upon receipt of valid legal process.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">Designated Contact</h3>
          <p>
            Child safety inquiries and law enforcement liaison:{' '}
            <span className="text-legal-hub-accent">natan@pxispace.com</span> /{' '}
            <span className="text-legal-hub-accent">trust@pxispace.com</span>
          </p>
          <p className="mt-2">
            Full standalone policy: <span className="text-legal-hub-accent">pxispace.com/child-safety</span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'vendor',
    title: 'Vendor Agreement',
    tldr: "Clear cuts, automated payouts via Stripe, and transparent liability for your staff. You run the show, we provide the tools.",
    content: (
      <div className="space-y-8 text-gray-400">
        <p className="italic">This Agreement governs the relationship between PXI LABS LLC and any individual or organization who uses PXI's platform to create events, sell tickets, or receive payments.</p>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. Vendor Eligibility & Account Requirements</h3>
          <p className="leading-relaxed">Must be 18+, have a verified Tier 3 account, complete identity verification via Stripe, agree to Stripe's Connected Account Agreement, and maintain a valid bank account for electronic transfers.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Fee Structure & Payment Processing</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.1 Fee Breakdown</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong className="text-white">Platform Service Fee:</strong> $0.99 flat per ticket, deducted from the organizer payout.</li>
                <li><strong className="text-white">Consumer Variable Fee:</strong> 5.49% of ticket face value, paid by the buyer at checkout.</li>
                <li><strong className="text-white">Stripe Processing Fee:</strong> Standard Stripe fees (typically 2.9% + $0.30).</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.2 Free Events</h4>
              <p className="text-sm">Events with a $0.00 ticket price are not subject to PXI platform fees.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.3 Payout Schedule</h4>
              <p className="text-sm">Funds disbursed via Stripe Connect typically within 2–5 business days after the event, subject to Stripe processing. PXI does not hold funds beyond processing needs.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. Refund & Cancellation Policy</h3>
          <div className="space-y-4 text-sm">
            <p><strong>3.1 Vendor-Initiated Cancellations:</strong> Full refunds required for attendees. Platform fees are non-refundable to the Vendor.</p>
            <p><strong>3.2 Attendee Refund Requests:</strong> Vendor is responsible for setting and honoring their refund policy. PXI does not process refunds for no-shows.</p>
            <p><strong>3.3 PXI-Initiated Removal:</strong> If PXI removes an event for violation, refunds are issued from held funds. Vendor may be liable for facilitation costs.</p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. Event Listing & Content Standards</h3>
          <p className="leading-relaxed">Vendors warrant that all event info is accurate, they have necessary permits/licenses, and comply with all laws (liquor laws, performance licenses, etc.). PXI may remove listings that violate standards without notice.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">5. Staffing Delegation & Permissions</h3>
          <p className="leading-relaxed mb-4">Roles: Co-Host (full admin), Photographer (media upload/download), Promoter (marketing tools), Bouncer (moderation — requires Staff token).</p>
          <p className="leading-relaxed mb-4"><strong>5.1 Host Liability:</strong> Event Hosts are fully responsible for all actions taken by delegated staff. PXI is not liable for staff behavior.</p>
          <p className="leading-relaxed mb-3"><strong>5.2 Messaging Service &amp; SMS Compliance:</strong> If you use PXI email or SMS campaigns / host messaging tools:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>You may only message attendees who registered for your event (or who separately opted in), and only for that event&apos;s transactional purpose unless marketing opt-in is documented.</li>
            <li>You must comply with TCPA, CAN-SPAM, CASL, and carrier A2P rules. PXI appends STOP language to SMS; you must not remove or circumvent opt-out mechanisms.</li>
            <li>You may not sell, rent, or transfer attendee phone numbers or SMS consent records to third parties for marketing.</li>
            <li>PXI may suspend Messaging Service access for complaints, carrier blocks, or suspected consent violations.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">6. Taxes & Compliance</h3>
          <p className="leading-relaxed">Vendors solely responsible for determining, collecting, and remitting all applicable taxes (sales tax, VAT, etc.). PXI may issue IRS Form 1099-K where required.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">7. Vendor Representations & Warranties</h3>
          <p className="leading-relaxed">You represent legal authority and compliance. Ticket fraud, money laundering, or providing false info results in immediate termination and referral to law enforcement.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">8. Limitation of Liability</h3>
          <p className="leading-relaxed">PXI not liable for indirect damages or harm occurring at your event. Liability capped at total fees paid to PXI in the preceding 3 months.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">9. Termination of Vendor Agreement</h3>
          <p className="text-sm"><strong>9.1 By Vendor:</strong> Contact support@pxispace.com. Does not relieve obligations for sold tickets.</p>
          <p className="text-sm"><strong>9.2 By PXI:</strong> Immediate termination for breach, fraud, or Stripe suspension. Funds may be withheld pending investigation.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">10. Governing Law & Dispute Resolution</h3>
          <div className="space-y-2 text-sm">
            <p><strong>10.1 Informal Resolution:</strong> Contact legal@pxispace.com first.</p>
            <p><strong>10.2 Binding Arbitration:</strong> Resolved by AAA in Delaware.</p>
            <p><strong>10.3 Class Action Waiver:</strong> Proceedings conducted on an individual basis only.</p>
            <p><strong>10.4 Governing Law:</strong> State of Delaware.</p>
          </div>
        </div>

        <div className="pt-8 border-t border-legal-hub-border">
          <p className="text-gray-500 text-sm">
            Last Updated: July 13, 2026<br />
            Contact: legal@pxispace.com | support@pxispace.com | trust@pxispace.com
          </p>
        </div>
      </div>
    )
  }
];

/**
 * Canonical URL for each document. /legal is the hub that carries all of them;
 * the four listed here also stand alone at their own path.
 *
 * SEO: /legal, /privacy and /terms used to render the SAME full hub — every
 * section, identical DOM — while each declared itself canonical and all three
 * sat in the sitemap. That is three URLs of duplicate content telling Google we
 * do not know our own canonicals. A `documentId` now scopes the page to one
 * document, so each URL is a distinct page that deserves its own listing.
 */
const SECTION_PATHS = {
  privacy: '/privacy',
  terms: '/terms',
  cookie: '/cookies',
  'child-safety': '/child-safety',
};

/** Standalone URL where one exists, otherwise the anchor inside the hub. */
const sectionHref = (id) => SECTION_PATHS[id] ?? `/legal#${id}`;

export default function LegalHubPage({ initialSection, documentId } = {}) {
  // Single-document mode: render only this section, and turn the section nav
  // into real links to the sibling documents.
  const single = SECTIONS.find((s) => s.id === documentId) ?? null;
  const visibleSections = single ? [single] : SECTIONS;

  const [activeSection, setActiveSection] = useState(
    SECTIONS.some((s) => s.id === initialSection) ? initialSection : SECTIONS[0].id
  );

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const observers = new Map();

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -75% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    SECTIONS.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
        observers.set(section.id, element);
      }
    });

    return () => {
      observers.forEach(element => observer.unobserve(element));
    };
  }, []);

  useEffect(() => {
    const scrollFromHash = () => {
      const hashId = window.location.hash.replace(/^#/, '');
      const id =
        (hashId && SECTIONS.some((s) => s.id === hashId) && hashId) ||
        (initialSection && SECTIONS.some((s) => s.id === initialSection) && initialSection) ||
        null;
      if (id) {
        scrollToSection(id);
      }
    };
    const t = window.setTimeout(scrollFromHash, 0);
    const t2 = window.setTimeout(scrollFromHash, 120);
    window.addEventListener('hashchange', scrollFromHash);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener('hashchange', scrollFromHash);
    };
  }, [scrollToSection, initialSection]);

  return (
    <div className="legal-hub min-h-screen bg-legal-hub-bg text-legal-hub-text selection:bg-legal-hub-accent selection:text-black">
      <header className="pt-6 pb-6 md:pt-8 md:pb-8 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto border-b border-legal-hub-border">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-4 text-[#E0E0E0]">
            The Legal Hub.
          </h1>
          <p className="text-lg md:text-xl text-[#AAAAAA] font-medium tracking-tight mb-3 italic">
            Transparent. Secure. Stateless.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-[#AAAAAA] uppercase tracking-widest">
            <span>Effective Date: 07/13/2026</span>
            <span>Jurisdiction: Frisco, Texas, USA</span>
            <span>Contact: legal@pxispace.com</span>
          </div>
        </motion.div>
      </header>

      {/* Mobile Navigation (Sticky) */}
      <div className="md:hidden sticky top-0 z-30 bg-legal-hub-bg/95 backdrop-blur pt-3 pb-2 border-b border-legal-hub-border">
        <div className="flex overflow-x-auto legal-hub-hide-scrollbar px-4 gap-4">
          {SECTIONS.map((section) => {
            const className = `whitespace-nowrap pb-1.5 text-base transition-all ${
              (single ? single.id === section.id : activeSection === section.id)
                ? 'font-bold text-white'
                : 'font-normal text-gray-500'
            }`;
            return single ? (
              <Link key={`mobile-${section.id}`} href={sectionHref(section.id)} className={className}>
                {section.title}
              </Link>
            ) : (
              <button
                key={`mobile-${section.id}`}
                onClick={() => scrollToSection(section.id)}
                className={className}
              >
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="flex flex-col md:flex-row gap-5 lg:gap-6">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-36 lg:w-44 shrink-0">
            <div className="sticky top-24 flex flex-col space-y-3">
              {SECTIONS.map((section) => {
                const className = `text-left transition-all text-sm lg:text-base ${
                  (single ? single.id === section.id : activeSection === section.id)
                    ? 'font-bold text-white'
                    : 'font-normal text-gray-500 hover:text-white'
                }`;
                return single ? (
                  <Link key={`desktop-${section.id}`} href={sectionHref(section.id)} className={className}>
                    {section.title}
                  </Link>
                ) : (
                  <button
                    key={`desktop-${section.id}`}
                    onClick={() => scrollToSection(section.id)}
                    className={className}
                  >
                    {section.title}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content Panel */}
          <div className="w-full md:flex-1 min-w-0 space-y-12 md:space-y-16 pb-16">
            {visibleSections.map((section) => (
              <section 
                key={section.id} 
                id={section.id}
                className="scroll-mt-24"
              >
                <div className="mb-6">
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4">
                    {section.title}
                  </h2>
                  
                  {/* TL;DR Box */}
                  <div className="bg-neon-card shadow-neon-card p-5 md:p-6 rounded-2xl mb-6 flex flex-col items-center justify-center text-center">
                    <h3 
                      className="font-black uppercase text-white text-2xl md:text-3xl leading-none mb-3 ghost-echo"
                      data-text="TL;DR"
                    >
                      TL;DR
                    </h3>
                    <p className="text-white/90 font-light text-base md:text-lg max-w-4xl">
                      {section.tldr}
                    </p>
                  </div>
                </div>

                <div className="max-w-none [&_strong]:text-white">{section.content}</div>
                
                <div className="mt-8 h-px w-full bg-gradient-to-r from-legal-hub-border via-legal-hub-border/50 to-transparent"></div>
              </section>
            ))}
          </div>

        </div>

        {/* CTA Card */}
        <section className="mt-24 mb-12">
          <div className="bg-neon-card shadow-neon-card p-10 md:p-16 rounded-[32px] flex flex-col items-center justify-center text-center">
            <h2
              className="font-black uppercase text-white text-5xl md:text-[80px] leading-[0.9] tracking-tight ghost-echo max-w-4xl"
              data-text={'HOST YOUR OWN\nPUBLIC EVENT'}
            >
              HOST YOUR OWN<br/>PUBLIC EVENT
            </h2>
            <p className="text-white/90 font-light text-lg md:text-xl mt-8 max-w-2xl">
              Ready to go viral? PXI gives you the power to market, ticket, and capture your events with professional precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full sm:w-auto">
              <Link
                href="/login?mode=signup&redirect=/dashboard/events/new"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
              >
                Create Event
              </Link>
              <IosDownloadLink
                href={PXI_APP_STORE_URL}
                className="inline-flex items-center justify-center bg-[rgba(20,10,30,0.75)] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[rgba(20,10,30,0.9)] transition-colors"
              >
                Download the app
              </IosDownloadLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
