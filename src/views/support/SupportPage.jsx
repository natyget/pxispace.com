'use client';

import React from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import SupportHero from './Hero';
import TrustSection from './TrustSection';
import Categories from './Categories';
import FAQ from './FAQ';
import DeviceConfidence from './DeviceConfidence';
import ContactCTA from './ContactCTA';

const SupportPage = () => {
  return (
    <div className="relative min-h-screen bg-black">
      <ParticleBackground />

      <main className="relative z-10">
        <SupportHero />
        <TrustSection />
        <Categories />
        <FAQ />
        <DeviceConfidence />
        <ContactCTA />
      </main>
    </div>
  );
};

export default SupportPage;
