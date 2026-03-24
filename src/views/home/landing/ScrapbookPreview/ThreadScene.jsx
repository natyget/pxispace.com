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

export default function ThreadScene({ progress }) {
  const opacity = useTransform(progress, [0.18, 0.22, 0.49, 0.53], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.18, 0.49], [0, -1050]);

  const msg1Y = useTransform(progress, [0.18, 0.205], [50, 0]);
  const msg1Opacity = useTransform(progress, [0.18, 0.205], [0, 1]);
  const msg2Y = useTransform(progress, [0.205, 0.235], [50, 0]);
  const msg2Opacity = useTransform(progress, [0.205, 0.235], [0, 1]);
  const voiceY = useTransform(progress, [0.235, 0.27], [50, 0]);
  const voiceOpacity = useTransform(progress, [0.235, 0.27], [0, 1]);
  const post1Y = useTransform(progress, [0.27, 0.32], [100, 0]);
  const post1Opacity = useTransform(progress, [0.27, 0.32], [0, 1]);
  const msg3Y = useTransform(progress, [0.32, 0.35], [50, 0]);
  const msg3Opacity = useTransform(progress, [0.32, 0.35], [0, 1]);
  const gifY = useTransform(progress, [0.35, 0.39], [50, 0]);
  const gifOpacity = useTransform(progress, [0.35, 0.39], [0, 1]);
  const post2Y = useTransform(progress, [0.39, 0.44], [100, 0]);
  const post2Opacity = useTransform(progress, [0.39, 0.44], [0, 1]);

  return (
    <motion.div className="absolute inset-0 px-3 flex flex-col overflow-hidden z-10" style={{ opacity }}>
      <motion.div className="flex flex-col gap-4 w-full pt-[56vh] pb-[30vh]" style={{ y }}>
        <motion.div style={{ y: msg1Y, opacity: msg1Opacity }}>
          <ChatBubble name="Sarah" avatar={AVATAR_TRINA} time="10:02 AM">
            who&apos;s readyyy 🎉
          </ChatBubble>
        </motion.div>
        <motion.div style={{ y: msg2Y, opacity: msg2Opacity }}>
          <ChatBubble isMe time="10:03 AM">
            MEEE 🙌
          </ChatBubble>
        </motion.div>
        <motion.div style={{ y: voiceY, opacity: voiceOpacity }}>
          <VoiceNotePill
            name="Mike"
            avatar={AVATAR_KEVIN}
            time="10:05 AM"
            duration="0:04"
          />
        </motion.div>
        <motion.div style={{ y: post1Y, opacity: post1Opacity }}>
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
        </motion.div>
        <motion.div style={{ y: msg3Y, opacity: msg3Opacity }}>
          <ChatBubble isMe time="10:08 AM">
            wait this is so good
          </ChatBubble>
        </motion.div>
        <motion.div style={{ y: gifY, opacity: gifOpacity }}>
          <GifCard
            name="Sarah"
            avatar={AVATAR_TRINA}
            time="10:09 AM"
            gifSrc={THREAD_REACTION_GIF}
          />
        </motion.div>
        <motion.div style={{ y: post2Y, opacity: post2Opacity }}>
          <ScrapbookPostCard
            image={THREAD_POST_SECOND}
            authorName="Jess"
            avatar={AVATAR_BABA}
            rotation={-2}
            reactions={[{ emoji: '❤️', count: 8 }]}
          />
        </motion.div>
      </motion.div>
      <div className="absolute bottom-0 left-0 w-full z-40">
        <ChatBar />
      </div>
    </motion.div>
  );
}
