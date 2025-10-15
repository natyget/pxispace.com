"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function FeaturesPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);

  useEffect(() => {
    // Autoplay video on mount
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }
  }, []);

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-ink-gradient" />
      <div className="fixed inset-[-20%] -z-10 bg-gradient-radial pointer-events-none" />

      {/* PXIStudio Preview Section */}
      <section className="py-20 pt-32 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-neon-light/70 font-bold mb-3">
              PXI Studio Preview
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-glow">
              Pick • Print • Post
            </h1>
            <p className="text-text-primary max-w-2xl mx-auto mb-10">
              Swipe or let it play — a quick peek at the flow.
            </p>

            <div className="max-w-md mx-auto">
              <div
                className="p-3 rounded-[28px] glass"
                style={{
                  boxShadow:
                    '0 10px 40px rgba(0,0,0,0.45), 0 0 22px rgba(208,64,255,0.28) inset, 0 0 26px rgba(208,64,255,0.22)',
                }}
              >
                <div className="aspect-[9/19.5] rounded-[20px] overflow-hidden bg-black">
                  <div ref={emblaRef} className="h-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="flex-[0_0_100%] min-w-0 h-full relative">
                        <Image
                          src="/assets/Postcapture.jpeg"
                          alt="Post-Capture Editing"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                      <div className="flex-[0_0_100%] min-w-0 h-full relative">
                        <Image
                          src="/assets/Pre-live album.PNG"
                          alt="Pre-Live Album Setup"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                      <div className="flex-[0_0_100%] min-w-0 h-full relative">
                        <Image
                          src="/assets/Profile.PNG"
                          alt="Profile"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                      <div className="flex-[0_0_100%] min-w-0 h-full relative">
                        <Image
                          src="/assets/Live album.PNG"
                          alt="Live Album"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                      <div className="flex-[0_0_100%] min-w-0 h-full relative">
                        <Image
                          src="/assets/Library.PNG"
                          alt="Library"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                      <div className="flex-[0_0_100%] min-w-0 h-full relative">
                        <Image
                          src="/assets/Stories.PNG"
                          alt="Stories"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-text-secondary/60 text-xs mt-4">
                Screens from an internal build — visuals may change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PXIClip Section */}
      <section className="py-20 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">
              PXIClip
            </h2>
            <p className="text-text-primary text-xl max-w-3xl mx-auto">
              Turn your phone into a digital camera
            </p>
          </div>

          {/* Video Card */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="aspect-video rounded-3xl overflow-hidden glass card-hover">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
                poster="/assets/Camera.PNG"
              >
                <source src="/assets/PXIAd.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
            <FeatureCard
              icon="/assets/illustration-magsnap.png"
              title="Magnetic Snap Wake"
              description="PXIClip wakes and connects the moment it snaps to your phone."
            />
            <FeatureCard
              icon="/assets/illustration-sharedlib.png"
              title="Shared Event Albums"
              description="Spin up a live album for any party. Friends join via link or QR and everyone's shots roll in together."
            />
            <FeatureCard
              icon="/assets/illustration-sharing.png"
              title="Creator Filters"
              description="Film-inspired looks and AI styles tuned for print. Keep it natural or go bold."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="flex flex-wrap gap-6 justify-center items-center">
            <a
              href="https://apps.apple.com/us/app/pxistudio/id6753878296"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon-outline px-8 py-4 rounded-full font-bold text-lg text-[#eae6ff] inline-block"
            >
              Download App
            </a>
            <a
              href="https://www.kickstarter.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon-outline px-8 py-4 rounded-full font-bold text-lg text-[#eae6ff] inline-block"
            >
              Join Waitlist — 20% Off
            </a>
            <a
              href="https://www.kickstarter.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient px-8 py-4 rounded-full font-bold text-lg text-white inline-block"
            >
              Support Us on Kickstarter
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden">
        <Image
          src={icon}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <h3 className="text-xl font-bold mb-2 text-glow">{title}</h3>
      <p className="text-text-primary text-sm leading-relaxed">{description}</p>
    </div>
  );
}
