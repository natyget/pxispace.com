'use client';

// PXI — Guided face capture (camera preview + on-device framing analysis).
//
// This is the WEB twin of the app's NativeFaceCapture: same poses, same copy,
// same Face-ID-style guidance (short head-turn cue + ideal-distance silhouette),
// same green lock ring, same primary Capture button. Keep the two in sync —
// a user who enrolls on one and rescans on the other should see one product.
//
// The local model (facemesh) is used ONLY for live guidance gates — framing,
// lighting, head angle. Captured frames are handed to `onFrames` as JPEG
// data-URLs; the caller sends them to the PXI server, which computes the
// pxi-face-v2 embedding in memory and never stores the images.
//
// MANUAL CAPTURE ONLY (matches the app): detection drives the ring and the
// corrective guidance line, and never fires the shutter. The user decides when
// the shot is taken, so what they saw is what gets sent.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeFace, warmupFaceEngine } from '@/lib/face/faceEmbedding';

// One frame per guided pose. Multiple angles make the server-side enrollment
// far more robust to head rotation at match time.
const ALL_POSES = [
  {
    key: 'center',
    label: 'Straight on',
    prompt: 'Look straight at the camera',
    hint: 'Fill the inner outline, then tap Capture',
    readyHint: 'Looking good — tap Capture',
    side: false,
  },
  {
    key: 'left',
    label: 'Slightly left',
    prompt: 'Turn slightly left',
    hint: 'Turn left like the guide, then tap Capture',
    readyHint: 'Left pose looks good — tap Capture',
    side: true,
  },
  {
    key: 'right',
    label: 'Slightly right',
    prompt: 'Turn slightly right',
    hint: 'Turn right like the guide, then tap Capture',
    readyHint: 'Right pose looks good — tap Capture',
    side: true,
  },
];

// Keep payloads small for the RN WebView bridge (full-res data-URLs used to hang).
const MAX_CAPTURE_DIM = 480;
const JPEG_QUALITY = 0.68;

const SCAN_GREEN = '#32D74B';
const RING_IDLE = 'rgba(255,255,255,0.28)';
const FLASH_MS = 650;
const GUIDE_MS = 500;
/** Cue fades to a resting opacity after the turn completes. */
const GUIDE_FADE_MS = 220;

const ANALYZE_INTERVAL_MS = 220;
/** Consecutive matching samples before the ring turns green. */
const LOCK_STREAK = 3;
/** Consecutive mismatches before the ring turns off (hysteresis, no flicker). */
const UNLOCK_STREAK = 4;

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

