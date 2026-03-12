'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { publicEvents } from "./eventsData";
import { Calendar, MapPin, Users, Tag, AlertCircle, X } from "lucide-react";
import Button from "../../components/ui/Button";

const EventDetails = () => {
  const { id } = useParams();
  const event = publicEvents.find(e => e.id === Number(id));
  const [showConsent, setShowConsent] = useState(false);

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
          src={event.image}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

        <div className="relative z-10 container mx-auto px-6 pb-20">
          <span className="glass px-4 py-2 rounded-full text-xs uppercase">
            {event.status}
          </span>

          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mt-6">
            {event.title}
          </h1>

          <p className="text-zinc-400 text-xl mt-4">
            {event.location} • {event.date}
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
              <span>{event.date}</span>
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
              <span>{event.type}</span>
            </div>

          </div>

          {/* ABOUT */}
          <div>
            <h2 className="text-4xl font-black uppercase mb-6">
              About This Event
            </h2>

            <p className="text-zinc-400 leading-relaxed text-lg">
              This is where your long-form event description goes. 
              Talk about the vibe, the lineup, the energy, the exclusivity.
              Make it immersive.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN - TICKET PANEL */}
        <div className="lg:sticky top-32 h-fit glass-dark p-10 rounded-3xl border border-white/10">

          <h3 className="text-3xl font-black mb-6">
            {event.price}
          </h3>

          <Button
            variant="neon"
            className="w-full uppercase tracking-widest py-4"
            onClick={() => setShowConsent(true)}
          >
            Get Ticket
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

    {/* Public Event Consent Gate */}

    {showConsent && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConsent(false)} />
        <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-pxi-purple text-xs font-bold uppercase tracking-widest mb-1">Heads Up</p>
              <h3 className="text-white text-xl font-black">Public Event Notice</h3>
            </div>
            <button onClick={() => setShowConsent(false)} className="text-zinc-500 hover:text-white transition-colors mt-1">
              <X size={20} />
            </button>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Photos posted in this public event may be visible to everyone and used in PXI marketing materials
            by the event host. If you prefer privacy, look for private events instead.
          </p>
          <div className="flex flex-row gap-3 pt-1">
            <Button
              variant="neon"
              className="w-full uppercase tracking-widest py-3"
              onClick={() => setShowConsent(false)}
            >
              Agree &amp; Get Ticket
            </Button>
            <button
              onClick={() => setShowConsent(false)}
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
