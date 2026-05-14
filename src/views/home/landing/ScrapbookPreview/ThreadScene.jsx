import React, { useState } from 'react';
import { motion, useTransform, useMotionValueEvent } from 'framer-motion';
import {
  AVATAR_BABA,
  AVATAR_GIFT,
  AVATAR_KEVIN,
  AVATAR_TRINA,
  THREAD_POST_FIRST,
  THREAD_POST_SECOND,
  THREAD_REACTION_GIF,
} from '@/lib/landingAssets';
import ChatBubble from './ChatBubble';
import VoiceNotePill from './VoiceNotePill';
import GifCard from './GifCard';
import ScrapbookPostCard from './ScrapbookPostCard';
import ChatBar from './ChatBar';

function ThreadIncomingSlot({ isVisible, className = '', isTyping = false, children }) {
  // If it's a typing indicator, it disappears when it's no longer visible.
  // Regular messages stay visible once they appear.
  return (
    <motion.div
      className={`origin-bottom-left will-change-transform flex-shrink-0 ${className}`}
      initial={false}
      animate={{ 
        scale: isVisible ? 1 : 0.85, 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 8,
        height: isVisible ? 'auto' : 0,
        marginTop: isVisible ? 16 : 0,
      }}
      style={{ overflow: 'hidden' }}
      transition={{ type: "spring", damping: 18, stiffness: 150 }}
    >
      {children}
    </motion.div>
  );
}

export default function ThreadScene({ progress }) {
  const [visibleIndex, setVisibleIndex] = useState(0);

  useMotionValueEvent(progress, "change", (latest) => {
    let idx = 0;
    if (latest >= 0.05) idx = 1; // Sarah's message
    if (latest >= 0.12) idx = 2; // My message
    if (latest >= 0.18) idx = 3; // Voice note
    if (latest >= 0.25) idx = 4; // Post 1
    if (latest >= 0.32) idx = 5; // "wait this is so good"
    if (latest >= 0.39) idx = 6; // GIF
    if (latest >= 0.46) idx = 7; // Post 2
    
    if (visibleIndex !== idx) setVisibleIndex(idx);
  });

  const opacity = useTransform(progress, [0, 0.542, 0.58], [1, 1, 0]);

  return (
    <motion.div className="absolute inset-0 px-3 flex flex-col overflow-hidden z-10" style={{ opacity }}>
      <div className="flex flex-col justify-end w-full h-full pt-[10vh] pb-28">
        
        {/* Typing indicator - visible only at idx === 0 */}
        <ThreadIncomingSlot isVisible={visibleIndex === 0} isTyping>
          <div className="flex gap-2 items-end">
            <img src={AVATAR_TRINA} alt="" className="w-8 h-8 rounded-full border border-white/10" />
            <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center border border-white/5">
              <motion.div className="w-1.5 h-1.5 bg-white/40 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
              <motion.div className="w-1.5 h-1.5 bg-white/40 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
              <motion.div className="w-1.5 h-1.5 bg-white/40 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
            </div>
          </div>
        </ThreadIncomingSlot>

        <ThreadIncomingSlot isVisible={visibleIndex >= 1}>
          <ChatBubble name="Sarah" avatar={AVATAR_TRINA} time="10:02 AM">
            who&apos;s readyyy 🎉
          </ChatBubble>
        </ThreadIncomingSlot>
        
        <ThreadIncomingSlot isVisible={visibleIndex >= 2}>
          <ChatBubble isMe time="10:03 AM">
            MEEE 🙌
          </ChatBubble>
        </ThreadIncomingSlot>
        
        <ThreadIncomingSlot isVisible={visibleIndex >= 3}>
          <VoiceNotePill
            name="Mike"
            avatar={AVATAR_KEVIN}
            time="10:05 AM"
            duration="0:04"
          />
        </ThreadIncomingSlot>
        
        <ThreadIncomingSlot isVisible={visibleIndex >= 4}>
          <ScrapbookPostCard
            pinned
            image={THREAD_POST_FIRST}
            authorName="Alex"
            avatar={AVATAR_GIFT}
            rotation={2}
            reactions={[
              { emoji: '🔥', count: 12 },
              { emoji: '📸', count: 5 },
            ]}
          />
        </ThreadIncomingSlot>
        
        <ThreadIncomingSlot isVisible={visibleIndex >= 5}>
          <ChatBubble isMe time="10:08 AM">
            wait this is so good
          </ChatBubble>
        </ThreadIncomingSlot>
        
        <ThreadIncomingSlot isVisible={visibleIndex >= 6}>
          <GifCard
            name="Sarah"
            avatar={AVATAR_TRINA}
            time="10:09 AM"
            gifSrc={THREAD_REACTION_GIF}
          />
        </ThreadIncomingSlot>
        
        <ThreadIncomingSlot isVisible={visibleIndex >= 7}>
          <ScrapbookPostCard
            image={THREAD_POST_SECOND}
            authorName="Jess"
            avatar={AVATAR_BABA}
            rotation={-2}
            reactions={[{ emoji: '❤️', count: 8 }]}
          />
        </ThreadIncomingSlot>
      </div>
      <div className="absolute bottom-0 left-0 w-full z-40">
        <ChatBar />
      </div>
    </motion.div>
  );
}