/** Snapshot the current (unmirrored) camera frame as a JPEG data-URL. */
function captureFrame(video) {
  const srcW = video.videoWidth || 640;
  const srcH = video.videoHeight || 640;
  const scale = Math.min(1, MAX_CAPTURE_DIM / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Evaluate one analysis sample against the gates for a pose.
 * Returns { ok, message } — message is the live corrective guidance shown
 * under the oval (the app shows a static hint here; the browser has the mesh
 * model loaded anyway, so it can say WHY the pose isn't accepted yet).
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
  return { ok: true, message: pose.readyHint };
}

/**
 * Oval viewfinder size — same shape rule as the app (width ≈ 0.92 × height so
 * the sides curve; a skinny portrait pill reads flat). Capped tighter than the
 * app's 52dvh because on web this lives inside a modal with copy above and
 * buttons below.
 */
function useOvalSize() {
  const [size, setSize] = useState({ ovalW: 240, ovalH: 261 });
  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxH = Math.min(Math.floor(vh * 0.4), 380);
      // Modal is max-w-md (448) with p-8 gutters; never wider than the viewport.
      const maxW = Math.min(Math.floor(Math.min(vw, 448) - 64), 340);
      let h = Math.max(200, maxH);
      let w = Math.floor(h * 0.92);
      if (w > maxW) {
        w = maxW;
        h = Math.floor(w / 0.92);
      }
      setSize({ ovalW: w, ovalH: h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return size;
}

/**
 * Drives the ~0.5s cue with rAF rather than CSS: the SVG feature parallax
 * animates `cx`/`r`/`d`, and `d` in particular is not reliably CSS-animatable
 * across browsers. One rAF loop for 720ms is cheaper than getting that wrong.
 */
function useCueProgress(active, poseKey) {
  const [frame, setFrame] = useState({ t: 0, opacity: 0 });
  useEffect(() => {
    if (!active) {
      setFrame({ t: 0, opacity: 0 });
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const e = now - start;
      const p = Math.min(1, e / GUIDE_MS);
      // Easing.out(Easing.cubic) — same curve as the app.
      const t = 1 - (1 - p) ** 3;
      let opacity;
      if (e < 120) opacity = e / 120;
      else if (e < GUIDE_MS) opacity = 1;
      else if (e < GUIDE_MS + GUIDE_FADE_MS) opacity = 1 - 0.45 * ((e - GUIDE_MS) / GUIDE_FADE_MS);
      else opacity = 0.55;
      setFrame({ t, opacity });
      if (e < GUIDE_MS + GUIDE_FADE_MS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, poseKey]);
  return frame;
}

/**
 * ~0.5s Face-ID-style cue.
 * Center: ideal-distance silhouette grows into the oval.
 * Left/right: wireframe face yaws on Y (perspective) — never Z-roll/tilt.
 */
function PoseGuideCue({ poseKey, ovalW, ovalH, visible }) {
  const { t, opacity } = useCueProgress(visible, poseKey);
  if (!visible) return null;

  // Ideal face size ≈ 65% of viewfinder oval (distance guide).
  const faceRx = ovalW * 0.32;
  const faceRy = ovalH * 0.34;
  const cx = ovalW / 2;
  const cy = ovalH * 0.46;
  // Positive rotateY brings the left edge forward → nose points screen-right.
  // Mirrored selfie cue: turn left = nose screen-left = negative rotateY.
  const yawSign = poseKey === 'left' ? -1 : poseKey === 'right' ? 1 : 0;
  const YAW_DEG = 38;
  const isCenter = poseKey === 'center';

  const faceTransform = isCenter
    ? `scale(${lerp(0.72, 1, t)})`
    : `perspective(720px) rotateY(${lerp(0, yawSign * YAW_DEG, t)}deg)`;

  // Feature parallax reinforces yaw even when perspective is subtle on small ovals.
  const shift = yawSign * lerp(0, faceRx * 0.1, t);
  const leftNear = yawSign > 0; // right turn → left eye is near
  const leftEye = isCenter
    ? { cx: cx - faceRx * 0.28, r: 3.2, opacity: 0.55 }
    : {
        cx: cx - faceRx * 0.28 + shift,
        r: lerp(3.2, leftNear ? 3.6 : 2.4, t),
        opacity: lerp(0.55, leftNear ? 0.7 : 0.28, t),
      };
  const rightNear = yawSign < 0; // left turn → right eye is near
  const rightEye = isCenter
    ? { cx: cx + faceRx * 0.28, r: 3.2, opacity: 0.55 }
    : {
        cx: cx + faceRx * 0.28 + shift,
        r: lerp(3.2, rightNear ? 3.6 : 2.4, t),
        opacity: lerp(0.55, rightNear ? 0.7 : 0.28, t),
      };

  const tipX = cx + yawSign * lerp(0, faceRx * 0.22, t);
  const bridgeX = cx + yawSign * lerp(0, faceRx * 0.06, t);
  const nose = {
    opacity: isCenter ? 0 : lerp(0, 0.55, t),
    d: `M ${bridgeX} ${cy - faceRy * 0.02} L ${tipX} ${cy + faceRy * 0.14}`,
  };

  const mouthT = isCenter ? 0 : t;
  const mouthShift = yawSign * lerp(0, faceRx * 0.12, mouthT);
  const mouthHalf = lerp(faceRx * 0.22, faceRx * 0.16, mouthT);
  const mouthY = cy + faceRy * 0.28;
  const mouthQy = cy + faceRy * 0.4;
  const mouthD = `M ${cx - mouthHalf + mouthShift} ${mouthY} Q ${cx + mouthShift} ${mouthQy} ${
    cx + mouthHalf + mouthShift
  } ${mouthY}`;

  // Slight horizontal foreshortening as the head turns (profile suggestion).
  const outlineRx = isCenter ? faceRx * 0.85 : lerp(faceRx * 0.85, faceRx * 0.62, t);

  // Dash draw-on for the ideal-distance oval (pose 0).
  const DASH_LEN = 520;
  const dashOffset = DASH_LEN - lerp(DASH_LEN * 0.15, DASH_LEN, t);

  // Arc cue rides with the turn (not a flat slide).
  const arrowSpin = lerp(0, yawSign * -28, t) * 0.35;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Ideal distance silhouette — strongest on first pose */}
      {isCenter ? (
        <svg width={ovalW} height={ovalH} className="absolute inset-0" aria-hidden>
          <ellipse
            cx={cx}
            cy={cy}
            rx={faceRx}
            ry={faceRy}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.5}
            fill="rgba(255,255,255,0.06)"
            strokeDasharray="10 8"
            strokeDashoffset={dashOffset}
          />
          {/* Soft head silhouette hint */}
          <ellipse
            cx={cx}
            cy={cy - faceRy * 0.05}
            rx={faceRx * 0.72}
            ry={faceRy * 0.78}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
            fill="transparent"
          />
        </svg>
      ) : null}

      <div
        className="absolute left-0 top-0 flex items-center justify-center"
        style={{ width: ovalW, height: ovalH, opacity, transform: faceTransform }}
      >
        <svg width={ovalW} height={ovalH} aria-hidden>
          {/* Wireframe face — yawed via the parent's rotateY */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={outlineRx}
            ry={faceRy * 0.9}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1.6}
            fill="rgba(255,255,255,0.04)"
          />
          <circle
            cx={leftEye.cx}
            cy={cy - faceRy * 0.12}
            r={leftEye.r}
            fill="#fff"
            opacity={leftEye.opacity}
          />
          <circle
            cx={rightEye.cx}
            cy={cy - faceRy * 0.12}
            r={rightEye.r}
            fill="#fff"
            opacity={rightEye.opacity}
          />
          {/* Nose tip drifts with yaw so the turn reads as profile, not tilt */}
          <path
            d={nose.d}
            stroke="rgba(255,255,255,0.65)"
            strokeWidth={1.5}
            fill="transparent"
            strokeLinecap="round"
            opacity={nose.opacity}
          />
          <path
            d={mouthD}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1.4}
            fill="transparent"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!isCenter ? (
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{
            top: ovalH * 0.08,
            opacity: opacity * 0.95,
            transform: `perspective(400px) rotateY(${arrowSpin}deg) scale(${lerp(0.92, 1, t)})`,
          }}
        >
          {/* Curved turn arrow (yaw), not a straight chevron */}
          <svg width={72} height={36} aria-hidden>
            <path
              d={
                poseKey === 'left'
                  ? 'M 54 28 C 54 12, 40 4, 22 8 M 22 8 L 28 4 M 22 8 L 28 14'
                  : 'M 18 28 C 18 12, 32 4, 50 8 M 50 8 L 44 4 M 50 8 L 44 14'
              }
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2.2}
              fill="transparent"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
}

/** Persistent ideal-distance dashed oval for pose 0 (after the cue settles). */
function IdealDistanceGuide({ ovalW, ovalH, show }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg width={ovalW} height={ovalH} aria-hidden>
        <ellipse
          cx={ovalW / 2}
          cy={ovalH * 0.46}
          rx={ovalW * 0.32}
          ry={ovalH * 0.34}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.25}
          strokeDasharray="9 7"
          fill="transparent"
        />
      </svg>
    </div>
  );
}

