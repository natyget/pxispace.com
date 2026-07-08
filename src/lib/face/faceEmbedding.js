// PXI — Browser face embedding engine (pxi-face-v1 contract)
// Human `faceres` description model, 1024-dim descriptor, L2-normalized.
// The SAME contract runs on the backend for album photos and inside the mobile
// app's on-device WebView for enrollment, so vectors are directly comparable.
//
// The face MESH model is additionally enabled in the browser only — it powers the
// ID-verification-style capture gating (head yaw/pitch/roll + framing checks).
// It does NOT change the embedding, so the pxi-face-v1 contract is untouched.
//
// PRIVACY: everything in this module runs locally in the browser. Raw frames
// never leave the device; callers only ever receive numbers.

export const FACE_MODEL_ID = 'pxi-face-v1';
export const FACE_VECTOR_DIM = 1024;

let humanPromise = null;

async function getHuman() {
  if (!humanPromise) {
    humanPromise = (async () => {
      // Resolved to the browser ESM build via next.config resolveAlias — the
      // package's default "node" entry would pull in @tensorflow/tfjs-node.
      const { Human } = await import('@vladmandic/human');
      const human = new Human({
        modelBasePath: '/models/human/',
        backend: 'humangl',
        debug: false,
        warmup: 'face',
        filter: { enabled: false },
        face: {
          enabled: true,
          detector: { modelPath: 'blazeface.json', maxDetected: 3, minConfidence: 0.3 },
          // Mesh gives head rotation angles for guided capture (browser only).
          mesh: { enabled: true, modelPath: 'facemesh.json' },
          iris: { enabled: false },
          attention: { enabled: false },
          description: { enabled: true, modelPath: 'faceres.json' },
          emotion: { enabled: false },
          antispoof: { enabled: false },
          liveness: { enabled: false },
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
      });
      await human.load();
      return human;
    })();
    humanPromise.catch(() => {
      humanPromise = null; // allow retry after a transient load failure
    });
  }
  return humanPromise;
}

/** Preload models (call when the scan UI opens so capture feels instant). */
export function warmupFaceEngine() {
  getHuman().catch(() => {});
}

export function l2Normalize(vector) {
  const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0)) || 1;
  return vector.map((x) => x / norm);
}

/**
 * Average several L2-normalized pxi-face-v1 vectors into one, re-normalized.
 * Used by multi-angle enrollment: one embedding per guided pose -> one stored
 * vector. The result stays on the pxi-face-v1 contract (1024-dim, unit length),
 * so the single-vector-per-user backend contract is unchanged.
 */
export function averageFaceVectors(vectors) {
  if (!vectors || vectors.length === 0) return null;
  if (vectors.length === 1) return l2Normalize(Array.from(vectors[0]));
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  return l2Normalize(sum);
}

/**
 * Detect the dominant face in a video/canvas/image element and return its
 * L2-normalized pxi-face-v1 vector, or null when no confident face is found.
 */
export async function extractFaceVector(source) {
  const human = await getHuman();
  // human.detect(input, userConfig) merges userConfig into the shared instance
  // config PERMANENTLY (mergeDeep) — so analyzeFace's `description: false` from
  // the guidance loop would otherwise stick and silently disable embeddings.
  // Explicitly re-enable the description model on every capture.
  const result = await human.detect(source, {
    face: { description: { enabled: true } },
  });
  const faces = (result.face || []).filter(
    (f) => Array.isArray(f.embedding) && f.embedding.length === FACE_VECTOR_DIM,
  );
  if (faces.length === 0) return null;
  // Dominant face = largest box area
  faces.sort((a, b) => (b.box[2] * b.box[3]) - (a.box[2] * a.box[3]));
  return l2Normalize(Array.from(faces[0].embedding));
}

const RAD_TO_DEG = 180 / Math.PI;

/** Mean luma (0-255) of the current video frame, sampled tiny for speed. */
function measureBrightness(video) {
  try {
    if (!measureBrightness.canvas) {
      measureBrightness.canvas = document.createElement('canvas');
      measureBrightness.canvas.width = 24;
      measureBrightness.canvas.height = 24;
    }
    const canvas = measureBrightness.canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return sum / (data.length / 4);
  } catch {
    return null; // canvas blocked — treat lighting as unknown, don't gate on it
  }
}

/**
 * Lightweight per-frame analysis for guided capture (NO embedding computed —
 * the description model is skipped so this can run several times per second).
 *
 * Returns null when detection isn't possible, otherwise:
 * { count, faceScore, sizeRatio, centerOffsetX, centerOffsetY,
 *   yawDeg, pitchDeg, rollDeg, hasAngles, brightness }
 * Angles are degrees; sign convention is left unspecified — callers should gate
 * on magnitude and relative direction, not absolute left/right.
 */
export async function analyzeFace(video) {
  const human = await getHuman();
  const result = await human.detect(video, {
    face: { description: { enabled: false } },
  });
  const faces = result.face || [];
  const width = video.videoWidth || 0;
  const height = video.videoHeight || 0;
  if (faces.length === 0 || !width || !height) {
    return { count: faces.length, brightness: measureBrightness(video) };
  }
  const sorted = [...faces].sort((a, b) => (b.box[2] * b.box[3]) - (a.box[2] * a.box[3]));
  const face = sorted[0];
  const [x, y, w, h] = face.box;
  const angle = face.rotation?.angle;
  return {
    count: faces.length,
    faceScore: face.faceScore ?? face.boxScore ?? face.score ?? 0,
    // Face width relative to the SHORTER frame side (portrait/landscape safe)
    sizeRatio: w / Math.min(width, height),
    // Face-center offset from frame center, as a fraction of frame size
    centerOffsetX: (x + w / 2 - width / 2) / width,
    centerOffsetY: (y + h / 2 - height / 2) / height,
    yawDeg: angle ? angle.yaw * RAD_TO_DEG : null,
    pitchDeg: angle ? angle.pitch * RAD_TO_DEG : null,
    rollDeg: angle ? angle.roll * RAD_TO_DEG : null,
    hasAngles: !!angle,
    brightness: measureBrightness(video),
  };
}
