'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * The dashboard's refusal page.
 *
 * It used to say "Vendor access required for the dashboard" with a login button — wrong on
 * both counts for an already signed-in Citizen, and it was the page most people met after
 * tapping "My Events" while that route was still gated to vendors.
 *
 * WEB-2 narrowed what can send anyone here at all: the edge middleware no longer refuses a
 * dashboard event because the token's claim list is out of date, so the old "bounced off my
 * own event" case is gone. What remains is genuine, and the three reasons need different
 * next steps rather than one dead end:
 *
 *   ?reason=vendor  — the surface really is vendor-only; the upgrade page is the way in.
 *   ?reason=access  — signed in, not permitted here. Nothing to retry.
 *   (none)          — we could not confirm, e.g. a signed-out visitor: sign in.
 */
function ForbiddenContent() {
  const { isAuthenticated, authReady } = useAuth();
  const signedIn = authReady && isAuthenticated;
  const reason = useSearchParams().get('reason');

  if (!signedIn) {
    return (
      <Shell title="Sign in to see this page" body="This part of PXI is for signed-in accounts.">
        <Action href="/login?redirect=/dashboard">Go to login</Action>
      </Shell>
    );
  }

  if (reason === 'vendor') {
    return (
      <Shell
        title="This part of the dashboard is for organizers"
        body="Upgrade your account to host events, sell tickets and see who came. Creating a free event does not need an upgrade."
      >
        <Action href="/dashboard/vendor-upgrade">Become an organizer</Action>
        <Secondary href="/dashboard">Back to dashboard</Secondary>
      </Shell>
    );
  }

  return (
    <Shell
      title="You do not have access to this page"
      body="If you were expecting access — a co-host invite you just accepted, say — sign out and back in, which refreshes what your account can reach."
    >
      <Action href="/dashboard">Back to dashboard</Action>
      <Secondary href="/dashboard/events">My events</Secondary>
    </Shell>
  );
}

function Shell({ title, body, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 text-center">
      <h1 className="text-4xl font-bold mb-2">403</h1>
      <p className="text-lg font-semibold mb-2">{title}</p>
      <p className="text-[var(--text-secondary)] mb-6 max-w-md">{body}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
    </div>
  );
}

function Action({ href, children }) {
  return (
    <Link href={href} className="px-6 py-3 rounded-full font-medium neon-pill text-white">
      {children}
    </Link>
  );
}

function Secondary({ href, children }) {
  return (
    <Link href={href} className="px-4 py-3 text-sm text-[var(--text-secondary)] underline underline-offset-4">
      {children}
    </Link>
  );
}

export default function ForbiddenPage() {
  // useSearchParams needs a Suspense boundary to keep the route statically renderable.
  return (
    <Suspense fallback={<Shell title="403" body="Checking access…" />}>
      <ForbiddenContent />
    </Suspense>
  );
}
