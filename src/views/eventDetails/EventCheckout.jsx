'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import { eventsService } from '../../services/events';
import { getTicketQuote, createCheckoutSession, generateTicket, purchaseTicket } from '../../services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { displayImageSrc } from '@/lib/mediaUrl';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';

const PUBLIC_EULA_COPY = (
  <>
    By getting a ticket you acknowledge this is a public event. Content you post may be visible to others and may be used in
    marketing by the host and PXI. See also the{' '}
    <Link href="/terms_of_service" className="text-pxi-purple underline hover:text-white">
      Terms of Service
    </Link>
    . Paid purchases are subject to the fee and refund rules shown at checkout.
  </>
);

function parseTicketTiers(event) {
  if (!event || event.ticketType !== 'PAID') return [];
  const raw = event.ticketTiersJson;
  if (Array.isArray(raw) && raw.length) {
    const rows = raw.filter((t) => t && t.id && typeof t.priceUsd === 'number' && t.priceUsd > 0);
    if (rows.length) {
      return rows.map((t) => ({
        id: t.id,
        label: t.label || t.name || 'Ticket',
        priceUsd: t.priceUsd,
      }));
    }
  }
  const base = Number(event.ticketPrice);
  if (base > 0) return [{ id: null, label: 'General admission', priceUsd: base }];
  return [];
}

function formatPrice(usd, currency = 'USD') {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
}

function onImageErrorToDefault(e) {
  const el = e?.currentTarget;
  if (!el || el.dataset.fallbackApplied === '1') return;
  el.dataset.fallbackApplied = '1';
  el.src = DEFAULT_IMG;
}

/**
 * Unified checkout: guests sign in/up first (with redirect back here), then Apple Pay / Google Pay / hosted Stripe or free ticket.
 */
