import { PATCH_EMBLEMS } from '@/lib/patchEmblems';

// Thread colours by name, as the API's patch kit names them.
const THREAD = {
  'pxi-purple': '#A523EF',
  midnight: '#15132B',
  black: '#0B0B0C',
  white: '#F7F5F0',
  cream: '#EFE3C8',
  gold: '#E2B533',
  orange: '#EE6A2C',
  red: '#C8243A',
  pink: '#F29BC2',
  teal: '#178E86',
  sky: '#62B6E8',
  green: '#2F8A4E',
};

// Each shape in its own 100-wide box: the outline, its height, and the arcs/lines the two texts sit on.
const SHAPES = {
  circle: { h: 100, d: 'M50 3a47 47 0 1 1 0 94a47 47 0 1 1 0 -94z', top: 'M19 50a31 31 0 0 1 62 0', bottom: 'M9 50a41 41 0 0 0 82 0', emblem: [50, 50, 40] },
  hexagon: { h: 86.6, d: 'M28 3h44l25 40.3l-25 40.3h-44l-25 -40.3z', top: 'M24 43.3a26 26 0 0 1 52 0', bottom: 'M16 43.3a34 34 0 0 0 68 0', emblem: [50, 43.3, 32] },
  shield: { h: 120, d: 'M10 3h80a7 7 0 0 1 7 7v42c0 22 -13 38 -29 52l-16 12l-16 -12c-16 -14 -29 -30 -29 -52v-42a7 7 0 0 1 7 -7z', top: 'M16 34a70 70 0 0 1 68 0', bottom: 'M26 74a52 52 0 0 0 48 0', emblem: [50, 55, 36] },
  star: { h: 96, d: 'M50 3l13 28l31 4l-23 21l6 31l-27 -15l-27 15l6 -31l-23 -21l31 -4z', top: null, bottom: null, emblem: [50, 52, 30] },
  bar: { h: 40, d: 'M9 3h82a6 6 0 0 1 6 6v22a6 6 0 0 1 -6 6h-82a6 6 0 0 1 -6 -6v-22a6 6 0 0 1 6 -6z', top: null, bottom: null, emblem: [21, 20, 24] },
};

const FONT = {
  varsity: { family: "'Stack Sans Notch', 'Arial Black', Impact, sans-serif", weight: 900, spacing: '0.04em', upper: true },
  script: { family: "'Caveat', 'Bradley Hand', 'Segoe Print', cursive", weight: 700, spacing: '0', upper: false },
  block: { family: "'Arial Black', Impact, sans-serif", weight: 900, spacing: '0.08em', upper: true },
};

const initialsOf = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join('')
    .toUpperCase();

/**
 * A scene's patch, drawn from its data (shape, thread colours, emblem, two lines of lettering). A flat web version
 * of the app's embroidered patch: same shape, colours, emblem and words, without the stitching.
 *
 * @param {{ patch: object, name: string, uid: string, size?: number, className?: string }} props
 */
export default function ScenePatch({ patch, name, uid, size = 96, className = '' }) {
  const shape = SHAPES[patch.shape] || SHAPES.circle;
  const font = FONT[patch.font] || FONT.varsity;
  const ink = THREAD[patch.textColor];
  const emblemShape = PATCH_EMBLEMS[patch.emblem];
  const [ex, ey, es] = shape.emblem;
  const hasText = Boolean(patch.textTop || patch.textBottom);
  const ids = `patch-${String(uid).replace(/[^a-z0-9]/gi, '')}`;
  const cased = (t) => (font.upper ? t.toUpperCase() : t);
  const straight = !shape.top;
  const textX = patch.shape === 'bar' ? 64 : 50;

  const emblem = emblemShape ? (
    <path
      d={emblemShape.d}
      fillRule={emblemShape.evenodd ? 'evenodd' : 'nonzero'}
      fill={THREAD[patch.emblemColor]}
      transform={`translate(${ex - (es * emblemShape.w) / 200} ${ey - (es * emblemShape.h) / 200}) scale(${es / 100})`}
    />
  ) : (
    <text
      x={ex}
      y={ey}
      textAnchor="middle"
      dominantBaseline="central"
      fill={THREAD[patch.emblemColor]}
      fontFamily={font.family}
      fontWeight={font.weight}
      fontSize={es * 0.6}
    >
      {initialsOf(name)}
    </text>
  );

  return (
    <svg
      viewBox={`0 0 100 ${shape.h + 6}`}
      width={size}
      className={className}
      role="img"
      aria-label={`${name}, patch`}
      style={{ height: 'auto', display: 'block' }}
    >
      <path d={shape.d} fill={THREAD[patch.twill]} stroke={THREAD[patch.border]} strokeWidth="6" strokeLinejoin="round" />
      {emblem}
      {hasText && !straight ? (
        <>
          <defs>
            <path id={`${ids}-t`} d={shape.top} />
            <path id={`${ids}-b`} d={shape.bottom} />
          </defs>
          {patch.textTop ? (
            <text fill={ink} fontFamily={font.family} fontWeight={font.weight} fontSize="9" letterSpacing={font.spacing} textAnchor="middle">
              <textPath href={`#${ids}-t`} startOffset="50%">
                {cased(patch.textTop)}
              </textPath>
            </text>
          ) : null}
          {patch.textBottom ? (
            <text fill={ink} fontFamily={font.family} fontWeight={font.weight} fontSize="7" letterSpacing={font.spacing} textAnchor="middle">
              <textPath href={`#${ids}-b`} startOffset="50%">
                {cased(patch.textBottom)}
              </textPath>
            </text>
          ) : null}
        </>
      ) : null}
      {hasText && straight ? (
        <>
          {patch.textTop ? (
            <text x={textX} y={patch.shape === 'bar' ? 17 : 76} textAnchor="middle" fill={ink} fontFamily={font.family} fontWeight={font.weight} fontSize={patch.shape === 'bar' ? 9 : 8} letterSpacing={font.spacing}>
              {cased(patch.textTop)}
            </text>
          ) : null}
          {patch.textBottom ? (
            <text x={textX} y={patch.shape === 'bar' ? 29 : 85} textAnchor="middle" fill={ink} fontFamily={font.family} fontWeight={font.weight} fontSize="6" letterSpacing={font.spacing}>
              {cased(patch.textBottom)}
            </text>
          ) : null}
        </>
      ) : null}
    </svg>
  );
}
