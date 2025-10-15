"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { LoadingAnimation } from "@/components/LoadingAnimation";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingAnimation onComplete={handleLoadingComplete} />}
      
      <main className={`relative min-h-screen transition-opacity duration-1000 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      }`}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-end pt-20 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 w-full grid md:grid-cols-[1.05fr_0.95fr] gap-7 items-center">
          {/* Hero Visual */}
          <div className="relative min-h-[360px] md:order-2">
            <div className="relative w-full">
        <Image
                src="/assets/PXI-hero.png"
                alt="PXI app and hardware preview"
                width={600}
                height={600}
          priority
                className="w-full h-auto rounded-3xl object-cover"
                style={{
                  backgroundColor: 'transparent',
                }}
              />
              <a
                href="https://apps.apple.com/us/app/pxistudio/id6753878296"
            target="_blank"
            rel="noopener noreferrer"
                className="absolute left-1/2 -translate-x-1/2 bottom-7 block pointer-events-auto"
          >
            <Image
                  src="/assets/appstore-badge.svg"
                  alt="Download on the App Store"
                  width={150}
                  height={48}
                  className="h-12 w-auto"
                  style={{
                    filter: 'drop-shadow(0 10px 40px rgba(167,139,250,0.45))',
                  }}
                />
              </a>
            </div>
          </div>

          {/* Hero Copy */}
          <div className="md:order-1">
            <h1 className="text-7xl md:text-8xl lg:text-[104px] font-bold leading-[0.9] mb-1.5 text-[#d040ff] animate-fade-up">
              PXI LABS
            </h1>
            <div className="text-2xl md:text-3xl lg:text-[32px] font-semibold mb-4 kicker-neon">
              You we&apos;re there<br />We have proof
            </div>
            <div className="max-w-[640px] text-text-primary text-base md:text-lg leading-relaxed space-y-4">
              <p>
                Event&apos;s story gets fragmented across apps, chats, and camera rolls. This digital chaos adds friction and hassle, forcing you to hunt for details and memories instead of simply enjoying them.
              </p>
              <p>
                PXI is designed to be the ultimate party experience, unifying every stage from planning the hype to reliving the memories. We bring the entire social experience into one place, even letting you print your favorite photos on the spot with PXIClip.
              </p>
              <p>Set the Stage, capture the moment together, and relive the full story from every angle—all in one place.</p>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 pb-32 relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <a
              href="https://apps.apple.com/us/app/pxistudio/id6753878296"
          target="_blank"
          rel="noopener noreferrer"
              className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff] inline-block"
            >
              Download on the App Store
        </a>
        <a
              href="https://www.kickstarter.com/"
          target="_blank"
          rel="noopener noreferrer"
              className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff] inline-block"
            >
              Support Us on Kickstarter
            </a>
          </div>
    </div>
      </section>
    </main>
    </>
  );
}
