import { motion } from 'framer-motion';
import { DynamicStamp } from '../passport/StampShapeGraphic';

function CameraPill({ colorClass, stripeColor, hasFlash }) {
  return (
    <div className={`relative flex h-14 w-20 items-center justify-center rounded-xl shadow-xl backdrop-blur-md overflow-hidden ${colorClass}`}>
      {stripeColor && (
        <div className={`absolute left-0 right-0 top-[26px] h-1.5 ${stripeColor}`} />
      )}
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/80 shadow-inner z-10">
        <div className="h-4 w-4 rounded-full border border-white/10 bg-zinc-800" />
      </div>
      {hasFlash === 'high' ? (
        <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_20px_8px_rgba(255,255,255,1)] z-10" />
      ) : hasFlash === 'normal' ? (
        <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)] z-10" />
      ) : (
        <div className="absolute right-2 top-2 h-1 w-1 rounded-full bg-white/30 z-10" />
      )}
    </div>
  );
}

export default function FloatingAuthElements() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            {/* Polaroid 1 (Hero Image 1) */}
            <motion.div
                animate={{
                    y: ['10%', '20%', '10%'],
                    x: ['10%', '15%', '10%'],
                    rotate: [-10, -5, -10],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-36 sm:w-44 bg-white p-2 sm:p-3 pb-8 sm:pb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm"
                style={{ top: '10%', left: '5%' }}
            >
                <div className="w-full aspect-[4/5] bg-neutral-900 relative">
                    <img src="/landing/assets/720207033_17892583926515853_2215607998685685137_n.jpg" className="absolute inset-0 w-full h-full object-cover" alt="" />
                </div>
            </motion.div>

            {/* Polaroid 2 (Hero Image 2) */}
            <motion.div
                animate={{
                    y: ['55%', '65%', '55%'],
                    x: ['60%', '65%', '60%'],
                    rotate: [15, 20, 15],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-40 sm:w-48 bg-white p-2 sm:p-3 pb-8 sm:pb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm"
                style={{ top: '50%', right: '10%' }}
            >
                <div className="w-full aspect-[4/5] bg-neutral-900 relative">
                    <img src="/landing/assets/media__1782968823505.jpg" className="absolute inset-0 w-full h-full object-cover" alt="" />
                </div>
            </motion.div>

            {/* Polaroid 3 (Hero Image 3) */}
            <motion.div
                animate={{
                    y: ['70%', '80%', '70%'],
                    x: ['5%', '10%', '5%'],
                    rotate: [-25, -15, -25],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-32 sm:w-40 bg-white p-2 sm:p-3 pb-8 sm:pb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm"
                style={{ bottom: '5%', left: '15%' }}
            >
                <div className="w-full aspect-[4/5] bg-neutral-900 relative">
                    <img src="/landing/assets/media__1782967724838.jpg" className="absolute inset-0 w-full h-full object-cover" alt="" />
                </div>
            </motion.div>

            {/* Passport Map SVG */}
            <motion.div
                animate={{
                    y: ['20%', '30%', '20%'],
                    x: ['30%', '35%', '30%'],
                    rotate: [5, -5, 5],
                    scale: [1, 1.05, 1],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute opacity-20"
                style={{ top: '15%', left: '30%', width: '300px' }}
            >
                <img src="/passport-map.svg" className="w-full h-auto drop-shadow-2xl" alt="" />
            </motion.div>

            {/* Stamp 1: Hologram Ticket (e.g. Sanaa Groove) */}
            <motion.div
                animate={{
                    y: ['30%', '40%', '30%'],
                    x: ['75%', '85%', '75%'],
                    rotate: [15, 5, 15],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-32 h-20 opacity-95 drop-shadow-2xl"
                style={{ top: '20%', right: '15%' }}
            >
                <DynamicStamp shape="hologram-ticket" color="#d84aff" name="Sanaa Groove" date="JUL 2026" city="NEW YORK" role="OWNER" />
            </motion.div>

            {/* Stamp 2: Wax Seal (e.g. Tropicale) */}
            <motion.div
                animate={{
                    y: ['45%', '35%', '45%'],
                    x: ['25%', '35%', '25%'],
                    rotate: [-15, 10, -15],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-28 h-28 opacity-90 drop-shadow-2xl"
                style={{ top: '40%', left: '25%' }}
            >
                <DynamicStamp shape="wax-seal" color="#f87171" name="Tropicale" date="AUG 2026" city="MIAMI" role="OWNER" />
            </motion.div>

            {/* Camera Pill 1: Snap */}
            <motion.div
                animate={{
                    y: ['75%', '85%', '75%'],
                    x: ['35%', '45%', '35%'],
                    rotate: [10, -5, 10],
                }}
                transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute"
                style={{ bottom: '20%', left: '35%' }}
            >
                <CameraPill 
                    colorClass="bg-[#1c120a] shadow-[0_0_26px_rgba(255,120,40,0.45)]" 
                    stripeColor="bg-pxi-orange"
                    hasFlash="normal"
                />
            </motion.div>

            {/* Camera Pill 2: Noir */}
            <motion.div
                animate={{
                    y: ['15%', '25%', '15%'],
                    x: ['65%', '75%', '65%'],
                    rotate: [-12, 12, -12],
                }}
                transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute"
                style={{ top: '25%', right: '35%' }}
            >
                <CameraPill 
                    colorClass="bg-black shadow-[0_0_28px_rgba(192,72,255,0.45)]" 
                    stripeColor="bg-[#b657ff]"
                    hasFlash="high"
                />
            </motion.div>
        </div>
    );
}
