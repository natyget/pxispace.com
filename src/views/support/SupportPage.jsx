'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const SECTIONS = [
  {
    id: 'account',
    title: 'Account & Access',
    tldr: "Getting started is quick. If you lose access, use the forgot password flow or email us. Need to wipe your data? You can delete your account right from Settings.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. How do I create a PXI account?</h3>
          <p className="leading-relaxed">Download the PXI app and sign up with your email, Apple ID, or Google account. Verification takes a few seconds and you can join or create events straight away.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. I can't log in — what should I do?</h3>
          <p className="leading-relaxed">Try the 'Forgot password' link on the login screen. If you signed up with Apple or Google, make sure you're using the same provider. Still stuck? Email <span className="text-legal-hub-accent">support@pxispace.com</span> with your account email and we'll sort it out.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. How do I delete my account?</h3>
          <p className="leading-relaxed">Go to Settings → Account → Delete Account in the app. This permanently removes your profile, photos, and data. If you need help completing the process, email support@pxispace.com.</p>
        </div>
      </div>
    )
  },
  {
    id: 'events',
    title: 'Events & Albums',
    tldr: "Hosts control who sees what and when. Most albums unlock when you arrive at the venue. You can easily save your photos, unless the host has specifically restricted downloads.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. How do I join an event?</h3>
          <p className="leading-relaxed">Tap the event link or QR code shared by the host, or search for the event by name in the app. Some events require a valid ticket for access — make sure you're checked in at the venue.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Why can't I see the event album?</h3>
          <p className="leading-relaxed">Album access is controlled by the host. Most albums unlock once you are checked in at the venue. Check that your location permissions are on and that you have the latest version of the app.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. How do I create and host an event?</h3>
          <p className="leading-relaxed">Tap the '+' button on the Events tab and follow the setup flow. You can set a venue, upload a cover photo, enable ticketing, and configure album permissions — all from the app.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. Can I download photos from an event?</h3>
          <p className="leading-relaxed">Yes. Open any photo in the album, tap the download icon, and it will save to your camera roll. Hosts can set download permissions, so if the option is greyed out the host has disabled it for that event.</p>
        </div>
      </div>
    )
  },
  {
    id: 'hardware',
    title: 'PXIClip Device',
    tldr: "Hold the button for 3 seconds to pair. Make sure it's charged and that the ZINK paper is loaded glossy-side up with the blue card at the bottom.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. How do I set up PXIClip?</h3>
          <p className="leading-relaxed">Charge PXIClip fully before first use. Open the PXI app, go to the Clip tab, and tap 'Connect Device'. Enable Bluetooth when prompted and hold PXIClip in pairing mode (hold the power button for 3 seconds). The app will find it automatically.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. PXIClip won't pair with my phone — how do I fix it?</h3>
          <p className="leading-relaxed">First, make sure Bluetooth is on and PXI has Bluetooth permission in your phone's settings. Force-close the app, restart PXIClip, and try again. If the issue persists, forget the device in your Bluetooth settings and re-pair from scratch. Still not working? Email <span className="text-legal-hub-accent">support@pxispace.com</span> with your device serial number.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. What paper does PXIClip use?</h3>
          <p className="leading-relaxed">PXIClip uses standard 2×3 inch ZINK (Zero Ink) paper. We recommend using PXI-branded paper packs for the best colour accuracy and print life. Third-party ZINK paper also works in most cases.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">4. My prints are coming out faded or streaky — what's wrong?</h3>
          <p className="leading-relaxed">Faded prints are usually caused by low battery or paper loaded face-down. Make sure PXIClip is at least 50% charged and that the paper is loaded glossy-side up with the blue calibration sheet at the bottom of the stack.</p>
        </div>
      </div>
    )
  },
  {
    id: 'tickets',
    title: 'Tickets & Payments',
    tldr: "Buy tickets right in the app. If you're a host, your payouts process automatically via Stripe and typically land in your account 2-7 business days after the event ends.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">1. How do I buy a ticket?</h3>
          <p className="leading-relaxed">Find the event in the app or via a shared link, tap 'Get Tickets', choose your ticket type, and complete checkout with Apple Pay, Google Pay, or a card. Your ticket lives in the Tickets tab and can be shown at the door.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. I was charged but can't access the event — what do I do?</h3>
          <p className="leading-relaxed">Pull to refresh on the Tickets tab first, as the ticket can take a moment to appear. If it still isn't there after a minute, email <span className="text-legal-hub-accent">support@pxispace.com</span> with your order confirmation and we'll resolve it right away.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. How do host payouts work?</h3>
          <p className="leading-relaxed">Ticket revenue is processed through Stripe. Once your event closes, funds are transferred to your connected bank account on a standard Stripe payout schedule (usually 2–7 business days). For payout questions, email <span className="text-legal-hub-accent">support@pxispace.com</span> with your event name.</p>
        </div>
      </div>
    )
  },
  {
    id: 'privacy',
    title: 'Privacy & Safety',
    tldr: "We don't sell your data. Face matching happens on your device, not our servers. If you see something unsafe, report it instantly.",
    content: (
      <div className="space-y-8 text-gray-400">
        <div className="bg-legal-hub-surface border border-legal-hub-border p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-legal-hub-accent"></div>
          <h3 className="text-lg font-bold text-legal-hub-accent mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            1. How does Find My Shots work?
          </h3>
          <p className="text-gray-400">Find My Shots uses on-device face recognition to surface photos that include you from an event album. No biometric data is sent to our servers. You can turn the feature off at any time in Settings → Privacy.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Is my data secure?</h3>
          <p className="leading-relaxed">Yes. PXI uses encrypted connections for all data in transit, session-based authentication, and strict access controls so event content is only visible to verified attendees. See our Privacy Policy for full details.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-3 text-white">3. How do I report a safety or trust issue?</h3>
          <p className="leading-relaxed">For content or behaviour that violates our community guidelines, use the in-app report button on any photo, profile, or event. For urgent trust and safety matters, email <span className="text-legal-hub-accent">trust@pxispace.com</span> directly.</p>
        </div>
      </div>
    )
  }
];

