'use client';

// Google tag + GTM loaders, consent-first. Order is load-bearing:
//   1. Consent Mode v2 defaults MUST run before any Google script
//      (beforeInteractive vs afterInteractive guarantees it).
//   2. GA4 loads via the direct Google tag with send_page_view:false —
//      AnalyticsProvider owns SPA page_views (GA4 Enhanced Measurement
//      "history events" must stay OFF, see docs/analytics-taxonomy.md).
//   3. GTM (optional) rides alongside purely as an ad-pixel container;
//      its container must NOT hold a GA4 Google tag or page_views double.
// Unset env ids render nothing — analytics is fully off in local dev.

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CONSENT_DEFAULT = process.env.NEXT_PUBLIC_CONSENT_DEFAULT === 'denied' ? 'denied' : 'granted';

export default function AnalyticsScripts() {
    if (!GA_ID && !GTM_ID) return null;
    return (
        <>
            <Script id="pxi-consent-default" strategy="beforeInteractive">
                {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
    ad_storage: '${CONSENT_DEFAULT}',
    analytics_storage: '${CONSENT_DEFAULT}',
    ad_user_data: '${CONSENT_DEFAULT}',
    ad_personalization: '${CONSENT_DEFAULT}',
    wait_for_update: 500
});
                `}
            </Script>
            {GA_ID ? (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="pxi-ga-config" strategy="afterInteractive">
                        {`
window.gtag('js', new Date());
window.gtag('config', '${GA_ID}', { send_page_view: false });
                        `}
                    </Script>
                </>
            ) : null}
            {GTM_ID ? (
                <Script id="pxi-gtm" strategy="afterInteractive">
                    {`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})
(window,document,'script','dataLayer','${GTM_ID}');
                    `}
                </Script>
            ) : null}
        </>
    );
}
