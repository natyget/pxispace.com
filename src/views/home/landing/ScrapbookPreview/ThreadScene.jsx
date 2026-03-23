'use client';

import React from 'react';
import { motion, useTransform } from 'framer-motion';
import ChatBubble from './ChatBubble';
import VoiceNotePill from './VoiceNotePill';
import GifCard from './GifCard';
import ScrapbookPostCard from './ScrapbookPostCard';
import ChatBar from './ChatBar';

export default function ThreadScene({ progress }) {
  const opacity = useTransform(progress, [0.15, 0.18, 0.45, 0.5], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.15, 0.45], [0, -1050]);

  const msg1Y = useTransform(progress, [0.15, 0.18], [50, 0]);
  const msg1Opacity = useTransform(progress, [0.15, 0.18], [0, 1]);
  const msg2Y = useTransform(progress, [0.18, 0.21], [50, 0]);
  const msg2Opacity = useTransform(progress, [0.18, 0.21], [0, 1]);
  const voiceY = useTransform(progress, [0.21, 0.24], [50, 0]);
  const voiceOpacity = useTransform(progress, [0.21, 0.24], [0, 1]);
  const post1Y = useTransform(progress, [0.24, 0.28], [100, 0]);
  const post1Opacity = useTransform(progress, [0.24, 0.28], [0, 1]);
  const msg3Y = useTransform(progress, [0.28, 0.31], [50, 0]);
  const msg3Opacity = useTransform(progress, [0.28, 0.31], [0, 1]);
  const gifY = useTransform(progress, [0.31, 0.35], [50, 0]);
  const gifOpacity = useTransform(progress, [0.31, 0.35], [0, 1]);
  const post2Y = useTransform(progress, [0.35, 0.4], [100, 0]);
  const post2Opacity = useTransform(progress, [0.35, 0.4], [0, 1]);

  return (
    <motion.div className="absolute inset-0 px-4 flex flex-col overflow-hidden" style={{ opacity }}>
      <motion.div className="flex flex-col gap-4 w-full pt-[65vh] pb-[30vh]" style={{ y }}>
        <motion.div style={{ y: msg1Y, opacity: msg1Opacity }}>
          <ChatBubble
            isMe={false}
            handle="sarah"
            avatar="https://i.pravatar.cc/150?u=sarah"
            time="10:02 AM"
          >
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
            isMe={false}
            handle="mike"
            avatar="https://i.pravatar.cc/150?u=mike"
            time="10:05 AM"
            duration="0:04"
          />
        </motion.div>
        <motion.div style={{ y: post1Y, opacity: post1Opacity }}>
          <ScrapbookPostCard
            image="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80"
            author="alex"
            avatar="https://i.pravatar.cc/150?u=alex"
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
            isMe={false}
            handle="sarah"
            avatar="https://i.pravatar.cc/150?u=sarah"
            time="10:09 AM"
          />
        </motion.div>
        <motion.div style={{ y: post2Y, opacity: post2Opacity }}>
          <ScrapbookPostCard
            image="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80"
            author="jess"
            avatar="https://i.pravatar.cc/150?u=jess"
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
