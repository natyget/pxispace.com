'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';
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

const MSG_BASE = 0.298;
const MSG_STRIDE = 0.04;
const MSG_ENTER = 0.017;

function ThreadIncomingSlot({ progress, index, className = '', children }) {
  const enterStart = MSG_BASE + index * MSG_STRIDE;
  const enterEnd = enterStart + MSG_ENTER;

  const opacity = useTransform(progress, (p) => {
    if (p < enterStart) return 0;
    if (p < enterEnd) return (p - enterStart) / (enterEnd - enterStart);
    return 1;
  });

  const scale = useTransform(progress, (p) => {
    if (p < enterStart) return 0.94;
    if (p < enterEnd) return 0.94 + 0.06 * ((p - enterStart) / (enterEnd - enterStart));
    return 1;
  });

  const y = useTransform(progress, (p) => {
    if (p < enterStart) return 16;
    if (p < enterEnd) return 16 * (1 - (p - enterStart) / (enterEnd - enterStart));
    return 0;
  });

  return (
    <motion.div
      className={`origin-bottom will-change-transform ${className}`}
      style={{ opacity, scale, y }}
    >
      {children}
    </motion.div>
  );
}

export default function ThreadScene({ progress }) {
  const opacity = useTransform(progress, [0.254, 0.296, 0.542, 0.58], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.282, 0.55], [0, -1050]);

  return (
    <motion.div className="absolute inset-0 px-3 flex flex-col overflow-hidden z-10" style={{ opacity }}>
      <motion.div className="flex flex-col gap-4 w-full pt-[56vh] pb-[30vh]" style={{ y }}>
        <ThreadIncomingSlot progress={progress} index={0}>
          <ChatBubble name="Sarah" avatar={AVATAR_TRINA} time="10:02 AM">
            who&apos;s readyyy 🎉
          </ChatBubble>
        </ThreadIncomingSlot>
        <ThreadIncomingSlot progress={progress} index={1}>
          <ChatBubble isMe time="10:03 AM">
            MEEE 🙌
          </ChatBubble>
        </ThreadIncomingSlot>
        <ThreadIncomingSlot progress={progress} index={2}>
          <VoiceNotePill
            name="Mike"
            avatar={AVATAR_KEVIN}
            time="10:05 AM"
            duration="0:04"
          />
        </ThreadIncomingSlot>
        <ThreadIncomingSlot progress={progress} index={3}>
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
        <ThreadIncomingSlot progress={progress} index={4}>
          <ChatBubble isMe time="10:08 AM">
            wait this is so good
          </ChatBubble>
        </ThreadIncomingSlot>
        <ThreadIncomingSlot progress={progress} index={5}>
          <GifCard
            name="Sarah"
            avatar={AVATAR_TRINA}
            time="10:09 AM"
            gifSrc={THREAD_REACTION_GIF}
          />
        </ThreadIncomingSlot>
        <ThreadIncomingSlot progress={progress} index={6}>
          <ScrapbookPostCard
            image={THREAD_POST_SECOND}
            authorName="Jess"
            avatar={AVATAR_BABA}
            rotation={-2}
            reactions={[{ emoji: '❤️', count: 8 }]}
          />
        </ThreadIncomingSlot>
      </motion.div>
      <div className="absolute bottom-0 left-0 w-full z-40">
        <ChatBar />
      </div>
    </motion.div>
  );
}