export default function EventCheckout({ basePath = '/events' }) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const tierFromUrl = searchParams.get('tier');
  const { user, isAuthenticated } = useAuth();

  const [apiEvent, setApiEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(!!id);
  const [quoteTotal, setQuoteTotal] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [walletSecret, setWalletSecret] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);

  const checkoutReturnPath = useMemo(() => {
    if (!id) return basePath;
    const qs = selectedTierId ? `?tier=${encodeURIComponent(selectedTierId)}` : '';
    return `${basePath}/${id}/checkout${qs}`;
  }, [id, selectedTierId, basePath]);

  const loginHref = `/login?redirect=${encodeURIComponent(checkoutReturnPath)}`;
  const signupHref = `/signup?mode=signup&redirect=${encodeURIComponent(checkoutReturnPath)}`;

  const stripeReturnUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${checkoutReturnPath}` : '';

  useEffect(() => {
    if (!id) {
      setEventLoading(false);
      return;
    }
    setEventLoading(true);
    eventsService
      .getEvent(id)
      .then((data) => setApiEvent(data.event || data))
      .catch(() => setApiEvent(null))
      .finally(() => setEventLoading(false));
  }, [id]);

  const tiers = useMemo(() => (apiEvent ? parseTicketTiers(apiEvent) : []), [apiEvent]);

  useEffect(() => {
    if (!tiers.length) {
      setSelectedTierId(null);
      return;
    }
    const fromUrl = tierFromUrl != null && tiers.some((t) => String(t.id) === String(tierFromUrl)) ? tierFromUrl : null;
    setSelectedTierId((prev) => {
      if (fromUrl != null) return tiers.find((t) => String(t.id) === String(fromUrl))?.id ?? tiers[0].id;
      if (prev != null && tiers.some((t) => t.id === prev)) return prev;
      return tiers[0].id;
    });
  }, [tiers, tierFromUrl]);

  const apiTierId = typeof selectedTierId === 'string' ? selectedTierId : undefined;

  const isPaidEvent = apiEvent?.ticketType === 'PAID' && tiers.length > 0;
  const isFreeEvent = apiEvent && apiEvent.ticketType !== 'PAID';
  const isPublic = apiEvent?.visibility === 'PUBLIC';
  const requireEula = isPublic && (isPaidEvent || isFreeEvent);
  const canPurchase = !requireEula || eulaAccepted;

  const refreshQuote = useCallback(() => {
    if (!apiEvent?.id || !isPaidEvent) {
      setQuoteTotal(null);
      return;
    }
    getTicketQuote(apiEvent.id, null, apiTierId)
      .then((q) => setQuoteTotal(q.totalForBuyerUsd))
      .catch(() => setQuoteTotal(null));
  }, [apiEvent?.id, isPaidEvent, apiTierId]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const priceDisplay = useMemo(() => {
    if (!apiEvent) return null;
    if (!isPaidEvent) return 'Free';
    if (quoteTotal != null) return formatPrice(quoteTotal, apiEvent.currency);
    const t = tiers.find((x) => x.id === selectedTierId) || tiers[0];
    if (t?.priceUsd != null) return formatPrice(t.priceUsd, apiEvent.currency);
    return formatPrice(apiEvent.ticketPrice, apiEvent.currency);
  }, [apiEvent, isPaidEvent, quoteTotal, tiers, selectedTierId]);

  const startWalletCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) return;
    if (!canPurchase) {
      setJoinError('Please accept the EULA to continue.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const { clientSecret } = await purchaseTicket(apiEvent.id, apiTierId);
      setWalletSecret(clientSecret);
      setWalletOpen(true);
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Could not start wallet checkout.');
    } finally {
      setJoining(false);
    }
  };

  const startHostedCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) return;
    if (!canPurchase) {
      setJoinError('Please accept the EULA to continue.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { url } = await createCheckoutSession(
        apiEvent.id,
        `${origin}${basePath}?payment=success`,
        `${origin}${basePath}?payment=cancelled`,
        apiTierId
      );
      if (url) window.location.href = url;
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Checkout failed.');
    } finally {
      setJoining(false);
    }
  };

  const handleFreeTicket = async () => {
    if (!apiEvent || !isFreeEvent || !isAuthenticated || !user?.id) return;
    if (!canPurchase) {
      setJoinError('Please accept the EULA to continue.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      await generateTicket(user.id, apiEvent.id);
      setJoinSuccess(true);
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  if (eventLoading && !apiEvent) {
    return (
      <div className="pt-40 flex items-center justify-center text-white min-h-screen bg-black">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!apiEvent) {
    return (
      <div className="pt-40 text-center text-white min-h-screen bg-black">
        Event not found.
      </div>
    );
  }

  return (
    <>
      <div className="bg-black text-white min-h-screen">
        <div className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4">
            <Link
              href={`${basePath}/${apiEvent.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
              Back to event
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 max-w-lg">
          <div className="flex gap-4 mb-8">
            <img
              src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
              alt=""
              className="w-24 h-24 rounded-2xl object-cover border border-white/10 shrink-0"
              onError={onImageErrorToDefault}
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-pxi-purple mb-1">Checkout</p>
              <h1 className="text-xl font-black uppercase tracking-tight leading-tight">{apiEvent.name}</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {apiEvent.startDate
                  ? new Date(apiEvent.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                  : 'Date TBA'}
                {' · '}
                {apiEvent.location || 'Location TBA'}
              </p>
            </div>
          </div>

          <div className="glass-dark p-8 rounded-3xl border border-white/10 space-y-6">
            <h2 className="text-3xl font-black">{priceDisplay}</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Total for paid tickets includes service and processing fees — see quote when you select a tier.
            </p>

            {isPaidEvent && tiers.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ticket tier</p>
                {tiers.map((t) => (
                  <label
                    key={t.id ?? 'base'}
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      selectedTierId === t.id
                        ? 'border-pxi-purple bg-pxi-purple/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tier"
                        className="accent-pxi-purple"
                        checked={selectedTierId === t.id}
                        onChange={() => setSelectedTierId(t.id)}
                      />
                      <span className="font-bold">{t.label}</span>
                    </span>
                    <span className="text-sm font-black">{formatPrice(t.priceUsd, apiEvent.currency)}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {requireEula ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-pxi-purple">EULA — public event</p>
                <p className="text-zinc-400 text-xs leading-relaxed [&_a]:inline">{PUBLIC_EULA_COPY}</p>
                <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 accent-pxi-purple"
                    checked={eulaAccepted}
                    onChange={(e) => setEulaAccepted(e.target.checked)}
                  />
                  <span>I have read and agree to this agreement before purchasing or claiming a ticket.</span>
                </label>
              </div>
            ) : null}

            {!isAuthenticated ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                <p className="text-sm font-bold text-white">Sign in or create an account to continue</p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  We need your PXI account to issue your ticket. After you log in, you can pay with Apple Pay, Google Pay, Link,
                  or card (hosted checkout).
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={loginHref}
                    className="flex-1 text-center py-3 rounded-xl bg-pxi-purple text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    Log in
                  </Link>
                  <Link
                    href={signupHref}
                    className="flex-1 text-center py-3 rounded-xl border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            ) : null}

            {joinSuccess && (
              <p className="text-green-400 text-sm font-medium">You’re in! Open the PXI app to view your ticket.</p>
            )}
            {joinError && <p className="text-red-400 text-sm">{joinError}</p>}

            {isAuthenticated && isPaidEvent ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full uppercase tracking-widest py-4 !bg-pxi-purple hover:!bg-pxi-purple shadow-[0_0_20px_rgba(216,74,255,0.4)]"
                  onClick={startWalletCheckout}
                  disabled={joining || joinSuccess || !canPurchase}
                >
                  {joining && !walletOpen ? (
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  ) : (
                    'Apple Pay / Google Pay / Link'
                  )}
                </Button>
                <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  Opens secure Stripe payment (wallets when your browser supports them). Or use hosted checkout below.
                </p>
                <Button
                  variant="glass"
                  className="w-full uppercase tracking-widest py-4 border-white/10"
                  onClick={startHostedCheckout}
                  disabled={joining || joinSuccess || !canPurchase}
                >
                  Continue with card (hosted checkout)
                </Button>
              </div>
            ) : null}

            {isAuthenticated && isFreeEvent ? (
              <Button
                variant="primary"
                className="w-full uppercase tracking-widest py-4 !bg-pxi-purple hover:!bg-pxi-purple shadow-[0_0_20px_rgba(216,74,255,0.4)]"
                onClick={handleFreeTicket}
                disabled={joining || joinSuccess || !canPurchase}
              >
                {joining ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Get free ticket'}
              </Button>
            ) : null}

            <div className="flex items-start gap-2 px-1">
              <AlertCircle size={13} className="text-zinc-600 flex-shrink-0 mt-0.5" />
              <p className="text-zinc-600 text-xs leading-relaxed">
                The vendor flat fee and consumer fee structure apply to paid tickets as described at checkout. Face-value
                refunds depend on the organizer.
              </p>
            </div>
          </div>
        </div>
      </div>

      <StripePaymentModal
        open={walletOpen}
        clientSecret={walletSecret}
        returnUrl={stripeReturnUrl}
        onCancel={() => {
          setWalletOpen(false);
          setWalletSecret(null);
        }}
        onSuccess={() => {
          setWalletOpen(false);
          setWalletSecret(null);
          setJoinSuccess(true);
        }}
      />
    </>
  );
}
