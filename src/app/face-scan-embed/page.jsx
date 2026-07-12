'use client';

// Chrome-free face-scan page loaded inside the PXI mobile app's on-device WebView
// for biometric enrollment (pxi-face-v2). The camera + guided capture run inside
// this WebView; the captured pose FRAMES are handed back to the native app via
// ReactNativeWebView.postMessage, and the app submits them to the PXI server,
// which derives the embedding in memory and never stores the images. This page
// itself performs no network calls with biometric content.

import React, { useCallback, useState } from 'react';
import FaceScanCapture from '@/components/face/FaceScanCapture';

export default function FaceScanEmbedPage() {
  const [done, setDone] = useState(false);

  const postToApp = useCallback((payload) => {
    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
    } catch {
      /* not inside the app WebView */
    }
  }, []);

  const handleFrames = useCallback(
    (images) => {
      setDone(true);
      // The app PUTs these to /api/face/enrollment with its auth token.
      postToApp({ type: 'PXI_FACE_FRAMES', images });
    },
    [postToApp],
  );

  const handleCancel = useCallback(() => {
    postToApp({ type: 'PXI_FACE_SCAN_CANCELLED' });
  }, [postToApp]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 py-10 text-white">
      {done ? (
        <div className="text-center">
          <h1 className="text-xl font-black uppercase tracking-[0.18em]">
            Scan <span className="text-pxi-purple">complete</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400">Finishing up in the app…</p>
        </div>
      ) : (
        <>
          <h1 className="mb-8 text-center text-xl font-black uppercase tracking-[0.18em]">
            Center your <span className="text-pxi-purple">face</span>
          </h1>
          <FaceScanCapture onFrames={handleFrames} onCancel={handleCancel} ctaLabel="Scan my face" />
        </>
      )}
    </div>
  );
}
