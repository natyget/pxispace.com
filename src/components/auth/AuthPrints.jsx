'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * The login's one object, as in the app: three prints on black, fanned and turned a few degrees. When the page
 * opens they slide out from one stack and settle on a spring, one after another, then stay put. The same plain
 * prints as the album popup: white border, no tape, no shadow. With reduced motion they are simply there.
 *
 * The fan is a fixed shape (380 by 173) scaled to the column, so it looks the same at every width.
 */
const PRINTS = [
  { src: '/auth/print-2.jpg', cx: 0.26, cy: 0.56, rotate: -9, z: 1, delay: 0.09 },
  { src: '/auth/print-3.jpg', cx: 0.74, cy: 0.56, rotate: 10, z: 2, delay: 0.16 },
  { src: '/auth/print-1.jpg', cx: 0.5, cy: 0.46, rotate: 2, z: 3, delay: 0.02 },
];
const Print = motion.div;
const PRINT_W = 0.31; // of the fan's width
const PRINT_H = 0.8333; // of the fan's height (a print is 1.22 times taller than wide)

export default function AuthPrints() {
  const still = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-[380px]" style={{ aspectRatio: '380 / 173' }} aria-hidden="true">
      {PRINTS.map((p) => (
        <Print
          key={p.src}
          className="absolute bg-white"
          style={{
            left: `${(p.cx - PRINT_W / 2) * 100}%`,
            top: `${(p.cy - PRINT_H / 2) * 100}%`,
            width: `${PRINT_W * 100}%`,
            height: `${PRINT_H * 100}%`,
            padding: '2% 2% 5.2%',
            borderRadius: 2,
            zIndex: p.z,
          }}
          initial={still ? false : { opacity: 0, x: `${((0.5 - p.cx) / PRINT_W) * 100}%`, y: -34, rotate: 0 }}
          animate={{ opacity: 1, x: '0%', y: 0, rotate: p.rotate }}
          transition={{ type: 'spring', damping: 13, stiffness: 150, delay: p.delay }}
        >
          <img src={p.src} alt="" draggable={false} className="size-full select-none bg-[#2F2F2F] object-cover" />
        </Print>
      ))}
    </div>
  );
}
