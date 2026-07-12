'use client';

// PXI — Guided face capture (camera preview + on-device framing analysis).
// The local model (facemesh) is used ONLY for live guidance gates — framing,
// lighting, head angle. Captured frames are handed to `onFrames` as JPEG
// data-URLs; the caller sends them to the PXI server, which computes the
// pxi-face-v2 embedding in memory and never stores the images.
//
// ID-verification-style guided capture: a live analysis loop checks framing,
// lighting and head angle (facemesh rotation) for each guided pose and
// AUTO-CAPTURES once the pose is held steady — with live corrective guidance
// ("move closer", "turn a bit more") like passport/ID scan apps. A manual
// capture button remains as fallback (and for devices where mesh can't load).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeFace, warmupFaceEngine } from '@/lib/face/faceEmbedding';

// One frame per guided pose. Multiple angles make the server-side enrollment
// far more robust to head rotation at match time.
const ALL_POSES = [
  { key: 'center', label: 'Straight on', prompt: 'Look straight at the camera', side: false },
  { key: 'left', label: 'Slightly left', prompt: 'Slowly turn your head slightly left', side: true },
  { key: 'right', label: 'Slightly right', prompt: 'Now turn your head slightly right', side: true },
];

/** Snapshot the current (unmirrored) camera frame as a JPEG data-URL. */
function captureFrame(video) {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.88);
}

const CAPTURED_FLASH_MS = 1400;
const ANALYZE_INTERVAL_MS = 220;
// Pose must be held for this many consecutive good samples before auto-capture.
const STABLE_SAMPLES = 3;

// Framing / quality gates
const MIN_FACE_SCORE = 0.5;
const MIN_SIZE_RATIO = 0.26; // face width vs shorter frame side
const MAX_SIZE_RATIO = 0.9;
const MAX_CENTER_OFFSET = 0.14;
const MIN_BRIGHTNESS = 46;
const MAX_BRIGHTNESS = 235;
const MAX_ROLL_DEG = 14;
// Head-turn targets (degrees). Side poses gate on |yaw| magnitude and require the
// two side poses to be turned in OPPOSITE directions — never on an absolute
// left/right sign, which varies with camera mirroring.
const CENTER_MAX_YAW = 9;
const CENTER_MAX_PITCH = 14;
const SIDE_MIN_YAW = 11;
const SIDE_MAX_YAW = 40;
const SIDE_MAX_PITCH = 18;

/**
 * Evaluate one analysis sample against the gates for a pose.
 * Returns { ok, message } — message is the live corrective guidance.
 */
function evaluateGates(a, pose, oppositeSideSign) {
  if (!a || a.count === 0) return { ok: false, message: 'Center your face in the oval' };
  if (a.count > 1) return { ok: false, message: 'Make sure only you are in the frame' };
  if (a.brightness != null && a.brightness < MIN_BRIGHTNESS)
    return { ok: false, message: 'Too dark — face a light source' };
  if (a.brightness != null && a.brightness > MAX_BRIGHTNESS)
    return { ok: false, message: 'Too bright — avoid direct light' };
  if (a.sizeRatio < MIN_SIZE_RATIO) return { ok: false, message: 'Move a little closer' };
  if (a.sizeRatio > MAX_SIZE_RATIO) return { ok: false, message: 'Move back a little' };
  if (Math.abs(a.centerOffsetX) > MAX_CENTER_OFFSET || Math.abs(a.centerOffsetY) > MAX_CENTER_OFFSET)
    return { ok: false, message: 'Center your face in the oval' };
  if (a.faceScore < MIN_FACE_SCORE) return { ok: false, message: 'Hold still…' };

  if (a.hasAngles) {
    if (Math.abs(a.rollDeg) > MAX_ROLL_DEG) return { ok: false, message: 'Keep your head level' };
    if (!pose.side) {
      if (Math.abs(a.yawDeg) > CENTER_MAX_YAW || Math.abs(a.pitchDeg) > CENTER_MAX_PITCH)
        return { ok: false, message: 'Look straight at the camera' };
    } else {
      const yawMag = Math.abs(a.yawDeg);
      if (yawMag < SIDE_MIN_YAW) return { ok: false, message: 'Turn your head a little more' };
      if (yawMag > SIDE_MAX_YAW) return { ok: false, message: 'Too far — turn back slightly' };
      if (Math.abs(a.pitchDeg) > SIDE_MAX_PITCH)
        return { ok: false, message: 'Keep your chin level' };
      if (oppositeSideSign != null && Math.sign(a.yawDeg) === oppositeSideSign)
        return { ok: false, message: 'Turn the other way for this one' };
    }
  }
  return { ok: true, message: 'Perfect — hold still…' };
}