export default function FaceScanCapture({ onFrames, onCancel, poseCount = 3 }) {
  // Guest scans need a single straight-on frame; enrollment uses all poses.
  const POSES = useMemo(() => ALL_POSES.slice(0, Math.max(1, poseCount)), [poseCount]);
  const { ovalW, ovalH } = useOvalSize();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const flashTimerRef = useRef(null);
  const [cameraState, setCameraState] = useState('starting'); // starting | ready | denied | error
  const [scanError, setScanError] = useState(null);
  const [startAttempt, setStartAttempt] = useState(0);
  // Per-pose captured frames (null until that pose is captured).
  const [captures, setCaptures] = useState(() =>
    ALL_POSES.slice(0, Math.max(1, poseCount)).map(() => null),
  );
  const [activePose, setActivePose] = useState(0);
  const [mode, setMode] = useState('capture'); // capture | review
  const [phase, setPhase] = useState('idle'); // idle | busy | flash
  const [guideVisible, setGuideVisible] = useState(true);
  // Live corrective guidance from the analysis loop: { ok, message }
  const [guide, setGuide] = useState(null);
  const [faceLocked, setFaceLocked] = useState(false);

  // Refs mirrored for the analysis loop (avoids stale closures in the interval).
  const capturingRef = useRef(false);
  const activePoseRef = useRef(0);
  const capturesRef = useRef(captures);
  const streakRef = useRef({ match: 0, miss: 0 });
  // Yaw sign each side pose was captured with — the other side must be opposite.
  const sideSignsRef = useRef({});
  const lastYawSignRef = useRef(null);
  useEffect(() => {
    activePoseRef.current = activePose;
    capturesRef.current = captures;
  }, [activePose, captures]);

  const capturedCount = captures.filter(Boolean).length;
  const pose = POSES[Math.min(activePose, POSES.length - 1)];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  // Replay the short cue whenever the pose changes (including first mount).
  useEffect(() => {
    setGuideVisible(true);
    streakRef.current = { match: 0, miss: 0 };
    setFaceLocked(false);
    const timer = setTimeout(() => setGuideVisible(false), GUIDE_MS + 280);
    return () => clearTimeout(timer);
  }, [activePose]);

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
      if (!videoRef.current || capturingRef.current) return;
      capturingRef.current = true;
      setPhase('busy');
      setScanError(null);
      try {
        // Confirm a face is actually in frame before keeping the shot — capture
        // is manual, so it can be tapped from any framing.
        let present = false;
        for (let attempt = 0; attempt < 3 && !present; attempt++) {
          const a = await analyzeFace(videoRef.current).catch(() => null);
          present = !!a && a.count > 0;
          if (!present) await new Promise((r) => setTimeout(r, 350));
        }
        if (!present) {
          setScanError(
            'No face detected. Center your face in the frame with good lighting and try again.',
          );
          setPhase('idle');
          capturingRef.current = false;
          return;
        }
        const frame = captureFrame(videoRef.current);

        // Remember which way the head was turned for opposite-direction checks.
        if (POSES[poseIndex].side && lastYawSignRef.current != null) {
          sideSignsRef.current[poseIndex] = lastYawSignRef.current;
        }

        const nextCaptures = capturesRef.current.map((v, i) => (i === poseIndex ? frame : v));
        setCaptures(nextCaptures);
        capturesRef.current = nextCaptures;
        setGuide(null);
        setPhase('flash');

        const nextEmpty = nextCaptures.findIndex((v) => !v);
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          capturingRef.current = false;
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
            activePoseRef.current = nextEmpty;
            setPhase('idle');
          }
        }, FLASH_MS);
      } catch {
        setScanError('Face scan failed to start. Please refresh and try again.');
        setPhase('idle');
        capturingRef.current = false;
      }
    },
    [stopCamera, POSES, onFrames],
  );

  // ── Live guidance loop (ring lock only — never auto-captures) ───────────────
  useEffect(() => {
    if (mode !== 'capture' || cameraState !== 'ready') return undefined;
    let disposed = false;
    let busy = false;
    const timer = setInterval(async () => {
      if (disposed || busy || capturingRef.current || !videoRef.current) return;
      busy = true;
      try {
        const analysis = await analyzeFace(videoRef.current);
        if (disposed || capturingRef.current) return;
        const poseIndex = activePoseRef.current;
        const activeGatePose = POSES[poseIndex];
        // The other side pose's captured yaw sign (if any) — must turn opposite.
        const otherSide = POSES.findIndex((p, i) => p.side && i !== poseIndex);
        const oppositeSideSign = activeGatePose.side
          ? (sideSignsRef.current[otherSide] ?? null)
          : null;
        const verdict = evaluateGates(analysis, activeGatePose, oppositeSideSign);
        if (analysis?.hasAngles && analysis.yawDeg != null) {
          lastYawSignRef.current = Math.sign(analysis.yawDeg) || null;
        }
        setGuide((prev) =>
          prev?.ok === verdict.ok && prev?.message === verdict.message ? prev : verdict,
        );

        // Hysteresis so the ring doesn't strobe on a borderline pose.
        const streak = streakRef.current;
        if (verdict.ok) {
          streak.match += 1;
          streak.miss = 0;
          if (streak.match >= LOCK_STREAK) setFaceLocked(true);
        } else {
          streak.miss += 1;
          streak.match = 0;
          if (streak.miss >= UNLOCK_STREAK) setFaceLocked(false);
        }
      } catch {
        /* analysis unavailable this tick — capture still works */
      } finally {
        busy = false;
      }
    }, ANALYZE_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [mode, cameraState, POSES]);

  const handleRetakePose = useCallback((index) => {
    setCaptures((prev) => prev.map((v, i) => (i === index ? null : v)));
    delete sideSignsRef.current[index];
    streakRef.current = { match: 0, miss: 0 };
    setActivePose(index);
    setScanError(null);
    setGuide(null);
    setPhase('idle');
    capturingRef.current = false;
    setMode('capture');
    setStartAttempt((n) => n + 1); // restart the camera for the retake
  }, []);

  const handleStartOver = useCallback(() => {
    setCaptures(POSES.map(() => null));
    sideSignsRef.current = {};
    streakRef.current = { match: 0, miss: 0 };
    setActivePose(0);
    setScanError(null);
    setGuide(null);
    setPhase('idle');
    capturingRef.current = false;
    setMode('capture');
    setStartAttempt((n) => n + 1);
  }, [POSES]);

  const handleSave = useCallback(() => {
    const frames = captures.filter(Boolean);
    if (frames.length !== POSES.length) return;
    // Hand the captured pose frames to the caller — the server derives the
    // enrollment vector (+ per-angle exemplars) and discards the images.
    onFrames(frames);
  }, [captures, onFrames, POSES.length]);

  // ── Review step: all poses captured, nothing saved yet ─────────────────────
  if (mode === 'review') {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center text-sm text-zinc-400">
          {POSES.length} poses ready — retake any, or save.
        </p>

        <ul className="mt-5 w-full max-w-xs space-y-2">
          {POSES.map((p, i) => (
            <li key={p.key} className="flex items-center justify-between gap-3 px-1 py-2">
              <span className="flex items-center gap-2.5">
                <span className="size-2 rounded-full" style={{ background: SCAN_GREEN }} aria-hidden />
                <span className="text-sm text-white">{p.label}</span>
              </span>
              <button
                type="button"
                onClick={() => handleRetakePose(i)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Retake
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleSave}
          className="mt-6 w-full max-w-xs rounded-full px-8 py-3.5 text-[17px] font-bold text-black transition"
          style={{ background: SCAN_GREEN }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleStartOver}
          className="mt-3 text-sm font-semibold text-white/45 hover:text-white"
        >
          Start over
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 text-sm font-semibold text-white/45 hover:text-white"
          >
            Not now
          </button>
        ) : null}
      </div>
    );
  }

  // ── Capture step ────────────────────────────────────────────────────────────
  const busy = phase === 'busy' || phase === 'flash';
  const ringOn = phase === 'flash' || (phase === 'idle' && faceLocked);
  const guideText =
    phase === 'flash'
      ? 'Got it — next pose'
      : phase === 'busy'
        ? 'Capturing…'
        : cameraState !== 'ready'
          ? ''
          : faceLocked
            ? pose.readyHint
            : (guide?.message ?? pose.hint);

  return (
    <div className="flex flex-col items-center">
      {/* Prompt ABOVE the viewfinder — never inside the oval */}
      <div className="mb-2 max-w-xs text-center">
        {/* Single-frame guest scans have no sequence to report — "Pose 1 of 1"
            is noise, so the step line only shows on multi-pose enrollment. */}
        {POSES.length > 1 ? (
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/45">
            Pose {activePose + 1} of {POSES.length}
          </p>
        ) : null}
        <h1 className="mt-2 px-3 text-[18px] font-bold leading-snug text-white">{pose.prompt}</h1>
      </div>

      {/* Portrait oval — ring goes green only on a real pose lock */}
      <div
        className="relative overflow-hidden bg-[#111] transition-[border-color,box-shadow] duration-300"
        style={{
          width: ovalW,
          height: ovalH,
          borderRadius: '50%',
          borderWidth: 3,
          borderStyle: 'solid',
          borderColor: ringOn ? SCAN_GREEN : RING_IDLE,
          boxShadow: ringOn
            ? `0 0 22px rgba(50,215,75,0.85)`
            : '0 0 22px rgba(0,0,0,0.35)',
        }}
      >
        <video ref={videoRef} playsInline muted className="size-full -scale-x-100 object-cover" />
        <IdealDistanceGuide
          ovalW={ovalW}
          ovalH={ovalH}
          show={pose.key === 'center' && phase === 'idle' && !guideVisible && cameraState === 'ready'}
        />
        <PoseGuideCue
          poseKey={pose.key}
          ovalW={ovalW}
          ovalH={ovalH}
          visible={guideVisible && phase === 'idle' && cameraState === 'ready'}
        />
        {phase === 'flash' ? (
          <div className="pointer-events-none absolute inset-0 bg-[rgba(50,215,75,0.2)]" />
        ) : null}
        {cameraState === 'starting' ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Starting camera…
          </div>
        ) : null}
        {cameraState === 'denied' || cameraState === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center text-xs text-zinc-400">
            <span>
              {cameraState === 'denied'
                ? 'Camera access was blocked. Allow camera permission to scan.'
                : 'Could not start the camera on this device.'}
            </span>
            <button
              type="button"
              onClick={() => setStartAttempt((n) => n + 1)}
              className="rounded-full bg-white/10 px-4 py-2 text-[11px] text-white"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>

      {/* Guidance BELOW the oval — never clipped by overflow-hidden */}
      <div className="mt-3 flex min-h-[22px] w-full max-w-xs items-center justify-center px-2">
        <p
          className={`text-center text-sm ${
            ringOn ? 'font-bold' : 'text-white/75'
          }`}
          style={ringOn ? { color: SCAN_GREEN } : undefined}
        >
          {guideText}
        </p>
      </div>
      {cameraState === 'ready' && phase === 'idle' && !faceLocked ? (
        <p className="mt-1 px-5 text-center text-[11px] text-white/30">
          Ring turns green when your face matches this pose
        </p>
      ) : null}

      {/* Minimal progress — tiny dots only */}
      <div className="mt-3 flex items-center gap-2" aria-label="Pose progress">
        {POSES.map((p, i) => (
          <span
            key={p.key}
            className={`h-[7px] rounded-full transition-all ${
              captures[i] ? 'w-[7px]' : i === activePose ? 'w-[18px] bg-white' : 'w-[7px] bg-white/25'
            }`}
            style={captures[i] ? { background: SCAN_GREEN } : undefined}
          />
        ))}
      </div>

      {scanError ? (
        <p className="mt-3 max-w-xs text-center text-xs text-red-400">{scanError}</p>
      ) : null}

      <button
        type="button"
        onClick={() => capturePose(activePose)}
        disabled={cameraState !== 'ready' || busy}
        className="mt-4 w-full max-w-xs rounded-full py-[18px] text-[17px] font-bold text-black transition disabled:opacity-55"
        style={{ background: SCAN_GREEN }}
      >
        {phase === 'busy' ? 'Capturing…' : phase === 'flash' ? 'Got it' : 'Capture'}
      </button>

      {capturedCount > 0 && !busy ? (
        <button
          type="button"
          onClick={() => {
            const lastCaptured = captures.reduce((acc, v, i) => (v ? i : acc), -1);
            if (lastCaptured >= 0) handleRetakePose(lastCaptured);
          }}
          className="mt-3 text-sm font-semibold text-white/45 hover:text-white"
        >
          Retake last
        </button>
      ) : null}

      {onCancel ? (
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          disabled={busy}
          className="mt-3 text-sm font-semibold text-white/45 transition hover:text-white disabled:opacity-40"
        >
          Not now
        </button>
      ) : null}
    </div>
  );
}
