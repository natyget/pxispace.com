'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAppPlatform } from '@/hooks/useAppPlatform';

// antd's QR code is loaded only here: never on the server, never on a phone, and only once the screen is wide enough.
const GoEventQr = dynamic(() => import('./GoEventQr'), { ssr: false });

const DESKTOP_WIDTH = '(min-width: 900px)';

/**
 * The desktop QR of a night, or nothing. Both checks wait for the browser, so the server HTML carries no QR code.
 *
 * @param {{ url: string }} props
 */
export default function GoEventQrGate({ url }) {
  const platform = useAppPlatform();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_WIDTH);
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  if (platform !== 'desktop' || !wide) return null;
  return <GoEventQr url={url} />;
}
