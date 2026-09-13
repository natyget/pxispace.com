'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Reached from the edge middleware when a signed-in user opens a dashboard
 * event they neither own nor staff. The copy used to read "Vendor access
 * required for the dashboard" with a login button — wrong on both counts for
 * an already signed-in Citizen, and the page most people met after tapping
 * "My Events" while that route was still gated to vendors.
 */
export default function ForbiddenPage() {
  const { isAuthenticated, authReady } = useAuth();
  const signedIn = authReady && isAuthenticated;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4">
      <h1 className="text-4xl font-bold mb-2">403</h1>
      <p className="text-[var(--text-secondary)] mb-6">
        {signedIn ? 'You don’t have access to this page.' : 'Sign in to see this page.'}
      </p>
      <Link
        href={signedIn ? '/dashboard' : '/login'}
        className="px-6 py-3 rounded-full font-medium neon-pill text-white"
      >
        {signedIn ? 'Back to dashboard' : 'Go to Login'}
      </Link>
    </div>
  );
}
