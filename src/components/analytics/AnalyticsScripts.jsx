'use client';

// ─────────────────────────────────────────────────────────────────────────────
// The ONE Google tag on pxispace.com. Rendered in <head> from the root layout.
//
// Order is load-bearing:
//   1. Consent Mode v2 defaults (beforeInteractive). Next emits this into
//      __next_s and runs it before hydration AND before every afterInteractive
//      script, so it is guaranteed to precede gtag.js. A consent default that
//      lands after the tag is worthless.
//   2. ONE loader, fetched by TAG ID (GT-…), not by measurement id. A single
//      tag can fan out to several destinations.
//   3. Explicit config per destination — exactly one each:
//        GA4  (G-…)  with send_page_view:false; AnalyticsProvider owns
//                    page_view, so GA4 Enhanced Measurement "history events"
//                    MUST stay off in the GA4 UI or SPA views double.
//        Ads  (AW-…) required for allow_enhanced_conversions and for the
//                    remarketing/conversion tags to have a home.
//   4. GTM container — an AD-PIXEL container ONLY. It must NOT contain a GA4
//      configuration tag or a Google Ads tag; those live here. If someone adds
//      one in the GTM UI the property gets duplicate sessions and you will not
//      see it from the code.
//
// Fail closed: a missing env id loads NOTHING for that destination. There is no
// hardcoded fallback id anywhere in this file — a wrong id silently poisons a
// production property, which is worse than no data.
// ─────────────────────────────────────────────────────────────────────────────

import Script from 'next/script';
import { RESTRICTED_REGIONS } from '@/lib/consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// Only ever interpolated with ids from env, but ids come from a build config we
// do not want to trust blindly inside a <script> body.
const ID_PATTERN = /^[A-Za-z0-9_-]{4,32}$/;
const safeId = (value) => (typeof value === 'string' && ID_PATTERN.test(value) ? value : null);

const tagId = safeId(TAG_ID);
const gaId = safeId(GA_ID);
const adsId = safeId(ADS_ID);
const gtmId = safeId(GTM_ID);

const REGION_LIST = JSON.stringify(RESTRICTED_REGIONS);

export default function AnalyticsScripts() {
    if (!tagId && !gtmId) return null;

    return (
        <>
            {/* 1 — Consent Mode v2. Global default first, then the region-scoped
                override for the EEA / UK / CH. Google resolves the most specific
                region match regardless of push order, so the override wins for
                its 32 countries while everyone else (incl. the US) keeps the
                unscoped 'granted' default and loses no data.
                url_passthrough keeps gclid alive across same-site redirects and
                ads_data_redaction strips ad identifiers while ad_storage is
                denied — both are only meaningful in the denied state. */}
            <Script id="pxi-consent-default" strategy="beforeInteractive">
                {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
});
gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
    region: ${REGION_LIST}
});
gtag('set', 'url_passthrough', true);
gtag('set', 'ads_data_redaction', true);
                `}
            </Script>

            {tagId ? (
                <>
                    {/* 2 — the single loader, by TAG ID */}
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
                        strategy="afterInteractive"
                    />
                    {/* 3 — one config per destination */}
                    <Script id="pxi-google-tag-config" strategy="afterInteractive">
                        {`
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
${gaId ? `window.gtag('config', '${gaId}', { send_page_view: false });` : ''}
${adsId ? `window.gtag('config', '${adsId}', { allow_enhanced_conversions: true });` : ''}
                        `}
                    </Script>
                    {/*
                      NOTE — linked-destination overlap. Loading the gtag/js
                      bundle for tag GT-MJMHMN4S already returns AW-18365171384
                      as a LINKED CHILD DESTINATION of the Google tag (configured
                      in the Ads UI, invisible from this repo). The explicit
                      config() above is still required: it is what turns on
                      allow_enhanced_conversions and it is the only Ads
                      initialisation visible to a code reader. Until the link is
                      removed in the Google Ads UI, remarketing hits may fire
                      twice for the same pageload. Conversions are deduplicated
                      by transaction_id, so revenue is not double-counted —
                      audience sizes are the only thing affected.

                      Deliberately written without the literal `?id=` query form:
                      the "hardcoded analytics id" guard in seo-checks.yml is a
                      plain grep over src/ and cannot tell a comment from code,
                      so documentation must not reproduce that exact pattern.
                      Same reason the retired-id guard splits its own needle.
                    */}
                </>
            ) : null}

            {gtmId ? (
                <Script id="pxi-gtm" strategy="afterInteractive">
                    {`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})
(window,document,'script','dataLayer','${gtmId}');
                    `}
                </Script>
            ) : null}
        </>
    );
}
