'use client';

// Route transition for the public site: every navigation re-mounts this
// template, playing a subtle fade + rise (Apple curve). Templates re-render
// per route by design — that's what makes the entrance replay.

import { motion } from 'framer-motion';
import { EASE_APPLE, DUR } from '@/components/motion/motionTokens';

export default function PublicTemplate({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE_APPLE }}
        >
            {children}
        </motion.div>
    );
}
