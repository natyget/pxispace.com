'use client';

import React from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import SupportHero from './Hero';
import FAQ from './FAQ';
import ContactCTA from './ContactCTA';

const SupportPage = () => {
  return (
    <div className="relative min-h-screen bg-black">
      <ParticleBackground />

      <main className="relative z-10">
        <SupportHero />
        <FAQ />
        <ContactCTA />
      </main>
    </div>
  );
};

export default SupportPage;
