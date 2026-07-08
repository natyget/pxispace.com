'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Loading02Icon,
  Alert01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  Location01Icon,
  Shield01Icon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons';
import Button from '../../components/ui/Button';
import { PxiSpinner } from '@/components/loading/PxiLoading';
import { eventsService } from '../../services/events';
import { getTicketQuote, generateTicket, purchaseTicket, getUserTickets, getMyCredits } from '../../services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { displayImageSrc } from '@/lib/mediaUrl';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import TicketEmailPreview from '@/components/tickets/TicketEmailPreview';
import TicketDeliveryActions from '@/components/tickets/TicketDeliveryActions';
import { buildTicketEmailPreviewInput } from '@/lib/ticketEmailPreview';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070';


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

function formatCheckoutDate(value) {
  if (!value) return 'Date TBA';
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CheckoutMeta({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.055] px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-white">
        <HugeiconsIcon icon={icon} size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className="mt-0.5 truncate text-xs font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function TrustItem({ children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold text-white/55">
      <span className="h-1.5 w-1.5 rounded-full bg-white/45" />
      {children}
    </div>
  );
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
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [walletSecret, setWalletSecret] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [issuedTicketId, setIssuedTicketId] = useState(null);
  const [issuedPreview, setIssuedPreview] = useState(null);
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [promoCode, setPromoCode] = useState('');

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
      const timer = setTimeout(() => setEventLoading(false), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setEventLoading(true);
      eventsService
        .getEvent(id)
        .then((data) => {
          if (!cancelled) setApiEvent(data.event || data);
        })
        .catch(() => {
          if (!cancelled) setApiEvent(null);
        })
        .finally(() => {
          if (!cancelled) setEventLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  const tiers = useMemo(() => (apiEvent ? parseTicketTiers(apiEvent) : []), [apiEvent]);

  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
  }, [tiers, tierFromUrl]);

  const apiTierId = typeof selectedTierId === 'string' ? selectedTierId : undefined;

  const isPaidEvent = apiEvent?.ticketType === 'PAID' && tiers.length > 0;
  const isFreeEvent = apiEvent && apiEvent.ticketType !== 'PAID';

  useEffect(() => {
    if (!apiEvent?.id || !isPaidEvent) {
      const timer = setTimeout(() => setQuoteTotal(null), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    getTicketQuote(apiEvent.id, null, apiTierId)
      .then((q) => {
        if (!cancelled) setQuoteTotal(q.totalForBuyerUsd);
      })
      .catch(() => {
        if (!cancelled) setQuoteTotal(null);
      });
    return () => { cancelled = true; };
  }, [apiEvent?.id, isPaidEvent, apiTierId]);

  const priceDisplay = useMemo(() => {
    if (!apiEvent) return null;
    if (!isPaidEvent) return 'Free';
    if (quoteTotal != null) return formatPrice(quoteTotal, apiEvent.currency);
    const t = tiers.find((x) => x.id === selectedTierId) || tiers[0];
    if (t?.priceUsd != null) return formatPrice(t.priceUsd, apiEvent.currency);
    return formatPrice(apiEvent.ticketPrice, apiEvent.currency);
  }, [apiEvent, isPaidEvent, quoteTotal, tiers, selectedTierId]);

  // PXI credits: fetch balance once signed in so the "use credits" toggle can render.
  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => setCreditBalanceCents(0), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    getMyCredits()
      .then((res) => {
        if (!cancelled) setCreditBalanceCents(res?.balanceCents ?? 0);
      })
      .catch(() => {
        if (!cancelled) setCreditBalanceCents(0);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const startWalletCheckout = async () => {
    if (!apiEvent || !isPaidEvent || !isAuthenticated || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { clientSecret } = await purchaseTicket(apiEvent.id, apiTierId, {
        applyCredits: useCredits && creditBalanceCents > 0,
        promoCode: promoCode.trim() || undefined,
      });
      setWalletSecret(clientSecret);
      setWalletOpen(true);
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Could not start wallet checkout.');
    } finally {
      setJoining(false);
    }
  };

  /** After successful free ticket issue, fire the album/event deep link so the native app opens to it. */
  const eventAlbumId = apiEvent?.albumId || apiEvent?.albums?.[0]?.id || null;
  const successDeepLinkUrl = eventAlbumId
    ? `pxi://album/${eventAlbumId}`
    : apiEvent?.id
      ? `pxi://event/${apiEvent.id}`
      : null;

  const handleFreeTicket = async () => {
    if (!apiEvent || !isFreeEvent || !isAuthenticated || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await generateTicket(user.id, apiEvent.id);
      setJoinSuccess(true);
      const ticketId = result?.ticket?.id ?? null;
      const qrValue = result?.ticket?.pasetoToken ?? null;
      setIssuedTicketId(ticketId);
      if (ticketId && qrValue && apiEvent) {
        setIssuedPreview(buildTicketEmailPreviewInput(apiEvent, ticketId, qrValue));
      } else {
        setIssuedPreview(null);
      }
      // Attempt to open the album in the app right away on mobile; harmless if app isn't installed.
      if (successDeepLinkUrl && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('pxi_pending_deeplink', successDeepLinkUrl);
        } catch {
          /* private browsing / storage disabled; deep link still attempted below */
        }
        const ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod|Android/i.test(ua)) {
          window.location.href = successDeepLinkUrl;
        }
      }
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  if (eventLoading && !apiEvent) {
    return (
      <div className="pt-40 flex items-center justify-center text-white min-h-screen bg-black">
        <PxiSpinner size="lg" className="mx-auto" />
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

  const checkoutDate = formatCheckoutDate(apiEvent.startDate);
  const checkoutLocation = apiEvent.location || 'Location TBA';
  const selectedTier = tiers.find((x) => x.id === selectedTierId) || tiers[0];
  const faceValue = isPaidEvent
    ? formatPrice(selectedTier?.priceUsd ?? apiEvent.ticketPrice, apiEvent.currency)
    : 'Free';

  return (
    <>
      <div className="relative text-white min-h-screen bg-[#050505] overflow-x-hidden font-sans">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {apiEvent?.coverImage ? (
            <img
              src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover scale-125 blur-[54px] opacity-[0.22]"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_12%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.78),#050505_46%,#000)]" />
        </div>

        {/* Custom Scrollbar for this page */}
        <style dangerouslySetInnerHTML={{__html: `
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}} />

        <div className="relative z-10">
          <div className="fixed top-24 left-5 z-30 md:left-8">
            <Link
              href={`${basePath}/${apiEvent.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 shadow-lg backdrop-blur-xl transition-all hover:bg-black/70 hover:text-white"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Event
            </Link>
          </div>

          <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-28 sm:px-6 lg:px-8">
            <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
              <section className="min-w-0">
                <div className="overflow-hidden rounded-[2rem] bg-white/[0.045] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:rounded-[2.5rem]">
                  <div className="grid gap-0 md:grid-cols-[minmax(0,0.86fr)_minmax(320px,1fr)]">
                    <div className="relative min-h-[360px] overflow-hidden bg-zinc-900 md:min-h-[620px]">
                      <img
                        src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
                        alt={apiEvent.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">PXI checkout</p>
                        <h1 className="mt-2 text-4xl font-black leading-[0.9] tracking-normal text-white md:text-6xl">
                          {apiEvent.name}
                        </h1>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                          <CheckoutMeta icon={Calendar03Icon} label="When" value={checkoutDate} />
                          <CheckoutMeta icon={Location01Icon} label="Where" value={checkoutLocation} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-5 md:p-7">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Order summary</p>
                            <h2 className="mt-2 text-4xl font-black leading-none text-white">{priceDisplay}</h2>
                          </div>
                          <div className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black">
                            {isPaidEvent ? 'Paid' : 'Free'}
                          </div>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                          {isPaidEvent
                            ? 'Total includes PXI service and Stripe processing costs. Your ticket is issued after payment clears.'
                            : 'This event is free to join. PXI will issue your ticket immediately after confirmation.'}
                        </p>

                  {isPaidEvent && tiers.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Choose ticket</p>
                      {tiers.map((t) => (
                        <label
                          key={t.id ?? 'base'}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-[1.25rem] p-4 transition-colors ${
                            selectedTierId === t.id
                              ? 'bg-white/[0.12] text-white'
                              : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.07]'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                              selectedTierId === t.id ? 'border-white bg-white text-black' : 'border-white/30 bg-transparent'
                            }`}>
                              {selectedTierId === t.id && (
                                <span className="h-2 w-2 rounded-full bg-black" />
                              )}
                            </span>
                            <span className="font-bold text-white text-sm">{t.label}</span>
                          </span>
                          <span className="text-sm font-black text-white">{formatPrice(t.priceUsd, apiEvent.currency)}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}

                        <div className="mt-5 rounded-[1.25rem] bg-white/[0.035] p-4">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-zinc-500">Ticket</span>
                            <span className="font-bold text-white">{selectedTier?.label || 'General admission'}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                            <span className="text-zinc-500">Face value</span>
                            <span className="font-bold text-white">{faceValue}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm">
                            <span className="font-bold text-white">Due today</span>
                            <span className="text-lg font-black text-white">{priceDisplay}</span>
                          </div>
                        </div>
                      </div>

                  {joinSuccess ? (
                    <div className="mt-6 space-y-6">
                      <div className="space-y-4 rounded-[1.5rem] bg-white/[0.045] p-5">
                        <div className="text-center space-y-1">
                           <p className="text-lg font-black uppercase tracking-widest text-white">You’re in!</p>
                           <p className="text-sm text-zinc-400">Your spot is confirmed.</p>
                        </div>
                        {eventAlbumId ? (
                          <Link
                            href={`/album/${eventAlbumId}`}
                            className="inline-flex w-full items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 text-xs font-black uppercase tracking-widest text-white transition hover:scale-105 border-0"
                          >
                            Open album
                          </Link>
                        ) : null}
                        {successDeepLinkUrl ? (
                          <a
                            href={successDeepLinkUrl}
                            className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 py-3 text-center text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
                          >
                            Open in PXI app
                          </a>
                        ) : null}
                        {issuedTicketId && issuedPreview ? (
                          <>
                            <TicketEmailPreview preview={issuedPreview} className="mt-2" compact />
                            <TicketDeliveryActions ticketId={issuedTicketId} className="mt-3" />
                          </>
                        ) : (
                          <p className="text-zinc-400 text-xs text-center">Preparing your ticket…</p>
                        )}
                      </div>

                      {/* Browse More Events button once checked out */}
                      <Link
                        href="/events"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-zinc-200"
                      >
                        Browse More Events
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6">
                      {!isAuthenticated ? (
                        <div className="space-y-4 rounded-[1.5rem] bg-white/[0.045] p-5">
                          <p className="text-sm font-bold text-white">Sign in or create an account to continue</p>
                          <p className="text-zinc-500 text-xs leading-relaxed">
                            We need your PXI account to issue your ticket. After you log in, you can pay with Apple Pay, Google Pay, Link,
                            or card.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                              href={loginHref}
                              className="flex-1 rounded-full bg-white py-3.5 text-center text-xs font-black uppercase tracking-widest text-black transition hover:bg-zinc-200"
                            >
                              Log in
                            </Link>
                            <Link
                              href={signupHref}
                              className="flex-1 rounded-full bg-white/[0.07] py-3.5 text-center text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/[0.12]"
                            >
                              Sign up
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {joinError && <p className="text-red-400 text-sm">{joinError}</p>}

                      {isAuthenticated && isPaidEvent ? (
                        <div className="space-y-2 pt-2">
                          {creditBalanceCents > 0 ? (
                            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 cursor-pointer">
                              <span className="text-xs text-zinc-300">
                                Use my PXI credits
                                <span className="ml-1.5 font-bold text-white">
                                  (${(creditBalanceCents / 100).toFixed(2)} available)
                                </span>
                                <span className="block text-[10px] text-zinc-500 mt-0.5">
                                  Credits discount PXI fees on this order; applied at payment.
                                </span>
                              </span>
                              <input
                                type="checkbox"
                                checked={useCredits}
                                onChange={(e) => setUseCredits(e.target.checked)}
                                className="h-4 w-4 accent-white"
                              />
                            </label>
                          ) : null}
                          <input
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Promo / ambassador code (optional)"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 outline-none focus:border-white/25"
                          />
                          <Button
                            variant="neon"
                            className="w-full rounded-full py-3.5 uppercase tracking-widest shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60 disabled:scale-95"
                            onClick={startWalletCheckout}
                            disabled={joining}
                          >
                            {joining && !walletOpen ? (
                              <PxiSpinner size="sm" className="mx-auto" />
                            ) : (
                              'Continue to payment'
                            )}
                          </Button>
                          <p className="text-center text-[10px] text-zinc-500">
                            Apple Pay, Google Pay, and card accepted via Stripe on the next step.
                          </p>
                        </div>
                      ) : null}

                      {isAuthenticated && isFreeEvent ? (
                        <Button
                          variant="neonOrange"
                          className="w-full rounded-full py-4 uppercase tracking-widest transition-all duration-300 hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60 disabled:scale-95"
                          onClick={handleFreeTicket}
                          disabled={joining}
                        >
                          {joining ? <PxiSpinner size="sm" className="mx-auto" /> : 'Join Event'}
                        </Button>
                      ) : null}

                      <p className="text-center text-[10px] text-zinc-500 pt-2">
                        By joining, you agree to our{' '}
                        <Link href="/legal#terms" className="underline hover:text-zinc-400">Terms of Service</Link>.
                      </p>

                      <div className="flex items-start gap-2 px-1">
                        <HugeiconsIcon icon={Alert01Icon} size={13} className="text-zinc-600 flex-shrink-0 mt-0.5" />
                        <p className="text-zinc-600 text-xs leading-relaxed">
                          Paid tickets are processed by Stripe — PXI never sees or stores your card details. Refunds are
                          issued at the organizer&apos;s discretion.
                        </p>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <TrustItem>Stripe-secured payment</TrustItem>
                  <TrustItem>Signed ticket delivery</TrustItem>
                  <TrustItem>No card details stored by PXI</TrustItem>
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-[2rem] bg-white/[0.045] p-5 shadow-2xl backdrop-blur-2xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Ticket preview</p>
                    <HugeiconsIcon icon={Ticket01Icon} size={18} className="text-white opacity-45" />
                  </div>
                  <div className="overflow-hidden rounded-[1.5rem] bg-black">
                    <div className="relative aspect-[16/11]">
                      <img
                        src={displayImageSrc(apiEvent.coverImage, DEFAULT_IMG)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <p className="absolute bottom-4 left-4 right-4 text-xl font-black leading-tight text-white">{apiEvent.name}</p>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Admission</span>
                        <span className="text-sm font-black text-white">{selectedTier?.label || 'General admission'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Price</span>
                        <span className="text-sm font-black text-white">{priceDisplay}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white/[0.045] p-5 backdrop-blur-2xl">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
                      <HugeiconsIcon icon={Shield01Icon} size={18} className="text-white opacity-70" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Your ticket is tied to your PXI identity.</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        After checkout, PXI issues a signed ticket and keeps delivery actions available from your account.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </main>
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
        onSuccess={async () => {
          setWalletOpen(false);
          setWalletSecret(null);
          setJoinSuccess(true);
          // Paid-ticket fulfillment happens in the Stripe webhook, so the ticket
          // row may take a moment to appear. Poll briefly for the matching ticket
          // so the delivery-actions block can show wallet/email buttons.
          if (apiEvent?.id && user?.id) {
            for (let i = 0; i < 6; i += 1) {
              try {
                const tickets = await getUserTickets(user.id);
                const found = tickets.find((t) => t.eventId === apiEvent.id);
                if (found?.id && found.pasetoSignature) {
                  setIssuedTicketId(found.id);
                  setIssuedPreview(
                    buildTicketEmailPreviewInput(apiEvent, found.id, found.pasetoSignature, {
                      selectedTierId: apiTierId,
                    }),
                  );
                  break;
                }
              } catch {
                // Network blip while polling for the webhook-issued ticket; retry below.
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        }}
      />
    </>
  );
}