export default function FaceScanCapture({ onFrames, onCancel, ctaLabel = 'Scan my face', poseCount = 3 }) {
  // Guest scans need a single straight-on frame; enrollment uses all poses.
  const POSES = useMemo(() => ALL_POSES.slice(0, Math.max(1, poseCount)), [poseCount]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const flashTimerRef = useRef(null);
  const [cameraState, setCameraState] = useState('starting'); // starting | ready | denied | error
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [startAttempt, setStartAttempt] = useState(0);
  // Per-pose captured frames (null until that pose is captured).
  const [captures, setCaptures] = useState(() => ALL_POSES.slice(0, Math.max(1, poseCount)).map(() => null));
  const [activePose, setActivePose] = useState(0);
  const [mode, setMode] = useState('capture'); // capture | review
  const [justCaptured, setJustCaptured] = useState(null); // pose index, transient
  // Live guidance from the analysis loop: { ok, message }
  const [guide, setGuide] = useState(null);

  // Refs mirrored for the analysis loop (avoids stale closures in the interval).
  const scanningRef = useRef(false);
  const activePoseRef = useRef(0);
  const capturesRef = useRef(captures);
  const stableCountRef = useRef(0);
  // Yaw sign each side pose was captured with — the other side must be opposite.
  const sideSignsRef = useRef({});
  const lastYawSignRef = useRef(null);
  useEffect(() => {
    scanningRef.current = scanning;
    activePoseRef.current = activePose;
    capturesRef.current = captures;
  }, [scanning, activePose, captures]);

  const capturedCount = captures.filter(Boolean).length;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  useEffect(() => {
    if (mode !== 'capture') return undefined;
    let cancelled = false;
    setCameraState('starting');
    warmupFaceEngine();
    // Watchdog: some WebViews leave getUserMedia pending forever instead of
    // rejecting — surface an actionable error instead of spinning.
    const watchdog = setTimeout(() => {
      if (!cancelled && !streamRef.current) setCameraState('error');
    }, 8000);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraState('error');
          return;
        }
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
        clearTimeout(watchdog);
        setCameraState('ready');
      } catch (err) {
        clearTimeout(watchdog);
        setCameraState(err?.name === 'NotAllowedError' ? 'denied' : 'error');
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      stopCamera();
    };
  }, [stopCamera, startAttempt, mode]);

  const capturePose = useCallback(
    async (poseIndex) => {
      if (!videoRef.current || scanningRef.current) return;
      scanningRef.current = true;
      setScanning(true);
      setScanError(null);
      try {
        // Confirm a face is actually in frame before keeping the shot (manual
        // captures skip the auto-capture gates, so re-check here).
        let present = false;
        for (let attempt = 0; attempt < 3 && !present; attempt++) {
          const a = await analyzeFace(videoRef.current).catch(() => null);
          present = !!a && a.count > 0;
          if (!present) await new Promise((r) => setTimeout(r, 350));
        }
        if (!present) {
          setScanError('No face detected. Center your face in the frame with good lighting and try again.');
          setScanning(false);
          scanningRef.current = false;
          return;
        }
        const frame = captureFrame(videoRef.current);

        // Remember which way the head was turned for opposite-direction checks.
        if (POSES[poseIndex].side && lastYawSignRef.current != null) {
          sideSignsRef.current[poseIndex] = lastYawSignRef.current;
        }

        const nextCaptures = capturesRef.current.map((v, i) => (i === poseIndex ? frame : v));
        setCaptures(nextCaptures);
        setScanning(false);
        scanningRef.current = false;
        stableCountRef.current = 0;
        setGuide(null);

        // Per-pose captured feedback ("Pose 2 captured")
        setJustCaptured(poseIndex);
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setJustCaptured(null), CAPTURED_FLASH_MS);

        const nextEmpty = nextCaptures.findIndex((v) => !v);
        if (nextEmpty === -1) {
          stopCamera();
          if (POSES.length === 1) {
            // Single-frame flows (guest scan) skip review — hand off directly.
            onFrames(nextCaptures.filter(Boolean));
          } else {
            // All poses captured — review before anything is sent.
            setMode('review');
          }
        } else {
          setActivePose(nextEmpty);
        }
      } catch {
        setScanError('Face scan failed to start. Please refresh and try again.');
        setScanning(false);
        scanningRef.current = false;
      }
    },
    [stopCamera, POSES, onFrames],
  );

  // ── Live guidance + auto-capture loop ───────────────────────────────────────
  useEffect(() => {
    if (mode !== 'capture' || cameraState !== 'ready') return undefined;
    let disposed = false;
    let busy = false;
    const timer = setInterval(async () => {
      if (disposed || busy || scanningRef.current || !videoRef.current) return;
      busy = true;
      try {
        const analysis = await analyzeFace(videoRef.current);
        if (disposed || scanningRef.current) return;
        const poseIndex = activePoseRef.current;
        const pose = POSES[poseIndex];
        // The other side pose's captured yaw sign (if any) — must turn opposite.
        const otherSide = POSES.findIndex((p, i) => p.side && i !== poseIndex);
        const oppositeSideSign = pose.side ? (sideSignsRef.current[otherSide] ?? null) : null;
        const verdict = evaluateGates(analysis, pose, oppositeSideSign);
        if (analysis?.hasAngles && analysis.yawDeg != null) {
          lastYawSignRef.current = Math.sign(analysis.yawDeg) || null;
        }
        setGuide((prev) =>
          prev?.ok === verdict.ok && prev?.message === verdict.message ? prev : verdict,
        );
        stableCountRef.current = verdict.ok ? stableCountRef.current + 1 : 0;
        if (stableCountRef.current >= STABLE_SAMPLES) {
          stableCountRef.current = 0;
          await capturePose(poseIndex);
        }
      } catch {
        /* analysis unavailable this tick — manual capture still works */
      } finally {
        busy = false;
      }
    }, ANALYZE_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [mode, cameraState, capturePose]);

  const handleRetakePose = useCallback((index) => {
    setCaptures((prev) => prev.map((v, i) => (i === index ? null : v)));
    delete sideSignsRef.current[index];
    stableCountRef.current = 0;
    setActivePose(index);
    setScanError(null);
    setJustCaptured(null);
    setGuide(null);
    setMode('capture');
    setStartAttempt((n) => n + 1); // restart the camera for the retake
  }, []);

  const handleStartOver = useCallback(() => {
    setCaptures(POSES.map(() => null));
    sideSignsRef.current = {};
    stableCountRef.current = 0;
    setActivePose(0);
    setScanError(null);
    setJustCaptured(null);
    setGuide(null);
    setMode('capture');
    setStartAttempt((n) => n + 1);
  }, []);

  const handleSave = useCallback(() => {
    const frames = captures.filter(Boolean);
    if (frames.length !== POSES.length) return;
    // Hand the captured pose frames to the caller — the server derives the
    // enrollment vector (+ per-angle exemplars) and discards the images.
    onFrames(frames);
  }, [captures, onFrames, POSES.length]);

  const pose = POSES[Math.min(activePose, POSES.length - 1)];

  // ── Review step: all poses captured, nothing saved yet ─────────────────────
  if (mode === 'review') {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-center text-sm font-black uppercase tracking-[0.2em] text-white">
          {POSES.length}/{POSES.length} captured
        </h3>
        <p className="mt-2 max-w-xs text-center text-xs text-zinc-400">
          Retake any angle, or save to finish.
        </p>

        <ul className="mt-5 w-full max-w-xs space-y-2">
          {POSES.map((p, i) => (
            <li
              key={p.key}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] px-4 py-3"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-pxi-purple text-[11px] font-black text-white">
                  ✓
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  {p.label}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleRetakePose(i)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/20 hover:text-white"
              >
                Retake
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleSave}
          className="mt-6 w-full max-w-xs rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(216,74,255,0.4)] transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleStartOver}
          className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
        >
          Start over
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:text-white"
          >
            Not now
          </button>
        ) : null}

        <p className="mt-5 max-w-xs text-center text-[11px] leading-relaxed text-zinc-500">
          Your captures are sent securely to PXI, converted once into an irreversible
          mathematical vector, and the photos are immediately destroyed — never stored.
        </p>
      </div>
    );
  }

  // ── Capture step ────────────────────────────────────────────────────────────
  const aligned = guide?.ok === true;
  return (
    <div className="flex flex-col items-center">
      {/* Face-ID-style portrait oval, sized to dominate the screen.
          Border goes green the moment the pose is aligned. */}
      <div
        className={`relative h-[26rem] w-[19rem] max-h-[55dvh] overflow-hidden rounded-[50%] bg-zinc-900 ring-1 transition-shadow duration-300 ${
          aligned
            ? 'ring-emerald-400/80 shadow-[0_0_36px_rgba(52,211,153,0.3)]'
            : 'ring-white/15'
        }`}
      >
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-8 text-center text-xs text-zinc-400">
            <span>
              {cameraState === 'denied'
                ? 'Camera access was blocked. Allow camera permission to scan.'
                : 'Could not start the camera on this device.'}
            </span>
            <button
              type="button"
              onClick={() => setStartAttempt((n) => n + 1)}
              className="rounded-full bg-white/10 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>

      {/* Live guidance chip — BELOW the oval so the ellipse mask can never clip it */}
      <div className="mt-4 flex h-7 items-center justify-center">
        {cameraState === 'ready' && justCaptured == null && guide ? (
          <span
            className={`rounded-full bg-white/[0.07] px-4 py-1.5 text-[11px] font-black uppercase tracking-widest ${
              aligned ? 'text-emerald-300' : 'text-white'
            }`}
          >
            {scanning ? 'Capturing…' : guide.message}
          </span>
        ) : null}
        {justCaptured != null ? (
          <span className="rounded-full bg-white/[0.07] px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-pxi-purple">
            ✓ Pose {justCaptured + 1} captured
          </span>
        ) : null}
      </div>

      {/* 3-step progress dots — filled + check once a pose is captured */}
      <div className="mt-3 flex items-center gap-3">
        {POSES.map((p, i) => (
          <span
            key={p.key}
            className={`flex size-4 items-center justify-center rounded-full text-[9px] font-black text-white transition ${
              captures[i]
                ? 'bg-pxi-purple'
                : i === activePose
                  ? 'bg-pxi-purple/40 ring-2 ring-pxi-purple/50'
                  : 'bg-white/15'
            }`}
          >
            {captures[i] ? '✓' : ''}
          </span>
        ))}
      </div>

      {/* Current pose prompt */}
      {cameraState === 'ready' ? (
        <p className="mt-3 max-w-xs text-center text-sm font-semibold text-white">
          {`Step ${activePose + 1} of ${POSES.length} — ${pose.prompt}`}
        </p>
      ) : null}
      {cameraState === 'ready' && !scanning ? (
        <p className="mt-1 text-center text-[11px] text-zinc-500">
          Captures automatically when the pose is right
        </p>
      ) : null}

      {scanError ? (
        <p className="mt-4 max-w-xs text-center text-xs text-red-400">{scanError}</p>
      ) : null}

      {/* Manual fallback — auto-capture is the primary path */}
      <button
        type="button"
        onClick={() => capturePose(activePose)}
        disabled={cameraState !== 'ready' || scanning}
        className="mt-5 w-full max-w-xs rounded-full bg-white/10 px-8 py-3 text-xs font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
      >
        {scanning ? 'Scanning…' : capturedCount === 0 ? `${ctaLabel} manually` : 'Capture this angle manually'}
      </button>

      {/* Retake the previous pose without losing the rest */}
      {capturedCount > 0 && !scanning ? (
        <button
          type="button"
          onClick={() => {
            const lastCaptured = captures.reduce((acc, v, i) => (v ? i : acc), -1);
            if (lastCaptured >= 0) handleRetakePose(lastCaptured);
          }}
          className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          Retake previous pose
        </button>
      ) : null}

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
        Your capture is sent securely to PXI, converted once into an irreversible
        mathematical vector, and the photo is immediately destroyed — never stored.
      </p>
    </div>
  );
}
