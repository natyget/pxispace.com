'use client';

/**
 * Dark-mode anonymous avatar — head/shoulders silhouette with subtle purple edge glow.
 * Used when no profile photo is available (partial users, broken URLs).
 */
export default function AnonymousAvatarSilhouette({ size = 40, className = '', rounded = 'full' }) {
  const radiusClass = rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-xl' : 'rounded-md';

  return (
    <div
      className={`relative overflow-hidden bg-[#0a0a0a] border border-white/[0.08] ${radiusClass} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="pxiSilhouetteGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(176,38,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="#0c0c0c" />
        <circle
          cx="32"
          cy="23"
          r="10.5"
          fill="#161616"
          stroke="url(#pxiSilhouetteGlow)"
          strokeWidth="1.25"
        />
        <path
          d="M11 56c4.5-11.5 12.5-17.5 21-17.5s16.5 6 21 17.5"
          fill="#161616"
          stroke="url(#pxiSilhouetteGlow)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        {/* Unlocked aesthetic — open arc at shoulder */}
        <path
          d="M18 52 Q32 38 46 52"
          fill="none"
          stroke="rgba(176,38,255,0.2)"
          strokeWidth="0.75"
        />
      </svg>
    </div>
  );
}
