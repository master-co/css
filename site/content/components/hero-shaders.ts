export const heroPlaneScale = 5.5

export const heroVertexSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

/** Upscale the soft silk with a cheap pass; only the title rectangle runs the glass shader. */
export const heroCopySource = `
precision highp float;
varying vec2 vUv;
uniform sampler2D scene;
void main() {
  gl_FragColor = texture2D(scene, vUv);
}`

export const heroClothSource = `
precision highp float;
varying vec2 vUv;
uniform vec2 resolution;
uniform float time;
uniform float intro;
uniform float rise;
uniform vec3 pointer;
uniform vec3 ring;
uniform vec3 shadow;
uniform vec3 body;
uniform vec3 sheen;
uniform vec3 ground;
uniform vec4 title;
uniform float fontSize;

float cloth(vec2 p) {
  vec2 q = p + 0.32 * vec2(sin(p.y * 1.6 + time * 0.23), sin(p.x * 1.2 - time * 0.19));
  float h = sin(q.x * 1.5 + q.y * 0.8 + time * 0.31) * 0.55;
  h += sin(q.x * 0.6 - q.y * 1.7 + time * 0.21 + sin(q.x * 0.45 + time * 0.12) * 1.6) * 0.38;
  h += sin((q.x + q.y) * 2.6 - time * 0.42) * 0.1;
  vec2 toPointer = p - pointer.xy;
  h += pointer.z * 0.45 * exp(-dot(toPointer, toPointer) * 1.4);
  if (ring.z >= 0.0) {
    float front = length(p - ring.xy) - ring.z * 2.2;
    h += 0.3 * exp(-front * front * 5.0) * max(0.0, 1.0 - ring.z / 2.4);
  }
  return h;
}

void main() {
  float aspect = resolution.x / resolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * ${heroPlaneScale.toFixed(1)};
  float e = 0.012;
  float h = cloth(p);
  vec2 slope = vec2(cloth(p + vec2(e, 0.0)) - h, cloth(p + vec2(0.0, e)) - h) / e;
  vec3 normal = normalize(vec3(-slope * 0.4, 1.0));
  vec3 light = normalize(vec3(-0.5 + pointer.z * 0.25 * pointer.x / aspect, 0.62, 0.6));
  float lit = max(dot(normal, light), 0.0);
  float facing = max(dot(normal, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0);
  float gloss = pow(facing, 18.0) + pow(facing, 90.0) * 0.6;
  vec3 color = mix(shadow, body, smoothstep(0.05, 0.9, lit));
  color = mix(color, sheen, clamp(gloss + pow(lit, 10.0) * 0.3, 0.0, 1.0));
  float x = vUv.x - 0.5;
  float titleBottom = title.y + title.w;
  float lifted = 1.0 - (titleBottom - fontSize * 1.9) / resolution.y;
  float edge = rise + max(0.0, lifted - rise) * exp(-x * x * 18.0) + 0.95 * x * x + h * 0.05;
  float alpha = (1.0 - smoothstep(edge - 0.24, edge + 0.02, vUv.y)) * intro;
  float screenY = (1.0 - vUv.y) * resolution.y;
  // Open a soft band behind the lower title, then return to the original clearing behind the prose.
  float band = exp(-pow((screenY - titleBottom + fontSize * 0.5) / (fontSize * 1.2), 2.0));
  band *= 1.0 - smoothstep(titleBottom, titleBottom + fontSize * 0.55, screenY);
  float clearing = smoothstep(0.3, 1.0, length((vUv - vec2(0.5, 0.56)) / vec2(0.46, 0.34)));
  alpha *= mix(clearing, 1.0, band * 0.9);
  alpha *= smoothstep(0.0, 0.16, vUv.y);
  // Static film grain belongs to the silk, so the polished glass remains clear.
  vec2 grainPoint = floor(vUv * resolution);
  float grain = fract(sin(dot(grainPoint, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  color += grain * 0.065;
  gl_FragColor = vec4(mix(ground, color, alpha), 1.0);
}`

export const heroCompositeSource = `
precision highp float;
varying vec2 vUv;
uniform sampler2D scene;
uniform sampler2D glyphs;
uniform vec2 resolution;
uniform vec4 title;
uniform float distanceRange;
uniform float fontSize;
uniform float material;
uniform vec3 pointer;
uniform vec3 ink;
uniform vec3 ground;

void main() {
  vec3 background = texture2D(scene, vUv).rgb;
  float dark = 1.0 - smoothstep(0.25, 0.6, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  vec2 textUv = (screen - title.xy) / title.zw;
  if (textUv.x < 0.0 || textUv.y < 0.0 || textUv.x > 1.0 || textUv.y > 1.0) {
    gl_FragColor = vec4(background, 1.0);
    return;
  }
  vec4 glyph = texture2D(glyphs, textUv);
  float shadowDistance = (texture2D(glyphs, textUv - vec2(0.6, 1.8) / title.zw).r - 0.5) * 2.0 * distanceRange;
  background *= 1.0 - smoothstep(-0.7, 1.1, shadowDistance) * mix(0.15, 0.3, dark) * material;
  if (glyph.a < 0.002) {
    gl_FragColor = vec4(background, 1.0);
    return;
  }
  float distance = max(0.0, (glyph.r - 0.5) * 2.0 * distanceRange);
  float bevel = max(1.3, fontSize * 0.052);
  float shoulder = 1.0 - smoothstep(0.0, bevel, distance);
  vec2 outward = glyph.gb * 2.0 - 1.0;
  vec3 normal = normalize(vec3(outward * shoulder * 0.96, sqrt(max(0.08, 1.0 - shoulder * shoulder * 0.92))));
  vec3 light = normalize(vec3(-0.55 + pointer.x * pointer.z * 0.12, -0.7 - pointer.y * pointer.z * 0.12, 0.9));
  vec3 halfLight = normalize(light + vec3(0.0, 0.0, 1.0));
  float highlight = pow(max(dot(normal, halfLight), 0.0), 44.0) * shoulder;
  float rim = pow(1.0 - normal.z, 2.0);
  float thickness = fontSize * 0.4 * (0.85 + pointer.z * 0.15) * material;
  vec2 offset = vec2(normal.x, -normal.y) * thickness / resolution;
  vec3 transmitted = texture2D(scene, clamp(vUv + offset, vec2(0.0), vec2(1.0))).rgb;
  // A restrained neutral tint gives the long headline a stable reading silhouette in both schemes.
  vec3 glass = mix(ink, transmitted, mix(0.76, 0.46, dark) - (1.0 - shoulder) * 0.08);
  float edgeLight = max(dot(normal.xy, normalize(light.xy)), 0.0);
  vec3 reflection = mix(ink * 0.35, vec3(1.0), edgeLight);
  glass = mix(glass, reflection, rim * 0.6);
  glass += vec3(highlight * mix(0.72, 0.56, dark));
  float lip = 1.0 - smoothstep(0.2, 0.95, distance);
  glass = mix(glass, reflection, lip * 0.32);
  // A fine lower contact edge suggests thickness without moving or distorting the letter's outline.
  glass *= 1.0 - shoulder * max(normal.y, 0.0) * mix(0.28, 0.12, dark);
  vec3 color = mix(ink, clamp(glass, 0.0, 1.0), material);
  gl_FragColor = vec4(mix(background, color, glyph.a), 1.0);
}`
