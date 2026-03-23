'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CursorContext = createContext({
  cursorType: 'default',
  setCursorType: () => {},
});

export const CursorProvider = ({ children }) => {
  const [cursorType, setCursorType] = useState('default');
  return (
    <CursorContext.Provider value={{ cursorType, setCursorType }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => useContext(CursorContext);

export default function CustomCursor() {
  const { cursorType, setCursorType } = useCursor();
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const updateMousePosition = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target =
        e.target instanceof Element ? e.target : e.target?.parentElement;
      if (!target || !target.closest) return;
      if (
        target.closest('img') ||
        target.closest('[data-cursor-photo]') ||
        target.closest('[data-cursor-video]')
      ) {
        setCursorType('video');
      } else if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-cursor-hover]')
      ) {
        setCursorType('hover');
      } else {
        setCursorType('default');
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY, setCursorType]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
        mixBlendMode: 'difference',
      }}
    >
      <motion.div
        className="bg-neutral-400"
        animate={{
          width: 20,
          height: 20,
          scale: cursorType === 'hover' ? 4 : 1,
          borderRadius: '50%',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </motion.div>
  );
}
