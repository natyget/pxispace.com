import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Brand-consistent dynamic OG image (1200×630).
 * /og?title=Never%20lose%20the%20night&eyebrow=PXI
 */
export function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'PXI').slice(0, 120);
  const eyebrow = (searchParams.get('eyebrow') || '').slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#050505',
          padding: '72px',
          position: 'relative',
        }}
      >
        {/* purple bloom */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            left: '360px',
            width: '640px',
            height: '640px',
            borderRadius: '9999px',
            background: 'rgba(216,74,255,0.18)',
          }}
        />
        {/* wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
          <span style={{ color: '#d84aff' }}>(</span>PXI<span style={{ color: '#d84aff' }}>)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#a1a1aa',
                marginBottom: 20,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 42 ? 68 : 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              maxWidth: '1000px',
            }}
          >
            {title}
          </div>
        </div>

        {/* neon hairline */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'linear-gradient(90deg, #d84aff, #ff5a1f)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
