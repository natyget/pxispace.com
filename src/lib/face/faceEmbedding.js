// PXI — Browser face embedding engine (pxi-face-v1 contract)
// Human `faceres` description model, 1024-dim descriptor, L2-normalized.
// The SAME contract runs on the backend for album photos and inside the mobile
// app's on-device WebView for enrollment, so vectors are directly comparable.
//
// PRIVACY: everything in this module runs locally in the browser. Raw frames
// never leave the device; callers only ever receive the numeric vector.

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
          mesh: { enabled: false },
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

function l2Normalize(vector) {
  const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0)) || 1;
  return vector.map((x) => x / norm);
}

/**
 * Detect the dominant face in a video/canvas/image element and return its
 * L2-normalized pxi-face-v1 vector, or null when no confident face is found.
 */
export async function extractFaceVector(source) {
  const human = await getHuman();
  const result = await human.detect(source);
  const faces = (result.face || []).filter(
    (f) => Array.isArray(f.embedding) && f.embedding.length === FACE_VECTOR_DIM,
  );
  if (faces.length === 0) return null;
  // Dominant face = largest box area
  faces.sort((a, b) => (b.box[2] * b.box[3]) - (a.box[2] * a.box[3]));
  return l2Normalize(Array.from(faces[0].embedding));
}
