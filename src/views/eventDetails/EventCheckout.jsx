'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
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
import { createBranchInstallLink } from '@/lib/branchLinks';

/** Branded gradient stand-in for events without cover art (no external fallback image). */
const COVER_PLACEHOLDER_BG =
  'bg-[radial-gradient(circle_at_18%_20%,rgba(216,74,255,0.38),transparent_52%),radial-gradient(circle_at_82%_80%,rgba(124,42,232,0.3),transparent_55%),linear-gradient(160deg,#1a1024_0%,#0a0611_55%,#050505_100%)]';

function CoverArt({ src, alt = '', className = '' }) {
  if (src) {
    return <img src={src} alt={alt} className={`object-cover ${className}`} />;
  }
  return (
    <div className={`${COVER_PLACEHOLDER_BG} ${className}`} aria-hidden>
      <span className="absolute left-4 top-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
        PXI
      </span>
    </div>
  );
}

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
    <div className="flex min-w-0 items-center gap-3 rounded-[20px] bg-white/[0.055] px-3.5 py-3 backdrop-blur-xl">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-white">
        <HugeiconsIcon icon={icon} size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className="mt-0.5 truncate text-xs font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

/** One row of the visible ticket-issuing progress. state: 'done' | 'active' | 'pending' */
function TicketStep({ state, label, hint }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center pt-px">
        {state === 'done' ? (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="text-[#d84aff]" />
        ) : state === 'active' ? (
          <PxiSpinner size="sm" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-white/20" />
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-bold ${state === 'pending' ? 'text-white/35' : 'text-white'}`}>{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{hint}</p> : null}
      </div>
    </div>
  );
}

const CONFETTI_PIECES = [
  { x: -78, y: -52, c: '#d84aff', d: 0 },
  { x: -44, y: -84, c: '#ffffff', d: 40 },
  { x: -16, y: -66, c: '#d84aff', d: 90 },
  { x: 18, y: -88, c: '#a855f7', d: 20 },
  { x: 48, y: -60, c: '#ffffff', d: 70 },
  { x: 82, y: -46, c: '#d84aff', d: 110 },
  { x: -66, y: -14, c: '#a855f7', d: 60 },
  { x: 66, y: -10, c: '#d84aff', d: 30 },
  { x: -30, y: -34, c: '#ffffff', d: 130 },
  { x: 34, y: -32, c: '#a855f7', d: 100 },
];

/**
 * Celebration header for the success state: the check pops in with a purple glow
 * and a one-shot confetti burst, driven by framer-motion (no injected CSS, no
 * manual JS animation loop).
 */
function SuccessCelebration({ title, subtitle }) {
  return (
    <div className="relative flex flex-col items-center pt-2 text-center">
      <div className="pointer-events-none absolute left-1/2 top-9 h-0 w-0" aria-hidden>
        {CONFETTI_PIECES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: p.c }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 0.35 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.08 + p.d / 1000 }}
          />
        ))}
      </div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d84aff]/15 text-[#d84aff] shadow-[0_0_44px_-4px_rgba(216,74,255,0.6)] backdrop-blur-xl"
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={34} />
      </motion.div>
      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="mt-4 text-2xl font-black tracking-tight text-white"
      >
        {title}
      </motion.p>
      <p className="mt-1 text-xs font-bold text-zinc-400">{subtitle}</p>
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
  // Visible progress for the post-payment webhook wait: 'issuing' | 'ready' | 'delayed'.
  const [ticketStatus, setTicketStatus] = useState('issuing');
  const [creditBalanceCents, setCreditBalanceCents] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);

  const checkoutReturnPath = useMemo(() => {
    if (!id) return basePath;
    const qs = selectedTierId ? `?tier=${encodeURIComponent(selectedTierId)}` : '';
    return `${basePath}/${id}/checkout${qs}`;
  }, [id, selectedTierId, basePath]);

  const loginHref = `/login?redirect=${encodeURIComponent(checkoutReturnPath)}`;
  const signupHref = `/login?mode=signup&redirect=${encodeURIComponent(checkoutReturnPath)}`;

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
        emailOptIn,
        smsOptIn: smsOptIn && !!user?.phoneNumber,
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
      const result = await generateTicket(user.id, apiEvent.id, {
        emailOptIn,
        smsOptIn: smsOptIn && !!user?.phoneNumber,
      });
      setJoinSuccess(true);
      const ticketId = result?.ticket?.id ?? null;
      const qrValue = result?.ticket?.pasetoToken ?? null;
      setIssuedTicketId(ticketId);
      if (ticketId && qrValue && apiEvent) {
        setIssuedPreview(buildTicketEmailPreviewInput(apiEvent, ticketId, qrValue));
        setTicketStatus('ready');
      } else {
        setIssuedPreview(null);
        setTicketStatus('delayed');
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
          // Branch install handoff: mint a Branch link in parallel with the
          // pxi:// attempt. If the app doesn't open (page still visible after
          // ~1.5s → not installed), redirect through the Branch link so the
          // post-install open deep-links back to this album/event. If Branch
          // fails or times out (resolves null), nothing extra happens — the
          // user stays on the success page exactly as today.
          let branchLink = null;
          createBranchInstallLink({ url: successDeepLinkUrl, feature: 'post-checkout' })
            .then((link) => {
              branchLink = link;
            })
            .catch(() => {});
          const start = Date.now();
          let handoffTimer = null;
          const cleanup = () => {
            if (handoffTimer) clearTimeout(handoffTimer);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', onPageHide);
          };
          const onVisibility = () => {
            if (document.visibilityState === 'hidden') cleanup();
          };
          const onPageHide = () => cleanup();
          document.addEventListener('visibilitychange', onVisibility);
          window.addEventListener('pagehide', onPageHide);
          handoffTimer = setTimeout(() => {
            cleanup();
            if (branchLink && Date.now() - start < 2500 && document.visibilityState === 'visible') {
              window.location.href = branchLink;
            }
          }, 1500);
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
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <PxiSpinner size="lg" className="mx-auto" />
      </div>
    );
  }

  if (!apiEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
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
  const coverSrc = displayImageSrc(apiEvent.coverImage);

  return (
    <>
      <div className="relative h-dvh overflow-y-auto overflow-x-hidden bg-[#050505] font-sans text-white [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-[0.22] blur-[54px]"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_12%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_75%_85%,rgba(216,74,255,0.08),transparent_40%),linear-gradient(180deg,rgba(0,0,0,0.78),#050505_46%,#000)]" />
        </div>

        <div className="relative z-10">
          <div className="fixed left-5 top-5 z-30 md:left-8 md:top-6">
            <Link
              href={`${basePath}/${apiEvent.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/70 shadow-[0_10px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all hover:bg-white/[0.14] hover:text-white"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Event
            </Link>
          </div>

          <main className="mx-auto flex min-h-dvh w-full max-w-4xl items-center px-4 pb-12 pt-24 sm:px-6 lg:px-8">
            <div className="w-full">
              <section className="min-w-0">
                <div className="overflow-hidden rounded-[2rem] bg-white/[0.045] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:rounded-[2.5rem]">
                  <div className="grid gap-0 md:grid-cols-[minmax(0,0.86fr)_minmax(320px,1fr)]">
                    <div className="relative min-h-[360px] overflow-hidden md:min-h-[620px]">
                      <CoverArt src={coverSrc} alt={apiEvent.name} className="absolute inset-0 h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">PXI checkout</p>
                        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-normal text-white md:text-5xl">
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
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Choose ticket</p>
                            <div className="grid gap-2.5">
                              {tiers.map((t) => {
                                const selected = selectedTierId === t.id;
                                return (
                                  <button
                                    key={t.id ?? 'base'}
                                    type="button"
                                    onClick={() => setSelectedTierId(t.id)}
                                    aria-pressed={selected}
                                    className={`flex items-center justify-between gap-3 rounded-[20px] p-4 text-left backdrop-blur-xl transition-all duration-200 ${
                                      selected
                                        ? 'bg-[rgba(216,74,255,0.16)] shadow-[0_0_32px_-6px_rgba(216,74,255,0.6)]'
                                        : 'bg-[rgba(26,26,26,0.6)] hover:bg-[rgba(26,26,26,0.78)]'
                                    }`}
                                  >
                                    <span className="min-w-0">
                                      <span className={`block truncate text-sm font-black ${selected ? 'text-white' : 'text-white/85'}`}>
                                        {t.label}
                                      </span>
                                      <span
                                        className={`mt-1 block text-[10px] font-black uppercase tracking-[0.18em] ${
                                          selected ? 'text-[#d84aff]' : 'text-white/35'
                                        }`}
                                      >
                                        {selected ? 'Selected' : 'Tap to select'}
                                      </span>
                                    </span>
                                    <span className={`shrink-0 text-base font-black ${selected ? 'text-white' : 'text-white/70'}`}>
                                      {formatPrice(t.priceUsd, apiEvent.currency)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-5 rounded-[20px] bg-white/[0.035] p-4">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-zinc-500">Ticket</span>
                            <span className="font-bold text-white">{selectedTier?.label || 'General admission'}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                            <span className="text-zinc-500">Face value</span>
                            <span className="font-bold text-white">{faceValue}</span>
                          </div>
                          <div className="mt-3 h-px w-full bg-white/10" />
                          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                            <span className="font-bold text-white">Due today</span>
                            <span className="text-lg font-black text-white">{priceDisplay}</span>
                          </div>
                        </div>
                      </div>

                      {joinSuccess ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="mt-6 space-y-4"
                        >
                          <div className="space-y-5 rounded-[20px] bg-white/[0.045] p-5 backdrop-blur-xl">
                            <SuccessCelebration title="You’re in!" subtitle="Your spot is confirmed." />

                            <div className="space-y-3 rounded-[20px] bg-white/[0.04] p-4">
                              <TicketStep state="done" label={isPaidEvent ? 'Payment confirmed' : 'Spot reserved'} />
                              <TicketStep
                                state={ticketStatus === 'ready' ? 'done' : ticketStatus === 'issuing' ? 'active' : 'done'}
                                label={ticketStatus === 'issuing' ? 'Preparing your ticket…' : 'Signed ticket issued'}
                                hint={
                                  ticketStatus === 'issuing'
                                    ? 'Securing your ticket — this usually takes a few seconds.'
                                    : ticketStatus === 'delayed'
                                      ? 'Taking a little longer than usual. Your ticket will also arrive by email.'
                                      : null
                                }
                              />
                              <TicketStep
                                state={ticketStatus === 'ready' ? 'done' : 'pending'}
                                label="Ready for delivery"
                              />
                            </div>

                            {eventAlbumId ? (
                              <Link
                                href={`/album/${eventAlbumId}`}
                                className="inline-flex w-full items-center justify-center rounded-full bg-white/10 py-3 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/20"
                              >
                                Open album
                              </Link>
                            ) : null}
                            {successDeepLinkUrl ? (
                              <a
                                href={successDeepLinkUrl}
                                className="inline-flex w-full items-center justify-center rounded-full bg-white/5 py-3 text-center text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
                              >
                                Open in PXI app
                              </a>
                            ) : null}
                            {issuedTicketId && issuedPreview ? (
                              <>
                                <TicketEmailPreview preview={issuedPreview} className="mt-2" compact />
                                <TicketDeliveryActions ticketId={issuedTicketId} className="mt-3" />
                              </>
                            ) : null}
                          </div>

                          {/* Browse More Events button once checked out */}
                          <Link
                            href="/events"
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-zinc-200"
                          >
                            Browse More Events
                          </Link>
                        </motion.div>
                      ) : (
                        <div className="mt-6">
                          {!isAuthenticated ? (
                            <div className="space-y-4 rounded-[20px] bg-white/[0.045] p-5 backdrop-blur-xl">
                              <p className="text-sm font-bold text-white">Sign in or create an account to continue</p>
                              <p className="text-xs leading-relaxed text-zinc-500">
                                We need your PXI account to issue your ticket. After you log in, you can pay with Apple Pay, Google Pay, Link,
                                or card.
                              </p>
                              <div className="flex flex-col gap-3 sm:flex-row">
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

                          {joinError && <p className="text-sm text-red-400">{joinError}</p>}

                          {isAuthenticated ? (
                            <div className="space-y-2 pb-2">
                              <label className="flex cursor-pointer items-center gap-3 rounded-[16px] bg-white/[0.03] px-4 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={emailOptIn}
                                  onChange={(e) => setEmailOptIn(e.target.checked)}
                                  className="h-4 w-4 accent-[#d84aff]"
                                />
                                <span className="text-xs text-zinc-400">Email me about this host&apos;s future events</span>
                              </label>
                              {user?.phoneNumber ? (
                                <label className="flex cursor-pointer items-center gap-3 rounded-[16px] bg-white/[0.03] px-4 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={smsOptIn}
                                    onChange={(e) => setSmsOptIn(e.target.checked)}
                                    className="h-4 w-4 accent-[#d84aff]"
                                  />
                                  <span className="text-xs text-zinc-400">Text me about this host&apos;s future events</span>
                                </label>
                              ) : null}
                            </div>
                          ) : null}

                          {isAuthenticated && isPaidEvent ? (
                            <div className="space-y-2 pt-2">
                              {creditBalanceCents > 0 ? (
                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[20px] bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
                                  <span className="text-xs text-zinc-300">
                                    Use my PXI credits
                                    <span className="ml-1.5 font-bold text-white">
                                      (${(creditBalanceCents / 100).toFixed(2)} available)
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-zinc-500">
                                      Credits discount PXI fees on this order; applied at payment.
                                    </span>
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={useCredits}
                                    onChange={(e) => setUseCredits(e.target.checked)}
                                    className="h-4 w-4 accent-[#d84aff]"
                                  />
                                </label>
                              ) : null}
                              <input
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="Promo / ambassador code (optional)"
                                className="w-full rounded-[20px] bg-white/[0.05] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white outline-none backdrop-blur-xl transition-shadow placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 focus:shadow-[0_0_0_1.5px_rgba(216,74,255,0.5)]"
                              />
                              <Button
                                variant="neon"
                                className="w-full rounded-full py-3.5 uppercase tracking-widest shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:scale-95 disabled:cursor-wait disabled:opacity-60"
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
                              className="w-full rounded-full py-4 uppercase tracking-widest transition-all duration-300 hover:scale-[1.01] disabled:scale-95 disabled:cursor-wait disabled:opacity-60"
                              onClick={handleFreeTicket}
                              disabled={joining}
                            >
                              {joining ? <PxiSpinner size="sm" className="mx-auto" /> : 'Join Event'}
                            </Button>
                          ) : null}

                          <p className="pt-2 text-center text-[10px] text-zinc-500">
                            By joining, you agree to our{' '}
                            <Link href="/legal#terms" className="underline hover:text-zinc-400">Terms of Service</Link>.
                          </p>

                          <div className="flex items-start gap-2 px-1">
                            <HugeiconsIcon icon={Alert01Icon} size={13} className="mt-0.5 flex-shrink-0 text-zinc-600" />
                            <p className="text-xs leading-relaxed text-zinc-600">
                              Paid tickets are processed by Stripe — PXI never sees or stores your card details. Refunds are
                              issued at the organizer&apos;s discretion.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
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
          setTicketStatus('issuing');
          // Paid-ticket fulfillment happens in the Stripe webhook, so the ticket
          // row may take a moment to appear. Poll briefly for the matching ticket
          // so the delivery-actions block can show wallet/email buttons.
          let found = null;
          if (apiEvent?.id && user?.id) {
            for (let i = 0; i < 6; i += 1) {
              try {
                const tickets = await getUserTickets(user.id);
                found = tickets.find((t) => t.eventId === apiEvent.id) || null;
                if (found?.id && found.pasetoSignature) {
                  setIssuedTicketId(found.id);
                  setIssuedPreview(
                    buildTicketEmailPreviewInput(apiEvent, found.id, found.pasetoSignature, {
                      selectedTierId: apiTierId,
                    }),
                  );
                  setTicketStatus('ready');
                  break;
                }
                found = null;
              } catch {
                // Network blip while polling for the webhook-issued ticket; retry below.
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
          if (!found) setTicketStatus('delayed');
        }}
      />
    </>
  );
}
