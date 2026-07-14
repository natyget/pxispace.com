'use client';

// Chrome-free face-scan page loaded inside the PXI mobile app's on-device WebView
// for biometric enrollment (pxi-face-v2). The camera + guided capture run inside
// this WebView; the captured pose FRAMES are handed back to the native app via
// ReactNativeWebView.postMessage (one frame per message, optionally part-chunked),
// and the app submits them to the PXI server, which derives the embedding in
// memory and never stores the images. This page itself performs no network calls
// with biometric content.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import FaceScanCapture from '@/components/face/FaceScanCapture';

const ACK_TIMEOUT_MS = 12_000;
/** Stay under typical RN WebView postMessage comfort size. */
const MAX_PART_CHARS = 48_000;
const FRAME_GAP_MS = 50;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function FaceScanEmbedPage() {
  // scan | handing | error
  const [phase, setPhase] = useState('scan');
  const [scanKey, setScanKey] = useState(0);
  const pendingImagesRef = useRef(null);
  const ackTimerRef = useRef(null);
  const ackedRef = useRef(false);

  const clearAckTimer = useCallback(() => {
    if (ackTimerRef.current != null) {
      clearTimeout(ackTimerRef.current);
      ackTimerRef.current = null;
    }
  }, []);

  const postToApp = useCallback((payload) => {
    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
    } catch {
      /* not inside the app WebView */
    }
  }, []);

  const sendFramesToApp = useCallback(
    async (images) => {
      const total = images.length;
      postToApp({ type: 'PXI_FACE_HANDOFF_START', total });
      await sleep(FRAME_GAP_MS);

      for (let index = 0; index < total; index++) {
        const image = images[index];
        if (typeof image === 'string' && image.length > MAX_PART_CHARS) {
          const parts = Math.ceil(image.length / MAX_PART_CHARS);
          for (let part = 0; part < parts; part++) {
            const data = image.slice(part * MAX_PART_CHARS, (part + 1) * MAX_PART_CHARS);
            postToApp({
              type: 'PXI_FACE_FRAME_PART',
              index,
              total,
              part,
              parts,
              data,
            });
            await sleep(FRAME_GAP_MS);
          }
        } else {
          postToApp({ type: 'PXI_FACE_FRAME', index, total, image });
          await sleep(FRAME_GAP_MS);
        }
      }

      postToApp({ type: 'PXI_FACE_FRAMES_DONE', total });
    },
    [postToApp],
  );

  const startHandoff = useCallback(
    async (images) => {
      pendingImagesRef.current = images;
      ackedRef.current = false;
      setPhase('handing');
      clearAckTimer();
      try {
        await sendFramesToApp(images);
      } catch {
        setPhase('error');
        return;
      }
      ackTimerRef.current = setTimeout(() => {
        if (!ackedRef.current) setPhase('error');
      }, ACK_TIMEOUT_MS);
    },
    [clearAckTimer, sendFramesToApp],
  );

  const handleFrames = useCallback(
    (images) => {
      void startHandoff(images);
    },
    [startHandoff],
  );

  const handleCancel = useCallback(() => {
    clearAckTimer();
    postToApp({ type: 'PXI_FACE_SCAN_CANCELLED' });
  }, [clearAckTimer, postToApp]);

  const handleTryAgain = useCallback(() => {
    const images = pendingImagesRef.current;
    if (!images?.length) {
      setPhase('scan');
      setScanKey((n) => n + 1);
      return;
    }
    void startHandoff(images);
  }, [startHandoff]);

  const handleRestartScan = useCallback(() => {
    clearAckTimer();
    pendingImagesRef.current = null;
    setPhase('scan');
    setScanKey((n) => n + 1);
  }, [clearAckTimer]);

  // Native injects PXI_FACE_ACK via injectJavaScript → window message / custom event.
  useEffect(() => {
    const onAckPayload = (raw) => {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (data?.type !== 'PXI_FACE_ACK') return;
        ackedRef.current = true;
        clearAckTimer();
        // Stay on handing UI; native takes over the screen after ack.
      } catch {
        /* ignore non-JSON */
      }
    };

    const onWindowMessage = (event) => onAckPayload(event.data);
    const onDocumentMessage = (event) => onAckPayload(event.data);
    const onCustomAck = () => onAckPayload(JSON.stringify({ type: 'PXI_FACE_ACK' }));

    window.addEventListener('message', onWindowMessage);
    // Android WebView often delivers injected messages on document.
    document.addEventListener('message', onDocumentMessage);
    window.addEventListener('PXI_FACE_ACK', onCustomAck);
    return () => {
      window.removeEventListener('message', onWindowMessage);
      document.removeEventListener('message', onDocumentMessage);
      window.removeEventListener('PXI_FACE_ACK', onCustomAck);
      clearAckTimer();
    };
  }, [clearAckTimer]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-5 py-8 text-white">
      {phase === 'handing' ? (
        <div className="flex flex-col items-center text-center">
          <div
            className="size-9 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400"
            aria-hidden
          />
          <h1 className="mt-5 text-lg font-semibold tracking-wide text-white">
            Scan complete
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Finishing up in the app…</p>
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="flex max-w-xs flex-col items-center text-center">
          <h1 className="text-lg font-semibold tracking-wide text-white">
            Couldn’t finish
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            The app didn’t confirm your scan. Try sending again, or restart.
          </p>
          <button
            type="button"
            onClick={handleTryAgain}
            className="mt-6 w-full rounded-full bg-emerald-400 px-8 py-3.5 text-sm font-semibold text-black transition"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={handleRestartScan}
            className="mt-3 text-sm text-zinc-500 hover:text-white"
          >
            Restart scan
          </button>
        </div>
      ) : null}

      {phase === 'scan' ? (
        <FaceScanCapture
          key={scanKey}
          onFrames={handleFrames}
          onCancel={handleCancel}
          ctaLabel="Scan my face"
          poseCount={3}
        />
      ) : null}
    </div>
  );
}
