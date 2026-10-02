/**
 * The four-colour Google Play triangle, inline so it costs no request and works in both
 * the server-rendered redesign footer and the client footer. Sized by the caller.
 *
 * Drawn on a 20.78 x 24 grid: a 60-degree triangle (left edge vertical, tip on the right)
 * cut into the four Play pieces and clipped to rounded corners.
 *
 * @param {{ className?: string, width?: number, height?: number }} props
 */
export default function GooglePlayMark({ className, width = 19, height = 22 }) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 20.78 24"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="pxi-gplay-mark-clip">
          <path d="M0 2.42A1.4 1.4 0 0 1 2.1 1.21L18.68 10.79A1.4 1.4 0 0 1 18.68 13.21L2.1 22.79A1.4 1.4 0 0 1 0 21.58Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#pxi-gplay-mark-clip)">
        <path fill="#00D3FF" d="M0 0L11.2 12L0 24Z" />
        <path fill="#00F076" d="M0 0L15.72 9.08L12.8 12H11.2Z" />
        <path fill="#FF3A44" d="M0 24L15.72 14.92L12.8 12H11.2Z" />
        <path fill="#FFD800" d="M12.8 12L15.72 9.08L20.78 12L15.72 14.92Z" />
      </g>
    </svg>
  );
}
