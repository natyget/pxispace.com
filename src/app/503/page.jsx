'use client';

export default function ServiceUnavailablePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4">
      <h1 className="text-4xl font-bold mb-2">503</h1>
      <p className="text-[var(--text-secondary)]">Service temporarily unavailable. Please try again later.</p>
    </div>
  );
}
