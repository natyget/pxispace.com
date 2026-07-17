'use client';

import React from 'react';
import { QrCode } from 'lucide-react';
import {
  ScrollStory,
  StoryStep,
  StoryDots,
  StepItem,
  ScrubWords,
  useStepProgress,
} from '@/components/motion/ScrollStory';

/**
 * The whole product in three beats — a pinned scroll story: the stage locks
 * to the viewport and each swipe sweeps the next beat in (visual first, then
 * headline, then the line). Attendee focused: no organizer stats, minimal
 * reading.
 */
function TicketVisual() {
  return (
    <div className="flex h-24 items-center justify-center" aria-hidden>
      <div className="flex w-56 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent shadow-2xl relative">
        <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#101010]" />
        <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#101010]" />
        
        <div className="flex-1 p-4 pl-5">
          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-pxi-purple">PXI Ticket</p>
          <p className="mt-1 text-sm font-black text-white">NUIT TROPICALE</p>
          <div className="mt-1.5 flex gap-2 text-[9px] text-zinc-400">
            <span>Fri 10PM</span>
            <span>·</span>
            <span>GA</span>
          </div>
        </div>
        <div className="flex w-14 items-center justify-center border-l border-dashed border-white/15 pr-1">
          <QrCode className="h-7 w-7 text-white/90" />
        </div>
      </div>
    </div>
  );
}

function CameraPill({ colorClass, offsetClass, zIndex, hasFlash, stripeColor }) {
  return (
    <div className={`absolute ${offsetClass} ${zIndex} flex h-14 w-20 items-center justify-center rounded-xl shadow-xl backdrop-blur-md overflow-hidden ${colorClass} transition-transform`}>
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

function CameraVisual() {
  return (
    <div className="flex h-24 items-center justify-center relative" aria-hidden>
      {/* Far Left: Noir (B&W) */}
      <CameraPill 
      colorClass="bg-black" 
      offsetClass="-translate-x-20 -rotate-12 scale-75"
      zIndex="z-10"
      />
      {/* Mid Left: Retro (Orange/Warm) */}
      <CameraPill 
      colorClass="bg-gradient-to-r from-[#5a2c1a] via-[#8a4a2b] to-[#d9955f]" 
      offsetClass="-translate-x-10 -rotate-6 scale-90"
      zIndex="z-20"
      />
      {/* Center: Snap (Purple/Dark) */}
      <CameraPill 
      colorClass="bg-[#1c120a] shadow-[0_0_26px_rgba(255,120,40,0.45)]" 
      stripeColor="bg-pxi-orange"
      offsetClass="translate-x-0 rotate-0 scale-100"
      zIndex="z-30"
      hasFlash="normal"
      />
      {/* Mid Right: Flash/Regular (Dark) */}
      <CameraPill 
      colorClass="bg-[#101408]/90" 
      offsetClass="translate-x-10 rotate-6 scale-90"
      zIndex="z-20"
      hasFlash={false}
      />
      {/* Far Right: Dispo (Green) */}
      <CameraPill 
      colorClass="bg-[#6f9f7c]" 
      stripeColor="bg-red-500"
      offsetClass="translate-x-20 rotate-12 scale-75"
      zIndex="z-10"
      />
    </div>
  );
}

function MorningVisual() {
  return (
    <div className="flex h-24 items-center justify-center overflow-visible" aria-hidden>
      <div className="relative h-[240px] w-[240px] origin-center scale-[0.55] -mt-2">
        {/* Image 3 (Background) */}
        <div className="absolute right-[-45px] top-4 z-0 w-32 rotate-12 rounded-sm bg-white p-1.5 pb-6 opacity-80 shadow-2xl">
          <img src="/landing/assets/720207033_17892583926515853_2215607998685685137_n.jpg" alt="" className="aspect-[3/4] w-full object-cover" />
        </div>

        {/* Image 1 */}
        <div className="absolute left-0 top-0 z-10 w-32 -rotate-6 rounded-sm bg-white p-1.5 pb-6 shadow-2xl">
          <img src="/landing/assets/696328673_17888403237515853_6493411745222454105_n.jpg" alt="" className="aspect-[3/4] w-full object-cover" />
          <div className="absolute -right-8 bottom-3 flex items-center rounded-full bg-[#463c32]/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md">
            take me back 🥺
          </div>
          <div className="absolute -left-4 bottom-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#222]/90 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md">
            ❤️
          </div>
        </div>

        {/* Image 2 */}
        <div className="absolute bottom-[-10px] right-[10px] z-20 w-36 rotate-3 rounded-sm bg-white p-1.5 pb-6 shadow-2xl">
          <img src="/landing/assets/671252663_17888402958515853_2887117479615207246_n.jpg" alt="" className="aspect-[3/4] w-full object-cover" />
          <div className="absolute -left-10 top-[40%] flex items-center rounded-full bg-[#663583]/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md">
            we look so good ✨
          </div>
          <div className="absolute -right-3 bottom-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#222]/90 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md">
            🔥
          </div>
        </div>
      </div>
    </div>
  );
}

const BEATS = [
  { title: 'Buy the ticket.', line: 'RSVP or pay in two taps.', visual: <TicketVisual /> },
  { title: 'Shoot on one camera.', line: 'The whole room, one shared roll.', visual: <CameraVisual /> },
  { title: 'Wake up to it all.', line: 'Every photo from every phone, in one thread.', visual: <MorningVisual /> },
];

function IntroStep() {
  const local = useStepProgress();
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
      <StepItem start={0} end={0.3}>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-pxi-purple">The idea</p>
      </StepItem>
      <ScrubWords
        as="h2"
        text="Built around the memory."
        className="display-2 mt-6 max-w-3xl"
        progress={local}
        range={[0.06, 0.7]}
      />
      <StepItem start={0.45} end={0.85}>
        <p className="body-lead mt-8 max-w-md">One night, three beats. Keep scrolling.</p>
      </StepItem>
    </div>
  );
}

export default function StoryIntro() {
  return (
    <ScrollStory steps={4} perStep={80} className="bg-black">
      <StoryDots />
      <StoryStep index={0} className="flex items-center justify-center">
        <IntroStep />
      </StoryStep>
      {BEATS.map((beat, i) => (
        <StoryStep key={beat.title} index={i + 1} className="flex items-center justify-center">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
            <StepItem start={0} end={0.4} className="flex h-44 items-center justify-center md:h-60">
              <div className="scale-[1.25] md:scale-150">{beat.visual}</div>
            </StepItem>
            <StepItem start={0.12} end={0.55}>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-pxi-purple">
                {`0${i + 1} / 03`}
              </p>
              <h3 className="display-2 mt-4">{beat.title}</h3>
            </StepItem>
            <StepItem start={0.24} end={0.68}>
              <p className="body-lead mt-5 max-w-md">{beat.line}</p>
            </StepItem>
          </div>
        </StoryStep>
      ))}
    </ScrollStory>
  );
}
