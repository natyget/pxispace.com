'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import PhoneMockup from '@/components/ui/PhoneMockup';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import HashtagTicker from './HashtagTicker';
import Footer from '@/components/layout/Footer';

export default function LandingHome() {
  /* Set landing class for scroll-behavior override (needed for scroll-driven sections) */
  useEffect(() => {
    document.documentElement.classList.add('landing-page-root');
    return () => document.documentElement.classList.remove('landing-page-root');
  }, []);

  return (
    <main 
      className="landing-v2 h-[100dvh] w-full bg-black text-white font-sans overflow-x-hidden overflow-y-scroll snap-y snap-mandatory touch-pan-y no-scrollbar overscroll-none selection:bg-fuchsia-500/30 scroll-pt-0"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* SCROLL 1: THE HERO (EVENTS) */}
      <section className="relative h-[100dvh] w-full snap-always snap-start shrink-0 flex items-center justify-center px-4 md:px-12 overflow-hidden">
        {/* Luxury Hero Background: Pitch black with very subtle pure-white/fuchsia diffused core */}
        <div className="absolute inset-0 bg-black transform-gpu"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-fuchsia-900/20 to-cyan-900/20 blur-[150px] rounded-full pointer-events-none opacity-50 transform-gpu will-change-transform"></div>
        
        {/* Fill empty space with large structural text watermark behind hero text */}
        <div className="absolute -left-20 top-1/4 -rotate-90 origin-bottom-left text-[20vw] font-black text-white/[0.02] tracking-widest pointer-events-none select-none leading-none z-0">
          EVENTS
        </div>

        <div className="max-w-7xl w-full h-full mx-auto flex flex-col md:flex-row items-center justify-center lg:gap-24 relative z-10 pt-28 md:pt-32 pb-4 md:pb-0">
           {/* Copy Left */}
           <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: false, amount: 0.3 }}
              className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start relative z-30 shrink-0 translate-y-[12vh] sm:translate-y-0"
           >
              
              {/* Radiating gradient behind text just for mobile readability over the phone */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,1)_0%,rgba(0,0,0,0.8)_45%,transparent_75%)] md:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6)_0%,transparent_60%)] -z-10 scale-[1.5] pointer-events-none translate-y-6"></div>
              
              <h1 className="sr-only">PXI: Your Shared Memory App</h1>
              
              <h2 className="text-[3.2rem] sm:text-6xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.95] mb-2 md:mb-8 pr-4 pb-2 text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-600 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                Don't let memories<br/>scatter.
              </h2>
              
              <p className="text-[15px] sm:text-lg md:text-xl xl:text-2xl text-neutral-400 max-w-[300px] sm:max-w-lg mx-auto md:mx-0 font-medium leading-[1.3] mb-4 md:mb-12">
                Not just ticketing. Your shared memory app, camera, and event passport
              </p>
              
              <div className="hidden md:flex w-full justify-center md:justify-start">
                <AppStoreCtaPair className="justify-center md:justify-start" dataCursorHover />
              </div>
           </motion.div>
           
           {/* Mockup Right (Events Screenshot) */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 30 }}
             whileInView={{ opacity: 1, scale: 1, y: 0 }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
             viewport={{ once: false, amount: 0.3 }}
             className="w-full md:w-1/2 flex-1 flex justify-center lg:justify-end lg:pr-12 xl:pr-24 relative z-10 pt-2 md:pt-0 pb-20 md:pb-0 items-start md:items-center overflow-visible"
           >
             
             {/* Center Phone and Polaroids safely without flowing off wide screens */}
             <div className="relative w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[340px] xl:max-w-[380px] flex justify-center">

               {/* Floating polaroids ONLY behind the phone */}
               <div className="absolute top-[10%] -right-10 sm:-right-20 lg:-right-24 xl:-right-32 w-32 h-44 xl:w-48 xl:h-64 bg-white p-2 rounded-sm shadow-2xl rotate-12 scale-90 z-0 animate-float transform-gpu will-change-transform">
                  <div className="w-full h-[85%] bg-neutral-800">
                    <img src="/landing/scattered/group.jpg" className="w-full h-full object-cover opacity-80 transform-gpu" alt="" />
                  </div>
               </div>
               
               <div className="absolute bottom-[20%] -left-8 sm:-left-20 lg:-left-24 xl:-left-32 w-20 h-28 sm:w-24 sm:h-36 xl:w-40 xl:h-56 bg-white p-1 sm:p-2 rounded-sm shadow-2xl -rotate-12 scale-90 z-20 animate-float-slow transform-gpu will-change-transform">
                  <div className="w-full h-[85%] bg-neutral-800">
                     <img src="/landing/album/gallery/afrodisiac/DSC02929.jpg" className="w-full h-full object-cover opacity-80 transform-gpu" alt="" />
                  </div>
               </div>
               
               <PhoneMockup 
                  title="PXI Events Platform" 
                  imgUrl="/images/screenshots/Event.PNG" 
                  className="z-10 relative scale-100"
                />

             </div>
           </motion.div>
        </div>

        {/* Mobile CTAs Anchored to Bottom Screen */}
        <div className="absolute bottom-[12%] sm:bottom-12 left-0 right-0 z-[40] md:hidden flex justify-center px-6">
           <AppStoreCtaPair className="w-full justify-center max-w-[400px]" dataCursorHover />
        </div>
      </section>

      {/* SCROLL 2: IDENTITY & NETWORK (NOTIFICATIONS & PASSPORT) */}
      <section className="relative h-[100dvh] w-full snap-always snap-start shrink-0 flex flex-col items-center justify-center px-4 md:px-12 border-t border-white/5 overflow-hidden">
        {/* Large structural watermark */}
        {/* Large structural watermark removed as per user request */}
        
        <div className="max-w-7xl w-full h-full mx-auto flex flex-col lg:flex-row items-center lg:gap-16 relative z-10 pt-[88px] md:pt-[104px] pb-4 md:py-16">
          
          <div className="w-full lg:w-2/5 text-center lg:text-left space-y-2 md:space-y-6 shrink-0 lg:order-2">
            <motion.h2 
               initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
               whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
               viewport={{ once: false, amount: 0.3 }}
               className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight">
              Build Your <br className="hidden lg:block"/><span className="text-white">Legacy.</span>
            </motion.h2>
            <motion.p 
               initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
               whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
               transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
               viewport={{ once: false, amount: 0.3 }}
               className="text-base sm:text-lg md:text-2xl text-neutral-400 font-medium leading-relaxed max-w-sm md:max-w-lg mx-auto lg:mx-0">
              Earn passport stamps for showing up. RSVP effortlessly and show your status in the scene.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            viewport={{ once: false, amount: 0.3 }}
            className="w-full lg:w-3/5 flex-1 relative flex justify-center items-start lg:items-center mt-[-10px] sm:mt-[-5px] lg:mt-0 lg:order-1 pt-0">
             <div className="relative w-full flex justify-center items-center mt-0 lg:mt-0 min-h-[500px] sm:min-h-[550px] lg:min-h-[750px]">
                 <PhoneMockup 
                    title="Notifications" 
                    imgUrl="/images/screenshots/Notifications.png" 
                    className="z-10 -mr-[80px] sm:-mr-[100px] lg:-mr-[120px] -rotate-6 scale-[0.95] sm:scale-100 lg:scale-[1.05] -translate-y-4 lg:translate-y-2"
                  />
                 <PhoneMockup 
                    title="Passport" 
                    imgUrl="/images/screenshots/Passport.PNG" 
                    className="z-20 rotate-6 scale-[0.95] sm:scale-100 lg:scale-[1.05] translate-y-4 lg:translate-y-16 shadow-2xl"
                  />
             </div>
          </motion.div>
        </div>
      </section>

      {/* SCROLL 3: THE LIVE EXPERIENCE (CAMERA, THREAD, REACTION) */}
      <section className="relative h-[100dvh] w-full snap-always snap-start shrink-0 flex flex-col justify-between items-center px-4 md:px-8 overflow-hidden border-t border-white/5 pt-16 md:pt-[104px] pb-4">
         {/* MEMORY watermark removed as per user request */}

         {/* Heading (under header) */}
         <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-center max-w-4xl mx-auto z-20 shrink-0">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-0">
              The Live Lens & Thread.
            </h2>
         </motion.div>

         {/* Subheading overlaps phones */}
         <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: false, amount: 0.3 }}
            className="absolute top-[22%] sm:top-[25%] lg:top-[18%] left-1/2 -translate-x-1/2 w-[120%] lg:w-full z-[40] text-center max-w-4xl mx-auto py-12 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.85)_0%,_rgba(0,0,0,0.6)_40%,_rgba(0,0,0,0)_70%)] pointer-events-none">
            <p className="text-base sm:text-lg md:text-2xl text-white font-medium leading-relaxed max-w-sm sm:max-w-lg mx-auto drop-shadow-lg px-8">
              Shoot analog. Watch the night unfold instantly in one shared, living thread
            </p>
         </motion.div>

         {/* 3-Phone Fan Layout for Desktop, Stacking for Mobile */}
         <div className="relative w-full flex-1 max-w-6xl mx-auto flex justify-center items-center h-full z-10 pb-0 lg:pb-0 pt-0 lg:pt-0">
             
             {/* Left: Camera */}
             <div className="absolute z-10 -translate-x-[40%] translate-y-6 lg:translate-x-0 lg:translate-y-0 lg:left-[5%] xl:left-[10%] lg:top-[60px] lg:z-20 -rotate-4 lg:-rotate-4 scale-[0.85] lg:scale-[1.1] origin-bottom lg:origin-center">
               <motion.div
                 initial={{ opacity: 0, y: 100, rotate: -10 }}
                 whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                 transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                 viewport={{ once: false, amount: 0.3 }}
               >
                 <PhoneMockup 
                    title="Analog Camera" 
                    imgUrl="/images/screenshots/Camera.PNG" 
                  />
               </motion.div>
             </div>

             {/* Center/Top: Album Thread (now z-20 vs text at z-40) */}
             <div className="absolute z-20 -translate-y-2 lg:translate-y-0 lg:left-1/2 lg:-translate-x-1/2 lg:top-[10px] scale-[0.95] lg:scale-[1.1] origin-bottom lg:origin-center">
               <motion.div
                 initial={{ opacity: 0, y: 150 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                 viewport={{ once: false, amount: 0.3 }}
               >
                 <PhoneMockup 
                    title="Thread Chat" 
                    imgUrl="/images/screenshots/Thread.PNG" 
                  />
               </motion.div>
             </div>

             {/* Right: Album Gallery */}
             <div className="absolute z-10 translate-x-[40%] translate-y-10 lg:translate-x-0 lg:translate-y-0 lg:right-[5%] xl:right-[10%] lg:top-[60px] rotate-4 lg:rotate-4 scale-[0.85] lg:scale-[1.1] origin-bottom lg:origin-center">
               <motion.div
                 initial={{ opacity: 0, y: 100, rotate: 10 }}
                 whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                 transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                 viewport={{ once: false, amount: 0.3 }}
               >
                 <PhoneMockup 
                    title="Album Gallery" 
                    imgUrl="/images/screenshots/Gallery.png" 
                  />
               </motion.div>
             </div>
         </div>
      </section>

      {/* SCROLL 4 & FOOTER */}
      <div className="relative w-full snap-always snap-start shrink-0 flex flex-col">
        {/* THE MEMORY (WALL & VAULT) */}
        <section className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-4 md:px-12 border-t border-white/5 overflow-hidden pb-16">
          {/* Subtle section end neon purple glow */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#f01fff]/15 to-transparent pointer-events-none z-50"></div>

          {/* THE VAULT watermark removed as per user request */}

          <div className="max-w-7xl w-full h-full mx-auto flex flex-col lg:flex-row items-center lg:gap-16 relative z-10 pt-[88px] md:pt-[104px] pb-4 md:py-16">
            
            <div className="w-full lg:w-2/5 text-center lg:text-left space-y-2 md:space-y-6 shrink-0 lg:order-2 flex flex-col justify-center">
              <motion.h2 
                 initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                 whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 viewport={{ once: false, amount: 0.3 }}
                 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight">
                The Morning <br className="hidden lg:block"/><span className="text-white">After.</span>
              </motion.h2>
              <motion.p 
                 initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                 whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                 transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                 viewport={{ once: false, amount: 0.3 }}
                 className="text-base sm:text-lg md:text-2xl text-neutral-400 font-medium leading-relaxed max-w-sm md:max-w-lg mx-auto lg:mx-0 pb-2 md:pb-8">
                Wake up to the night's uncut feed. Lock your best raw shots in the Vault and make the memory immortal
              </motion.p>
              
              {/* Spacer on mobile to replace the button's layout space so the phone doesn't shift up */}
              <div className="h-[52px] mt-8 sm:mt-10 mb-2 lg:hidden w-full flex pointer-events-none" aria-hidden="true" />
              
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                 whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                 transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                 viewport={{ once: false, amount: 0.3 }}
                 className="absolute top-[75%] lg:relative lg:top-auto left-0 right-0 lg:left-auto lg:right-auto lg:mt-0 lg:mb-0 w-full flex justify-center lg:justify-start z-[60]">
                <Link href="/login" className="relative z-30 px-8 py-3.5 md:py-5 flex items-center w-fit gap-3 justify-center rounded-full bg-white text-black font-bold tracking-[0.05em] uppercase text-xs md:text-sm transition-transform duration-300 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Immortalize Your Nights <ArrowRight className="w-4 h-4 md:w-5 md:h-5"/>
                </Link>
              </motion.div>
            </div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 60, filter: 'blur(10px)' }}
               whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
               transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
               viewport={{ once: false, amount: 0.3 }}
               className="w-full lg:w-3/5 flex-1 relative flex justify-center items-start lg:items-center mt-[-60px] sm:mt-[-80px] lg:mt-0 lg:order-1 pt-0">
               <div className="relative w-full flex justify-center items-center mt-0 min-h-[500px] sm:min-h-[550px] lg:min-h-[750px]">
                   <PhoneMockup 
                      title="Vault" 
                      imgUrl="/images/screenshots/Vault.PNG" 
                      className="z-20 -mr-[80px] sm:-mr-[100px] lg:-mr-[120px] -rotate-6 scale-[0.95] sm:scale-100 lg:scale-[1.05] -translate-y-16 lg:translate-y-2 shadow-2xl"
                    />
                   <PhoneMockup 
                      title="Shared Album Wall" 
                      imgUrl="/images/screenshots/Wall.PNG" 
                      className="z-10 rotate-6 scale-[0.95] sm:scale-100 lg:scale-[1.05] -translate-y-8 lg:translate-y-16"
                    />
               </div>
            </motion.div>

          </div>
        </section>

        {/* FOOTER & TICKER */}
        <div className="bg-black flex flex-col w-full h-auto mt-0">
          <HashtagTicker />
          <Footer />
        </div>
      </div>

    </main>
  );
}
