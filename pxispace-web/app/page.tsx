"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlbumCard } from "@/components/AlbumCard";
import { FeatureCard } from "@/components/FeatureCard";
import Image from "next/image";
import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function HomePage() {
  const albums = useQuery(api.albums.listPublicAlbums);
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-end pt-20 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 w-full grid md:grid-cols-[1.05fr_0.95fr] gap-7 items-center">
          {/* Hero Visual */}
          <div className="relative min-h-[360px] md:order-2">
            <div className="relative w-full">
        <Image
                src="/assets/pxi-hero-mock.png"
                alt="PXI app and hardware preview"
                width={600}
                height={600}
          priority
                className="w-full h-auto rounded-3xl"
                style={{
                  filter: 'drop-shadow(0 16px 60px rgba(139,92,246,0.35))',
                }}
              />
              <a
                href="https://testflight.apple.com/join/3QqyXJwa"
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
            <h1 className="text-7xl md:text-8xl lg:text-[104px] font-bold leading-[0.9] mb-1.5 title-neon animate-fade-up">
              PXI
            </h1>
            <div className="text-2xl md:text-3xl lg:text-[32px] font-semibold mb-4 kicker-neon">
              PICK – PRINT – POST
            </div>
            <div className="max-w-[640px] text-text-primary text-base md:text-lg leading-relaxed space-y-4">
              <p>
                Cherishable moments get lost in your phone, never to be seen again. Instant cameras
                and clunky printing bricks only add hassle and won&apos;t cut it.
              </p>
              <p>
                Inspired by the vision of a printing phone with an easy wake via magnetic snap,
                PXIClip transforms your device into an instant camera.
              </p>
              <p>&quot;Instant&quot; has never been this effortless.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">Our Story</h2>
            <div className="text-text-primary text-base md:text-lg leading-relaxed space-y-4">
              <p>
                <strong>PXI Labs LLC</strong> started in Texas with a small, passionate team—driven
                by the idea that printing memories should be as instant and seamless as capturing
                them.
              </p>
              <p>
                From brainstorming in coffee shops to late-night prototyping, we&apos;ve poured ourselves
                into PXIClip and PXI Studio—products designed to change how people share moments.
              </p>
              <p>
                Our mission is simple: make instant tangible again without the bulk. We&apos;re here to
                make every memory a keepsep, and we&apos;re just getting started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">
              PXI Studio Features
            </h2>
          </div>

          {/* Video Hero */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="aspect-video rounded-3xl overflow-hidden glass card-hover">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
                poster="/assets/img.png"
              >
                <source src="/assets/pxiclips-hero.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon="/assets/illustration-magsnap.png"
              title="Magnetic Snap Wake"
              description="PXIClip wakes and connects the moment it snaps to your phone."
            />
            <FeatureCard
              icon="/assets/illustration-sharedlib.png"
              title="Shared Event Albums"
              description="Spin up a live album for any party. Friends join via link or QR and everyone&apos;s shots roll in together."
            />
            <FeatureCard
              icon="/assets/illustration-sharing.png"
              title="Creator Filters"
              description="Film-inspired looks and AI styles tuned for print. Keep it natural or go bold."
            />
          </div>

          {/* App Screenshots Carousel */}
          <div className="mt-20 text-center">
            <div className="text-xs uppercase tracking-widest text-neon-light/70 font-bold mb-3">
              PXI Studio Preview
            </div>
            <h3 className="text-4xl md:text-5xl font-extrabold mb-4 text-glow">
              Pick • Print • Post
            </h3>
            <p className="text-text-primary max-w-2xl mx-auto mb-10">
              Swipe or let it play — a quick peek at the flow.
            </p>

            <div className="max-w-md mx-auto">
              <div
                className="p-3 rounded-[28px] glass"
                style={{
                  boxShadow:
                    '0 10px 40px rgba(0,0,0,0.45), 0 0 22px rgba(139,92,246,0.28) inset, 0 0 26px rgba(139,92,246,0.22)',
                }}
              >
                <div className="aspect-[9/19.5] rounded-[20px] overflow-hidden bg-black">
                  <div ref={emblaRef} className="h-full overflow-hidden">
                    <div className="flex h-full">
                      {[1, 2, 3, 4].map((num) => (
                        <div key={num} className="flex-[0_0_100%] min-w-0 h-full relative">
                          <Image
                            src={`/assets/pxi-app-0${num}.jpg`}
                            alt={`PXI Studio Screen ${num}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        </div>
                      ))}
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

      {/* Public Events Section */}
      <section id="events" className="py-20 relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-glow">
              Public Events
            </h2>
            <p className="text-text-primary text-lg max-w-2xl mx-auto">
              Join live events and shared albums happening now.
            </p>
          </div>

          {albums === undefined ? (
            <div className="text-center py-20 text-text-secondary">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet border-t-transparent" />
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-secondary text-lg">No public events at the moment.</p>
              <p className="text-text-secondary/60 mt-2">Check back soon for upcoming events!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album._id}
                  id={album._id}
                  name={album.name}
                  description={album.description}
                  displayImageUrl={album.displayImageUrl}
                  location={album.location}
                  start_time={album.start_time}
                  participantsCount={album.participantsCount}
                  status={album.status}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 pb-32 relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <a
              href="https://testflight.apple.com/join/3QqyXJwa"
          target="_blank"
          rel="noopener noreferrer"
              className="btn-neon-outline px-6 py-3 rounded-full font-bold text-[#eae6ff] inline-block"
            >
              Join TestFlight
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
  );
}
