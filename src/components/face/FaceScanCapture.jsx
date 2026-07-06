'use client';

// PXI — In-browser face scan (camera preview + local pxi-face-v1 embedding).
// Raw frames never leave the device: the camera stream feeds the local model
// and only the numeric vector is handed to `onVector`.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { extractFaceVector, warmupFaceEngine, FACE_MODEL_ID } from '@/lib/face/faceEmbedding';

export default function FaceScanCapture({ onVector, onCancel, ctaLabel = 'Scan my face' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('starting'); // starting | ready | denied | error
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    warmupFaceEngine();
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraState('ready');
      } catch (err) {
        setCameraState(err?.name === 'NotAllowedError' ? 'denied' : 'error');
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  const handleScan = useCallback(async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true);
    setScanError(null);
    try {
      // Sample a few frames and keep the first confident face
      let vector = null;
      for (let attempt = 0; attempt < 3 && !vector; attempt++) {
        vector = await extractFaceVector(videoRef.current);
        if (!vector) await new Promise((r) => setTimeout(r, 350));
      }
      if (!vector) {
        setScanError('No face detected. Center your face in the frame with good lighting and try again.');
        setScanning(false);
        return;
      }
      stopCamera();
      onVector(vector, FACE_MODEL_ID);
    } catch {
      setScanError('Face scan failed to start. Please refresh and try again.');
      setScanning(false);
    }
  }, [onVector, scanning, stopCamera]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-56 overflow-hidden rounded-full border-2 border-pxi-purple/50 bg-zinc-900 shadow-[0_0_40px_rgba(216,74,255,0.25)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full -scale-x-100 object-cover"
        />
        {cameraState === 'starting' ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Starting camera…
          </div>
        ) : null}
        {cameraState === 'denied' || cameraState === 'error' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-xs text-zinc-400">
            {cameraState === 'denied'
              ? 'Camera access was blocked. Allow camera permission in your browser to scan.'
              : 'Could not start the camera on this device.'}
          </div>
        ) : null}
      </div>

      {scanError ? (
        <p className="mt-4 max-w-xs text-center text-xs text-red-400">{scanError}</p>
      ) : null}

      <button
        type="button"
        onClick={handleScan}
        disabled={cameraState !== 'ready' || scanning}
        className="mt-6 w-full max-w-xs rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(216,74,255,0.4)] transition disabled:opacity-40"
      >
        {scanning ? 'Scanning…' : ctaLabel}
      </button>
      {onCancel ? (
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
        >
          Not now
        </button>
      ) : null}

      <p className="mt-5 max-w-xs text-center text-[11px] leading-relaxed text-zinc-500">
        Your scan is processed entirely on this device. The photo is destroyed instantly —
        only an irreversible mathematical vector is used to find your shots.
      </p>
    </div>
  );
}
