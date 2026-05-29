/**
 * Purple spinner — matches mobile Wall Circle strip loading
 * (`TheCircle` → ActivityIndicator, Colors.neonPurple / #B026FF).
 */
const NEON_PURPLE = '#B026FF';

const SPINNER_SIZES = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

function PxiSpinner({ size = 'lg', className = '' }) {
  const dim = SPINNER_SIZES[size] ?? SPINNER_SIZES.lg;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`shrink-0 rounded-full border-solid animate-spin motion-reduce:animate-none ${dim} ${className}`}
      style={{
        borderColor: `${NEON_PURPLE}33`,
        borderTopColor: NEON_PURPLE,
      }}
    />
  );
}

/** Inline / navbar */
export function PxiLoadingIcon({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <PxiSpinner size="sm" />
    </div>
  );
}

/** Full viewport center — covers layout chrome during route transitions */
function PxiLoadingViewport({ className = '' }) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] ${className}`}
    >
      <PxiSpinner size="lg" />
    </div>
  );
}

/** Landing & root route loading */
export function PxiLoadingScreen() {
  return <PxiLoadingViewport />;
}

/** Homepage while public layout (navbar) is mounting */
export function PxiLoadingLanding() {
  return <PxiLoadingViewport />;
}

/** Other public routes — same viewport-centered overlay */
export function PxiLoadingMain() {
  return <PxiLoadingViewport />;
}
