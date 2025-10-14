export function GlowBar() {
  return (
    <div
      className="fixed left-0 right-0 bottom-14 h-px z-40 pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)',
        boxShadow: '0 0 36px rgba(139,92,246,0.55)',
      }}
      aria-hidden="true"
    />
  );
}

