'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { joinWaitlist } from '@/services/diplomatTools';

/**
 * The buy slot of a sold-out night. Signed in: one tap. Signed out: an email field. The host gets the email
 * to let people in, so the copy says so.
 */
export default function EventWaitlistForm({ eventId }) {
  const { isAuthenticated, authReady } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const needsEmail = authReady && !isAuthenticated;

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'saving') return;
    setStatus('saving');
    setError('');
    try {
      await joinWaitlist(eventId, needsEmail ? email.trim() : '');
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Could not join the waitlist.');
    }
  };

  if (status === 'done') {
    return <p className="w-full py-3 text-center text-[16px] font-extrabold text-white">You&apos;re on the list.</p>;
  }

  return (
    <form onSubmit={submit} className="w-full min-w-0 flex-1 space-y-2">
      <p className="text-[13px] text-white/55">The host gets your email to let you in.</p>
      <div className="flex items-center gap-2">
        {needsEmail ? (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            className="h-12 min-w-0 flex-1 rounded-full bg-[#2E2E2E] px-4 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
          />
        ) : null}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#A523EF] px-6 text-[15px] font-extrabold text-white transition-transform active:scale-[0.97] disabled:opacity-45"
        >
          {status === 'saving' ? 'Joining...' : 'Join the waitlist'}
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}
