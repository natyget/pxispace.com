import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Brand-consistent dynamic Open Graph card (1200×630).
 *
 *   /og?title=Never%20lose%20the%20night&eyebrow=Platform&kicker=pxispace.com
 *
 * Why this exists: every page used to share the same static og-hero.png, so a link to
 * /about, /faq and /pricing all previewed identically and told the reader nothing. This
 * renders a per-page card from the page's own title.
 *
 * IMPLEMENTATION NOTE — Satori (the renderer behind ImageResponse) does NOT support
 * `filter: blur()`. The previous version drew the "bloom" as a plain rgba circle, which
 * came out as a hard-edged purple disc sitting on top of the headline. Soft glows here
 * must be done with radial-gradient backgrounds, which Satori does support.
 * Satori also requires an explicit `display: flex` on any element with children.
 */

const BG = '#050505';
const PURPLE = '#d84aff';
const ORANGE = '#ff5a1f';

export function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'PXI').slice(0, 110);
  const eyebrow = (searchParams.get('eyebrow') || '').slice(0, 40);
  const kicker = (searchParams.get('kicker') || 'pxispace.com').slice(0, 60);

  // Long headlines step down so they never wrap past three lines or collide with the rule.
  const titleSize = title.length > 78 ? 54 : title.length > 46 ? 66 : 82;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          // Two soft blooms — radial-gradient, not a solid circle, so the edges actually fade.
          backgroundImage: `radial-gradient(900px 560px at 88% -12%, rgba(216,74,255,0.30), rgba(216,74,255,0) 68%), radial-gradient(620px 420px at -8% 108%, rgba(255,90,31,0.16), rgba(255,90,31,0) 70%)`,
          padding: '72px 76px',
        }}
      >
        {/* wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}
        >
          <span style={{ color: PURPLE }}>(</span>
          PXI
          <span style={{ color: PURPLE }}>)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {eyebrow ? (
            <div
              style={{
                display: 'flex',
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: PURPLE,
                marginBottom: 22,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              maxWidth: '1010px',
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 600,
              color: '#a1a1aa',
              marginBottom: 22,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              display: 'flex',
              height: '5px',
              width: '100%',
              background: `linear-gradient(90deg, ${PURPLE}, ${ORANGE})`,
              borderRadius: '3px',
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
