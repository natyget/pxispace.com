'use client';

// One-click email-marketing unsubscribe landing (linked from campaign emails).
// Verifies the HMAC-signed link server-side; no login required.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';

function UnsubscribeContent() {
  const params = useSearchParams();
  const [state, setState] = useState('working'); // working | done | error

  useEffect(() => {
    const u = params.get('u');
    const s = params.get('s');
    if (!u || !s) {
      setState('error');
      return;
    }
    api.post('/api/users/unsubscribe', { u, s })
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }, [params]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
      <p className="mb-6 text-[11px] font-black uppercase tracking-[0.3em] text-pxi-purple">PXI</p>
      {state === 'working' && <p className="text-sm text-zinc-400">Updating your preferences…</p>}
      {state === 'done' && (
        <>
          <h1 className="text-xl font-black">You&apos;re unsubscribed</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            You won&apos;t get marketing emails from event hosts anymore. Ticket confirmations still arrive.
            You can opt back in anytime from your PXI settings.
          </p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-xl font-black">That link didn&apos;t work</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            The unsubscribe link is invalid or expired. You can turn off event updates in the PXI app under
            Settings, or contact support@pxispace.com.
          </p>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-black text-zinc-500 text-sm">Loading…</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
