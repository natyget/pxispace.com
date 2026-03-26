'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Image as ImageIcon, Users } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const DiscoverPNG = '/images/discover.PNG';
const CreatePNG = '/images/create.PNG';

export default function AuthenticContentSection() {
  const bgRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current) {
        const scrolled = window.scrollY;
        bgRef.current.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.08}px))`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="hosts"
      className="py-24 md:py-32 bg-gradient-to-b from-[#050505] to-[#1a0b2e] relative overflow-hidden"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-block px-4 py-2 bg-pxi-purple/10 rounded-full text-pxi-purple font-black text-[10px] tracking-[0.2em] uppercase mb-8 border border-pxi-purple/20">
              ORGANIZERS & PROMOTERS
            </div>

            <h2 className="text-4xl md:text-6xl font-black mb-10 leading-[0.9] uppercase tracking-tighter">
              Authentic Content <br />
              on{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
                Autopilot.
              </span>
            </h2>

            <div className="space-y-8 md:space-y-10">
              <div className="flex flex-col md:flex-row items-center lg:items-start gap-5 md:gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md bg-white/5">
                  <Calendar className="text-white w-5 h-5" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-black mb-2 uppercase tracking-tight">
                    Frictionless Command Center
                  </h3>
                  <p className="text-zinc-500 font-medium">
                    Manage ticketing, invites, and communication in one place. Scale your events
                    without the manual labor.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center lg:items-start gap-5 md:gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md bg-white/5">
                  <ImageIcon className="text-pxi-purple w-5 h-5" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Social Momentum</h3>
                  <p className="text-zinc-500 font-medium">
                    Every guest is a creator. Effortlessly collect high-quality content ready for your
                    next promotion.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center lg:items-start gap-5 md:gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md bg-white/5">
                  <Users className="text-blue-400 w-5 h-5" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Build Your Tribe</h3>
                  <p className="text-zinc-500 font-medium">
                    Turn one-time ticket buyers into a loyal community that lives for your next drop.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 md:mt-16">
              <Link
                href="/events"
                className="inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest pxi-home-purple hover:scale-105 active:scale-95 transition-transform"
                data-cursor-hover
              >
                Start Creating Events
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 relative flex justify-center w-full">
            <div
              ref={bgRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pxi-purple/20 rounded-full blur-[100px] opacity-40 will-change-transform pointer-events-none"
            />

            <div className="relative">
              <div className="relative z-10 flex items-center justify-center transform lg:rotate-3 lg:hover:rotate-0 transition-transform duration-700 will-change-transform">
                <div className="bg-black p-3 shadow-2xl border-4 border-neutral-900 w-[280px] md:w-[360px] overflow-hidden rounded-[2rem]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-28 bg-neutral-900 rounded-b-xl z-20" />

                  <Swiper
                    spaceBetween={0}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    modules={[Pagination, Autoplay]}
                    autoplay={{ delay: 3500, disableOnInteraction: false }}
                    loop
                    className="rounded-[1.5rem] overflow-hidden bg-black"
                  >
                    <SwiperSlide>
                      <div className="aspect-[9/19] w-full overflow-hidden">
                        <Image
                          src={DiscoverPNG}
                          alt="Discover"
                          width={720}
                          height={1520}
                          className="w-full h-full object-cover"
                          sizes="(max-width: 768px) 280px, 360px"
                        />
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="aspect-[9/19] w-full overflow-hidden">
                        <Image
                          src={CreatePNG}
                          alt="Create"
                          width={720}
                          height={1520}
                          className="w-full h-full object-cover"
                          sizes="(max-width: 768px) 280px, 360px"
                        />
                      </div>
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-4 md:-left-12 z-20 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-40 md:w-48">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
                  Ticket Sales
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-xl md:text-2xl font-black text-white">1,204</span>
                  <span className="text-xs text-green-400 font-bold mb-1">+12%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-pxi-purple h-full w-[85%] shadow-[0_0_10px_rgba(216,74,255,1)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
