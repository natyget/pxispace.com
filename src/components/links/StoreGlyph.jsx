'use client';

import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { useAppPlatform } from '@/hooks/useAppPlatform';

/**
 * The store mark for a "Get the app" CTA. An Apple logo pointing at Google Play
 * is a broken promise, so the glyph follows the device the same way the link
 * does. Anything but Android keeps the Apple mark, which is also what the
 * server renders.
 */
export default function StoreGlyph({ className = 'h-5 w-5' }) {
  const platform = useAppPlatform();
  const Icon = platform === 'android' ? FaGooglePlay : FaApple;
  return <Icon className={className} aria-hidden />;
}