export default function SupportPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const observers = new Map();

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -75% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    SECTIONS.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
        observers.set(section.id, element);
      }
    });

    return () => {
      observers.forEach(element => observer.unobserve(element));
    };
  }, []);

  useEffect(() => {
    const scrollFromHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (id && SECTIONS.some((s) => s.id === id)) {
        scrollToSection(id);
      }
    };
    const t = window.setTimeout(scrollFromHash, 0);
    const t2 = window.setTimeout(scrollFromHash, 120);
    window.addEventListener('hashchange', scrollFromHash);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener('hashchange', scrollFromHash);
    };
  }, [scrollToSection]);

  return (
    <div className="legal-hub min-h-screen bg-legal-hub-bg text-legal-hub-text selection:bg-legal-hub-accent selection:text-black">
      <header className="pt-8 pb-12 md:pt-10 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-legal-hub-border">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-6 text-[#E0E0E0]">
            The Help Center.
          </h1>
          <p className="text-xl md:text-2xl text-[#AAAAAA] font-medium tracking-tight mb-4 italic">
            Answers. Hardware. Accounts.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-[#AAAAAA] uppercase tracking-widest">
            <span>Contact: support@pxispace.com</span>
            <span>Trust & Safety: trust@pxispace.com</span>
          </div>
        </motion.div>
      </header>

      {/* Mobile Navigation (Sticky) */}
      <div className="md:hidden sticky top-0 z-30 bg-legal-hub-bg/95 backdrop-blur pt-4 pb-2 border-b border-legal-hub-border">
        <div className="flex overflow-x-auto legal-hub-hide-scrollbar px-4 gap-6">
          {SECTIONS.map((section) => (
            <button
              key={`mobile-${section.id}`}
              onClick={() => scrollToSection(section.id)}
              className={`whitespace-nowrap pb-2 text-lg transition-all ${
                activeSection === section.id 
                  ? 'font-bold text-white' 
                  : 'font-normal text-gray-500'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-1/4 shrink-0">
            <div className="sticky top-28 flex flex-col space-y-6">
              {SECTIONS.map((section) => (
                <button
                  key={`desktop-${section.id}`}
                  onClick={() => scrollToSection(section.id)}
                  className={`text-left transition-all text-xl ${
                    activeSection === section.id 
                      ? 'font-bold text-white' 
                      : 'font-normal text-gray-500 hover:text-white'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Content Panel */}
          <div className="w-full md:w-3/4 space-y-24 md:space-y-32 pb-32">
            {SECTIONS.map((section) => (
              <section 
                key={section.id} 
                id={section.id}
                className="scroll-mt-28"
              >
                <div className="mb-8">
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">
                    {section.title}
                  </h2>
                  
                  {/* TL;DR Box */}
                  <div className="bg-neon-card shadow-neon-card p-8 md:p-12 rounded-[32px] mb-12 flex flex-col items-center justify-center text-center">
                    <h3 
                      className="font-black uppercase text-white text-4xl md:text-5xl leading-none mb-6 ghost-echo"
                      data-text="TL;DR"
                    >
                      TL;DR
                    </h3>
                    <p className="text-white/90 font-light text-lg md:text-xl max-w-3xl">
                      {section.tldr}
                    </p>
                  </div>
                </div>

                {section.content}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
