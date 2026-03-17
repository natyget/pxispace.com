'use client';

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { publicEvents } from "./eventsData";
import { Calendar, MapPin, Users, Tag, AlertCircle, X, Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { eventsService } from "../../services/events";
import { getTicketQuote, createCheckoutSession, generateTicket } from "../../services/tickets";
import { useAuth } from "@/contexts/AuthContext";

const formatPrice = (usd, currency = 'USD') => {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
};

const EventDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [apiEvent, setApiEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(!!id);
  const [showConsent, setShowConsent] = useState(false);
  const [quoteTotal, setQuoteTotal] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const numericId = id != null && /^\d+$/.test(String(id)) ? Number(id) : null;
  const mockEvent = numericId != null ? publicEvents.find(e => e.id === numericId) : null;
  const event = apiEvent ?? mockEvent;

  useEffect(() => {
    if (!id) {
      setEventLoading(false);
      return;
    }
    setEventLoading(true);
    eventsService.getEvent(id)
      .then((data) => setApiEvent(data.event || data))
      .catch(() => setApiEvent(null))
      .finally(() => setEventLoading(false));
  }, [id]);

  const isPaidEvent = apiEvent?.ticketType === 'PAID' && (apiEvent?.ticketPrice ?? 0) > 0;
  const isFreeEvent = apiEvent && apiEvent.ticketType !== 'PAID';
  const priceDisplay = apiEvent
    ? (isPaidEvent ? formatPrice(quoteTotal != null ? quoteTotal : apiEvent.ticketPrice, apiEvent.currency) : 'Free')
    : (mockEvent?.price ?? null);

  const handleGetTicketClick = () => {
    setJoinError(null);
    setJoinSuccess(false);
    setQuoteTotal(null);
    setShowConsent(true);
    if (apiEvent?.ticketType === 'PAID' && (apiEvent?.ticketPrice ?? 0) > 0 && apiEvent?.id) {
      getTicketQuote(apiEvent.id)
        .then((q) => setQuoteTotal(q.totalForBuyerUsd))
        .catch(() => setQuoteTotal(null));
    }
  };

  const handleEulaConfirm = async () => {
    if (!apiEvent) {
      setShowConsent(false);
      return;
    }
    if (!isAuthenticated || !user?.id) {
      setJoinError('Please sign in to get a ticket.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      if (isPaidEvent) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { url } = await createCheckoutSession(
          apiEvent.id,
          `${origin}/events?payment=success`,
          `${origin}/events?payment=cancelled`
        );
        setShowConsent(false);
        if (url) window.open(url, '_blank');
      } else {
        await generateTicket(user.id, apiEvent.id);
        setShowConsent(false);
        setJoinSuccess(true);
      }
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  if (eventLoading && !event) {
    return (
      <div className="pt-40 flex items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pt-40 text-center text-white">
        Event not found.
      </div>
    );
  }

  return (
    <>
    <div className="bg-black text-white min-h-screen">

      {/* HERO */}
      <section className="relative h-[80vh] flex items-end">
        <img
          src={event.coverImage || event.image}
          alt={event.name || event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

        <div className="relative z-10 container mx-auto px-6 pb-20">
          <span className="glass px-4 py-2 rounded-full text-xs uppercase">
            {event.status}
          </span>

          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mt-6">
            {event.name || event.title}
          </h1>

          <p className="text-zinc-400 text-xl mt-4">
            {event.location} • {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : event.date}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <div className="container mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-3 gap-16">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-16">

          {/* META STRIP */}
          <div className="glass-dark p-8 rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-6 border border-white/5">

            <div className="flex items-center gap-3">
              <Calendar className="text-pxi-purple" />
              <span>{event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : event.date}</span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="text-pxi-purple" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center gap-3">
              <Users className="text-pxi-purple" />
              <span>{event.members} Attending</span>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="text-pxi-purple" />
              <span>{event.ticketType === 'PAID' ? 'Paid' : event.type ?? 'Event'}</span>
            </div>

          </div>

          {/* ABOUT */}
          <div>
            <h2 className="text-4xl font-black uppercase mb-6">
              About This Event
            </h2>

            <p className="text-zinc-400 leading-relaxed text-lg">
              {event.description || 'This is where your long-form event description goes. Talk about the vibe, the lineup, the energy, the exclusivity. Make it immersive.'}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN - TICKET PANEL */}
        <div className="lg:sticky top-32 h-fit glass-dark p-10 rounded-3xl border border-white/10">

          <h3 className="text-3xl font-black mb-6">
            {priceDisplay ?? event.price}
          </h3>

          {joinSuccess && (
            <p className="text-green-400 text-sm font-medium mb-4">
              You’re in! Check your email or open the PXI app to view your ticket.
            </p>
          )}
          {joinError && (
            <p className="text-red-400 text-sm mb-4">{joinError}</p>
          )}

          <Button
            variant="neon"
            className="w-full uppercase tracking-widest py-4"
            onClick={handleGetTicketClick}
            disabled={joining || (apiEvent && joinSuccess)}
          >
            {joining ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Get Ticket'}
          </Button>

          {/* Refund Policy Disclosure */}
          <div className="mt-4 flex items-start gap-2 px-1">
            <AlertCircle size={13} className="text-zinc-600 flex-shrink-0 mt-0.5" />
            <p className="text-zinc-600 text-xs leading-relaxed">
              The $0.90 vendor flat fee and 4.59% consumer fee are{' '}
              <span className="text-zinc-500 font-semibold">non-refundable</span>{' '}
              even if the event is cancelled or rescheduled. Ticket face value
              refund eligibility is determined by the event organizer.
            </p>
          </div>

        </div>

      </div>
    </div>

    {/* Public Event Consent Gate (EULA) */}

    {showConsent && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !joining && setShowConsent(false)} />
        <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-pxi-purple text-xs font-bold uppercase tracking-widest mb-1">Heads Up</p>
              <h3 className="text-white text-xl font-black">
                {isPaidEvent ? 'Get Ticket' : 'Public Event Notice'}
              </h3>
            </div>
            <button onClick={() => !joining && setShowConsent(false)} className="text-zinc-500 hover:text-white transition-colors mt-1">
              <X size={20} />
            </button>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {isPaidEvent
              ? `You're about to purchase a ticket for "${event.name || event.title}". Photos posted in public events may be used for marketing by the host.${priceDisplay ? ` Total: ${priceDisplay}` : ''}`
              : 'Photos posted in this public event may be visible to everyone and used in PXI marketing materials by the event host. If you prefer privacy, look for private events instead.'}
          </p>
          {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
          <div className="flex flex-row gap-3 pt-1">
            <Button
              variant="neon"
              className="w-full uppercase tracking-widest py-3"
              onClick={handleEulaConfirm}
              disabled={joining || (apiEvent && !isAuthenticated)}
            >
              {joining ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Agree & Get Ticket'}
            </Button>
            <button
              onClick={() => !joining && setShowConsent(false)}
              className="w-full py-3 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
};

export default EventDetails;
