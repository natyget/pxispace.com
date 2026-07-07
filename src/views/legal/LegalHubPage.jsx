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
    tldr: "We collect only what we need to run the party. Raw face scans never leave your device — only an encrypted, irreversible vector used to find your photos. Your location is checked once at ticket scan, not tracked continuously. You own your photos. We use military-grade stateless tokens instead of passwords. We never sell your data.",
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
              <p className="text-gray-400">When you create a PXI account, we collect: Phone number (E.164 format, used for OTP/SMS verification only; we do not store passwords), Display name and username, Date of birth (for age eligibility verification; birth year is never shared with other users), Optional: profile photo, biography, and social media handles, Optional: email address (for account recovery and legal notices).</p>
              <div className="mt-3 p-4 bg-legal-hub-surface rounded-lg border border-legal-hub-border">
                <p className="text-sm font-mono text-legal-hub-accent">Authentication: PXI uses PASETO v4 (public) tokens signed with Ed25519 for all session management. Tokens are cryptographically signed and encode your userId, role, and isVendor/isStaff status. No raw session UUIDs or passwords are stored server-side. Local encryption of sensitive payload data uses XChaCha20-Poly1305 with a 192-bit nonce.</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.2 Location Data — The Event Lock</h4>
              <p className="text-gray-400">To unlock event-specific photo albums, PXI uses a 4D spatial clustering algorithm (DBSCAN) that checks your latitude, longitude, altitude, and timestamp against a ~1km Haversine radius around the event venue. This location check occurs at ticket scan, optionally during Grace Time, and if you enable background mode, during a defined event window only (max 6 hours). We do NOT continuously track your background location. Aggregate spatial metadata may be retained for safety and fraud prevention for up to 90 days.</p>
            </div>

            <div className="bg-legal-hub-surface border border-legal-hub-border p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-legal-hub-accent"></div>
              <h4 className="text-lg font-semibold text-legal-hub-accent mb-2 flex items-center gap-2">
                <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5" />
                2.3 Biometric Data — BIPA Disclosure (Illinois)
              </h4>
              <p className="text-gray-400 text-sm mb-4">PXI's "Find My Shots" feature uses facial geometry vector scanning ("FaceVector") to identify your photos within shared event albums. This feature is subject to the Illinois Biometric Information Privacy Act (BIPA), the California Consumer Privacy Act (CPRA Sensitive Data provisions), and analogous state laws.</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                <li>Raw selfies and face images are processed on-device (in the app or in your browser) and permanently destroyed immediately. We never transmit or store raw biometric images.</li>
                <li>On-device processing derives a mathematical face vector — an encrypted list of numbers that cannot be reversed into a photo. Only this vector is transmitted to and stored on PXI servers, encrypted in transit (TLS) and encrypted at rest.</li>
                <li>The stored vector is used strictly to (a) match you in event photos you attend and (b) send you a "you're in a photo" alert. It is never used for advertising, identity verification, or any purpose beyond photo matching.</li>
                <li>A distinct, upfront Biometric Consent Screen with plain-language explanation is required before this feature is activated — affirmative opt-in only.</li>
                <li>Photos uploaded to event albums are scanned to derive per-face vectors so opted-in attendees can be matched to their photos. We store vectors only — never face crops or copies of the uploaded images from this matching process.</li>
                <li>Web guests without the app can run a one-time face scan locally in their browser to find themselves in an event gallery. The raw scan never leaves the browser; the derived vector is sent once over an encrypted connection for that single gallery match and is never stored.</li>
                <li>You may revoke consent at any time via Settings &gt; Permissions &gt; Face Recognition.</li>
                <li>Upon revocation, your server-stored enrollment vector is deleted immediately; previously matched photo tags remain visible until manually removed by you.</li>
                <li>We NEVER sell, lease, rent, trade, or profit from biometric data.</li>
                <li>Biometric data is never shared with third parties except: (i) infrastructure and cloud storage providers strictly as necessary to store and process the encrypted vector, and (ii) as required by valid legal process.</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4 italic">Retention: Enrollment vectors are retained until the earliest of: (i) revocation of your consent, (ii) deletion of your account, or (iii) three (3) years following your last interaction with the Services.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.4 Media & Content Data</h4>
              <p className="text-gray-400">We collect content you actively create or upload: Photos and videos uploaded to Event Albums, The Wall, The Vault, or The Circle. Metadata: upload timestamp, event association, media type, file size. Analog Engine processing parameters: ZSL (Zero Shutter Lag), Halation, Film Grain shader settings applied at render time. These parameters are PXI's proprietary aesthetic layer; the underlying raw photo remains yours. Captions, comments, and reactions you post. Number of retakes before posting (used to improve camera experience, not stored permanently).</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.5 Usage, Engagement & Gamification Data</h4>
              <p className="text-gray-400">App interactions: album joins, ticket scans, photo uploads, reactions, shares, comment posts. Odyssey/Gamification data: XP earned per action, Stamp tier achieved, Leaderboard position, event attendance history. Event-specific behavior: Hype Gate activity, Grace Time uploads, Circle content views, check-in confirmations. Device and network data: device type, OS version, browser/app version, IP-based approximate location (city-level), device identifiers (IDFA/GAID, where consented). Crash logs, error diagnostics, and performance monitoring data. When you take a screenshot within the app (we may notify the relevant album host).</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.6 Event & Ticketing Data (Attendees)</h4>
              <p className="text-gray-400">Ticket purchase records and order history. RSVP and attendance status. Payment confirmation numbers (NOT full card details — those are held by Stripe). Event check-in timestamp and location confirmation. Contact book information: ONLY the specific contacts you choose to invite to events. We do NOT access or store your full address book.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">2.7 Vendor, Host & Organizer Data</h4>
              <p className="text-gray-400">If you register as a Tier 3 Vendor/Host, we additionally collect: Legal name, business name (DBA), address, EIN/tax identification number. Bank account/payout information (processed via Stripe Connect; PXI does not store raw bank details). Government-issued ID (when required for identity verification for high-volume payouts). Event proceeds history, fee records, chargeback history. Staff delegation records (who you assigned as Co-host, Photographer, Promoter, or Bouncer). Messaging Service communication logs (for SMS/event blast compliance).</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. How We Use Your Information</h3>
          <p className="text-gray-400 mb-4">We use your information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-400">
            <li>Providing and operating the Services (account creation, event access, album grouping, photo matching, ticketing, payouts).</li>
            <li>Running the Event Lock: computing your Haversine proximity to an event venue to unlock albums.</li>
            <li>Biometric photo matching: identifying photos you appear in at events you attend (opt-in only; vectors only, never raw images).</li>
            <li>Running the Odyssey gamification system: awarding XP, Stamps, and Leaderboard rankings.</li>
            <li>Processing ticket purchases, distributing payouts to vendors via Stripe Connect.</li>
            <li>Personalizing your feed, event recommendations, and suggested connections based on attendance history.</li>
            <li>Safety, fraud prevention, and abuse detection (e.g., detecting spoofed GPS, fake tickets, account manipulation).</li>
            <li>Sending transactional communications: ticket confirmations, event reminders, payout notifications.</li>
            <li>Sending marketing communications (only with your explicit opt-in; unsubscribe available at any time).</li>
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
              <p className="text-gray-400">Stripe, Inc. (payments), Cloudflare (Edge middleware, CDN, R2 storage), on-device ML frameworks (facial geometry processing), Analytics providers (aggregated, non-PII data only), SMS/Push notification providers.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white/90">4.5 Legal Obligations & Business Transfers</h4>
              <p className="text-gray-400">We may disclose your information: (i) as required by law, court order, or valid legal process; (ii) to protect the safety of users or the public; (iii) in connection with a merger, acquisition, or sale of assets (with reasonable prior notice to users).</p>
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
            <li><strong className="text-white">Location data (Event Lock):</strong> Deleted after DBSCAN clustering computation; aggregate metadata up to 90 days.</li>
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
              <p className="text-gray-400">Access and download a copy of your data: Settings &gt; Privacy &gt; Download My Data. Correct inaccurate profile data at any time within Settings. Delete your account and associated data: Settings &gt; Account &gt; Delete Account. Revoke biometric consent: Settings &gt; Permissions &gt; Face Recognition. Opt out of marketing communications: Settings &gt; Notifications &gt; Marketing, or click Unsubscribe in any email. Report content or request removal of tagged photos: In-app report button or privacy@pxispace.com.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">6.2 California Residents (CCPA / CPRA)</h4>
              <p className="text-gray-400">California residents have the right to: Know, Access, Delete, Correct, Opt-Out of Sale/Sharing, and Limit Use of Sensitive Personal Data. We do not sell personal data. Biometric data is Sensitive Personal Data under CPRA and is collected only with explicit consent. Submit requests to privacy@pxispace.com with subject line: CCPA Request.</p>
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
          <p className="leading-relaxed mb-4">You own your content. PXI does not claim ownership of photos, videos, captions, or other original media you upload.</p>
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
              <p>Ticket purchases are final unless host policy permits refunds or event is cancelled. A Consumer Fee ($0.99 flat + 4.59% variable) is charged per transaction. All sales are in USD.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">10.2 For Vendors (Event Hosts)</h4>
              <p>Fee structure: Consumer Variable Fee (4.59%) and Platform Service Fee ($0.99 flat). Payouts via Stripe Connect typically within 2–5 business days after the event, subject to Stripe processing. Vendors are responsible for chargebacks, refunds, and taxes.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">11. The Messaging Service</h3>
          <p className="leading-relaxed">Hosts may use the Messaging Service to communicate with attendees. Must comply with TCPA, CAN-SPAM, and CASL. Informational messages may be sent to all registered attendees; marketing requires separate opt-in. PXI may monitor usage for compliance.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">12. Prohibited Conduct</h3>
          <p className="mb-4">Strictly prohibited: GPS spoofing, fake accounts, ticket fraud, uploading content you don't own, botting, reverse-engineering shaders, and sending unsolicited marketing messages.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">13. Enforcement & Termination</h3>
          <p className="leading-relaxed">PXI reserves the right to remove content, issue warnings, suspend or ban accounts, and report illegal activity to law enforcement. Appeals must be submitted within 30 days to legal@pxispace.com.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">14. Disclaimers & Limitation of Liability</h3>
          <p className="leading-relaxed">Services provided "AS IS". PXI disclaims all warranties. Total liability shall not exceed the greater of $100 USD or the amount you paid PXI in the preceding 12 months.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">15. Indemnification</h3>
          <p className="leading-relaxed">You agree to defend and indemnify PXI from claims arising from your violation of these Terms, your content, or your operation of events.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">16. Dispute Resolution & Arbitration</h3>
          <p className="leading-relaxed">Binding individual arbitration via JAMS. You waive your right to a jury trial or class action. Governing law: Commonwealth of Massachusetts. Venue: Suffolk County, Massachusetts.</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">17. General Provisions</h3>
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
          <p>No doxxing (sharing non-public personal info). No photos in private spaces (bathrooms, changing rooms). No sharing Circle content outside PXI. No surveillance or tracking of others' location without knowledge.</p>
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
    tldr: "We use essential cookies to keep the app working, analytics cookies to understand how you use it, and nothing that tracks you across other websites. We never sell cookie data. You control what’s optional.",
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
              <h4 className="text-lg font-semibold text-white/90">2.1 Strictly Necessary Cookies (Always Active)</h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><code className="text-legal-hub-accent">pxi_session</code>: PASETO v4 token session cookie.</li>
                <li><code className="text-legal-hub-accent">pxi_csrf</code>: Protection against unauthorized form submissions.</li>
                <li><code className="text-legal-hub-accent">cf_clearance</code>: Cloudflare security/bot detection.</li>
                <li><code className="text-legal-hub-accent">__stripe_mid / __stripe_sid</code>: Stripe payment security/fraud prevention.</li>
                <li><code className="text-legal-hub-accent">pxi_consent</code>: Stores your cookie preferences.</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.2 Functional Cookies</h4>
              <p className="text-sm"><code className="text-legal-hub-accent">pxi_prefs</code> (UI settings), <code className="text-legal-hub-accent">pxi_event_history</code> (feed personalization), <code className="text-legal-hub-accent">pxi_lang</code>.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.3 Analytics Cookies (Opt-In)</h4>
              <p className="text-sm">Google Analytics 4 (_ga) for aggregated, anonymized flow tracking. <code className="text-legal-hub-accent">pxi_perf</code> for performance diagnostics. <code className="text-legal-hub-accent">pxi_ab</code> for feature testing.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.4 Marketing & Communication Cookies</h4>
              <p className="text-sm">We do not currently use third-party advertising cookies or cross-site tracking pixels.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.5 Third-Party Cookies</h4>
              <p className="text-sm">Governed by their own policies: Stripe (payments), Cloudflare (security), Google Analytics.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.6 Your Cookie Choices</h4>
              <p className="text-sm">Manage preferences via <strong>Settings &gt; Privacy &gt; Cookie Preferences</strong> or browser settings.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white/90">2.7 Do Not Track (DNT)</h4>
              <p className="text-sm">PXI does not currently respond to DNT signals as there is no consistent industry standard.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. Contact Us About This Cookie Policy</h3>
          <p>Email: <span className="text-legal-hub-accent">privacy@pxispace.com</span><br />
          In-App: Settings &gt; Privacy &gt; Cookie Preferences<br />
          Mail: PXI LABS LLC, 5850 Town and Country Blvd, Suite 403, Frisco, TX 75034</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. Updates to This Cookie Policy</h3>
          <p className="leading-relaxed">We may update this policy periodically. Significant changes will be notified on the platform. Last Updated: March 23, 2026.</p>
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
                <li><strong className="text-white">Platform Service Fee:</strong> $0.99 flat fee per ticket.</li>
                <li><strong className="text-white">Consumer Variable Fee:</strong> 4.59% of ticket face value.</li>
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
          <p className="leading-relaxed"><strong>5.1 Host Liability:</strong> Event Hosts are fully responsible for all actions taken by delegated staff. PXI is not liable for staff behavior.</p>
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
            Last Updated: March 23, 2026<br />
            Contact: legal@pxispace.com | support@pxispace.com | trust@pxispace.com
          </p>
        </div>
      </div>
    )
  }
];

