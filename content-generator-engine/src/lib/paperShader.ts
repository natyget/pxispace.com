// GLSL shared by the paper objects (polaroid, ticket). Kept as strings so each
// material stays one file you can read top to bottom.

export const PAPER_COMMON = /* glsl */ `
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform float uKey;
uniform float uFlash;

varying vec2 vUv;
varying vec3 vPosW;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Face normal from screen-space derivatives: follows whatever bend or curl the
// vertex shader applied, with no analytic normal to keep in sync.
vec3 bentNormal() {
  vec3 n = normalize(cross(dFdx(vPosW), dFdy(vPosW)));
  if (dot(n, cameraPosition - vPosW) < 0.0) n = -n;
  return n;
}

float keyTerm(vec3 n) { return max(dot(n, normalize(uKeyDir)) * 0.7 + 0.3, 0.0); }
float flashTerm(vec3 n) { return max(dot(n, normalize(cameraPosition - vPosW)), 0.0) * uFlash; }

// Matte paper: warm-white key (wrapped, no specular), near-black fill, flash from the lens.
vec3 lightPaper(vec3 albedo, vec3 n) {
  vec3 light = vec3(0.04) + uKeyColor * keyTerm(n) * uKey + vec3(1.0) * flashTerm(n) * 1.4;
  return albedo * light;
}

// Photos keep their own colour: brightness follows the light, hue never does,
// so faces read true and nothing looks filtered.
vec3 lightPhoto(vec3 img, vec3 n) {
  return img * (0.55 + 0.5 * keyTerm(n) * uKey) + img * flashTerm(n) * 0.8;
}
`;

export const PAPER_VERTEX_HEAD = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosW;
`;

// No tone mapping: ACES desaturates skin. Colour space conversion only.
export const PAPER_FRAGMENT_TAIL = /* glsl */ `
  #include <colorspace_fragment>
`;
