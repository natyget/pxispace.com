'use client';

import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4">
      <h1 className="text-4xl font-bold mb-2">403</h1>
      <p className="text-[var(--text-secondary)] mb-6">Vendor access required for the dashboard.</p>
      <Link
        href="/login"
        className="px-6 py-3 rounded-full font-medium neon-pill text-white"
      >
        Go to Login
      </Link>
    </div>
  );
}