export default function LegalHubPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

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
      const id = window.location.hash.replace(/^#/, '');
      if (id && SECTIONS.some((s) => s.id === id)) {
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
  }, [scrollToSection]);

  return (
    <div className="legal-hub min-h-screen bg-legal-hub-bg text-legal-hub-text selection:bg-legal-hub-accent selection:text-black">
      <header className="pt-8 pb-12 md:pt-10 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-legal-hub-border">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-6 text-[#E0E0E0]">
            The Legal Hub.
          </h1>
          <p className="text-xl md:text-2xl text-[#AAAAAA] font-medium tracking-tight mb-4 italic">
            Transparent. Secure. Stateless.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-[#AAAAAA] uppercase tracking-widest">
            <span>Effective Date: 03/23/2026</span>
            <span>Jurisdiction: Frisco, Texas, USA</span>
            <span>Contact: legal@pxispace.com</span>
          </div>
        </motion.div>
      </header>

      {/* Mobile Navigation (Sticky) */}
      <div className="md:hidden sticky top-0 z-30 bg-legal-hub-bg/95 backdrop-blur pt-4 pb-2 border-b border-legal-hub-border">
        <div className="flex overflow-x-auto legal-hub-hide-scrollbar px-4 gap-6">
          {SECTIONS.map((section) => (
            <button
              key={`mobile-${section.id}`}
              onClick={() => scrollToSection(section.id)}
              className={`whitespace-nowrap pb-2 text-lg transition-all ${
                activeSection === section.id 
                  ? 'font-bold text-white' 
                  : 'font-normal text-gray-500'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-1/4 shrink-0">
            <div className="sticky top-28 flex flex-col space-y-6">
              {SECTIONS.map((section) => (
                <button
                  key={`desktop-${section.id}`}
                  onClick={() => scrollToSection(section.id)}
                  className={`text-left transition-all text-xl ${
                    activeSection === section.id 
                      ? 'font-bold text-white' 
                      : 'font-normal text-gray-500 hover:text-white'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Content Panel */}
          <div className="w-full md:w-3/4 space-y-24 md:space-y-32 pb-32">
            {SECTIONS.map((section) => (
              <section 
                key={section.id} 
                id={section.id}
                className="scroll-mt-28"
              >
                <div className="mb-8">
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">
                    {section.title}
                  </h2>
                  
                  {/* TL;DR Box */}
                  <div className="bg-neon-card shadow-neon-card p-8 md:p-12 rounded-[32px] mb-12 flex flex-col items-center justify-center text-center">
                    <h3 
                      className="font-black uppercase text-white text-4xl md:text-5xl leading-none mb-6 ghost-echo"
                      data-text="TL;DR"
                    >
                      TL;DR
                    </h3>
                    <p className="text-white/90 font-light text-lg md:text-xl max-w-3xl">
                      {section.tldr}
                    </p>
                  </div>
                </div>

                <div className="max-w-none [&_strong]:text-white">{section.content}</div>
                
                <div className="mt-16 h-px w-full bg-gradient-to-r from-legal-hub-border via-legal-hub-border/50 to-transparent"></div>
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
                href="/events"
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
