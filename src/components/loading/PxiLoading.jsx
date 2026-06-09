'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Purple spinner — matches mobile Wall Circle strip loading
 * (`TheCircle` → ActivityIndicator, Colors.neonPurple / #B026FF).
 */
const NEON_PURPLE = '#B026FF';

const SPINNER_SIZES = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

function PxiSpinner({ size = 'lg', className = '' }) {
  const dim = SPINNER_SIZES[size] ?? SPINNER_SIZES.lg;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`shrink-0 rounded-full border-solid animate-spin motion-reduce:animate-none ${dim} ${className}`}
      style={{
        borderColor: `${NEON_PURPLE}33`,
        borderTopColor: NEON_PURPLE,
      }}
    />
  );
}

/** Inline / navbar */
export function PxiLoadingIcon({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <PxiSpinner size="sm" />
    </div>
  );
}

/** Full viewport center — covers layout chrome during route transitions */
function PxiLoadingViewport({ className = '' }) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black overflow-hidden ${className}`}
    >
      {/* Neo-Glass Background Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] bg-[#B026FF]/20 blur-[100px] rounded-full animate-pulse pointer-events-none"></div>
      
      {/* Logo container with glassmorphism */}
      <div className="relative z-10 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_40px_rgba(176,38,255,0.2)] animate-fade-up">
        <img src="/favicon.png" alt="PXI Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-glitch" />
      </div>

      {/* CRT Scan lines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-20"></div>
    </div>
  );
}

/** Landing & root route loading */
export function PxiLoadingScreen() {
  return <PxiLoadingViewport />;
}

/** Homepage while public layout (navbar) is mounting */
export function PxiLoadingLanding() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const randomFrames = (count, range) => 
    Array.from({ length: count }, () => Math.random() * range * 2 - range);

  const randomBinary = (count) =>
    Array.from({ length: count }, () => (Math.random() > 0.7 ? 1 : 0));

  const glitchBlocks = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      isWhite: Math.random() > 0.5,
      width: Math.random() > 0.9 ? '20rem' : Math.random() > 0.5 ? '5rem' : '1rem',
      height: Math.random() > 0.9 ? '4rem' : Math.random() > 0.5 ? '1rem' : '0.2rem',
      top: `${50 + (Math.random() * 80 - 40)}%`,
      left: `${50 + (Math.random() * 80 - 40)}%`,
      x: randomFrames(15, 60),
      y: randomFrames(15, 60),
      opacity: randomBinary(15),
      delay: Math.random() * 0.3
    }));
  }, [mounted]);

  // Server render safe static version
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="relative z-10 flex items-center justify-center">
          <img src="/favicon.png" className="w-32 h-32 md:w-48 md:h-48 object-contain" alt="PXI" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ 
             opacity: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
             filter: ["contrast(1)", "contrast(5) invert(1)", "contrast(1)", "contrast(3)", "contrast(1)"]
           }}
           transition={{ duration: 1.8, ease: "linear" }}
        >
             <motion.div 
               className="relative origin-center mix-blend-difference"
               animate={{
                 x: randomFrames(15, 20),
                 y: randomFrames(15, 20),
                 skewX: randomFrames(15, 30),
                 scale: [1, 1.05, 1, 0.95, 1, 1.1, 1, 0.9, 1, 1.05, 1, 1, 1, 1, 1],
               }}
               transition={{ duration: 1.8, ease: "linear" }}
             >
               <img src="/favicon.png" className="w-32 h-32 md:w-48 md:h-48 object-contain" alt="PXI" />
               {/* Red Glitch */}
               <motion.div 
                 className="absolute left-0 top-0 mix-blend-screen pointer-events-none"
                 style={{ filter: "drop-shadow(0 0 10px red) sepia(1) hue-rotate(-50deg) saturate(5)" }}
                 animate={{ 
                   x: randomFrames(15, 40), 
                   y: randomFrames(15, 40),
                   opacity: randomBinary(15),
                 }}
                 transition={{ duration: 1.8, ease: "linear" }}
               >
                 <img src="/favicon.png" className="w-32 h-32 md:w-48 md:h-48 object-contain" alt="" />
               </motion.div>
               {/* Blue Glitch */}
               <motion.div 
                 className="absolute left-0 top-0 mix-blend-screen pointer-events-none origin-center"
                 style={{ filter: "drop-shadow(0 0 10px blue) sepia(1) hue-rotate(180deg) saturate(5)" }}
                 animate={{ 
                   x: randomFrames(15, 50), 
                   y: randomFrames(15, 50),
                   opacity: randomBinary(15),
                 }}
                 transition={{ duration: 1.8, ease: "linear" }}
               >
                 <img src="/favicon.png" className="w-32 h-32 md:w-48 md:h-48 object-contain" alt="" />
               </motion.div>
               {/* Green Glitch */}
               <motion.div 
                 className="absolute left-0 top-0 mix-blend-screen pointer-events-none origin-center"
                 style={{ filter: "drop-shadow(0 0 10px green) sepia(1) hue-rotate(90deg) saturate(5)" }}
                 animate={{ 
                   x: randomFrames(15, 30), 
                   y: randomFrames(15, 30),
                   opacity: randomBinary(15),
                 }}
                 transition={{ duration: 1.8, ease: "linear" }}
               >
                 <img src="/favicon.png" className="w-32 h-32 md:w-48 md:h-48 object-contain" alt="" />
               </motion.div>
             </motion.div>
        </motion.div>
      </div>

      {/* Glitch Squares purely random and jagged */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-difference overflow-hidden">
        {glitchBlocks.map((block) => (
          <motion.div
            key={block.id}
            className={`absolute ${block.isWhite ? 'bg-white' : 'bg-black'}`}
            style={{
              width: block.width,
              height: block.height,
              top: block.top,
              left: block.left,
            }}
            animate={{ 
              opacity: block.opacity,
              x: block.x,
              y: block.y,
            }}
            transition={{ 
              duration: 1.8, 
              ease: "linear", 
              delay: block.delay
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/** Other public routes — same viewport-centered overlay */
export function PxiLoadingMain() {
  return <PxiLoadingViewport />;
}
