export const heroPlaneScale = 5.5

export const heroVertexSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

// Resolve grain at CSS-pixel density. The shared coordinates prevent rectangular scissor seams.
const sceneSampling = `
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float grainAt(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y) - 0.5;
}
vec3 backgroundAt(vec2 uv) {
  vec3 color = texture2D(scene, uv).rgb;
  vec2 p = uv * resolution * 1.15;
  p += vec2(sin(uv.y * 5.0 + time * 0.08) * 1.4, time * 0.12);
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float coverage = clamp(length(color - ground) * 7.0, 0.0, 1.0);
  return color + grainAt(p) * 0.044 * smoothstep(0.025, 0.25, luminance) * coverage;
}`

/** Upscale the sculpted gold; expensive glass passes cover only their own bounds. */
export const heroCopySource = `
precision highp float;
varying vec2 vUv;
uniform sampler2D scene;
uniform vec2 resolution;
uniform float time;
uniform vec3 ground;
${sceneSampling}
void main() {
  gl_FragColor = vec4(backgroundAt(vUv), 1.0);
}`

export const heroClothSource = `
precision highp float;
varying vec2 vUv;
uniform vec2 resolution;
uniform float time;
uniform float intro;
uniform vec3 pointer;
uniform vec3 shadow;
uniform vec3 body;
uniform vec3 sheen;
uniform vec3 ground;
uniform vec4 title;
uniform vec4 readingArea;
uniform float fontSize;

float cloth(vec2 p) {
  // Independent warped folds form broad valleys and continuous curved crests.
  vec2 q = p + vec2(sin(p.y * 0.82 + time * 0.11), sin(p.x * 0.68 - time * 0.09)) * 0.56;
  float a = q.x * 1.13 + q.y * 0.92 + sin(q.y * 0.72 - time * 0.07) * 0.65 + time * 0.21;
  float b = q.x * 0.48 - q.y * 1.22 + sin(q.x * 0.67 + time * 0.08) * 0.85 - time * 0.16;
  float h = sin(a) * 0.72 + sin(b) * 0.64;
  h += atan(sin(a + b * 0.38) * 4.0) * 0.58;
  vec2 local = p - pointer.xy;
  h += pointer.z * 0.20 * exp(-dot(local, local) * 1.15);
  return h;
}

void main() {
  float aspect = resolution.x / resolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * ${heroPlaneScale.toFixed(1)};
  float e = 0.009;
  float h = cloth(p);
  vec2 slope = vec2(cloth(p + vec2(e, 0.0)) - h, cloth(p + vec2(0.0, e)) - h) / e;
  vec3 normal = normalize(vec3(-slope * 1.05, 1.0));
  vec3 light = normalize(vec3(-0.65 + pointer.x * pointer.z * 0.035, 0.72, 0.72));
  float lit = max(dot(normal, light), 0.0);
  float facing = max(dot(normal, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0);
  // A wide rough reflection rolls over the folds, with a restrained highlight at the lip.
  float reflection = pow(facing, 18.0);
  float crest = pow(facing, 58.0) * 0.18;
  vec3 color = mix(shadow, body, smoothstep(0.06, 0.91, lit));
  color = mix(color, sheen, clamp(reflection * 0.74 + crest, 0.0, 1.0));
  color *= 0.94 + 0.06 * smoothstep(-1.3, 1.3, h);

  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  // A soft, open reading band keeps pale glass legible when a dark-theme crest crosses it.
  float dark = 1.0 - smoothstep(0.25, 0.6, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  float above = smoothstep(title.y - fontSize * 1.45, title.y - fontSize * 0.12, screen.y);
  float below = 1.0 - smoothstep(title.y + title.w + fontSize * 0.12, title.y + title.w + fontSize * 1.45, screen.y);
  color *= mix(1.0, 0.46, above * below * dark);
  float x = vUv.x - 0.5;
  float crown = 1.0 - title.y / resolution.y + 0.18;
  float edge = crown - x * 0.24 + x * x * 0.9 + sin(x * 4.5 + 0.7) * 0.055 + h * 0.055;
  float alpha = (1.0 - smoothstep(edge - 0.26, edge + 0.12, vUv.y)) * intro;
  // The reading space follows the sheet and opens toward the lower left, never a closed panel.
  vec2 reading = (screen - readingArea.xy - readingArea.zw * 0.5) / max(readingArea.zw * vec2(0.62, 0.65) + fontSize * vec2(0.8, 1.05), vec2(1.0));
  reading.x += reading.y * 0.17 - 0.08 + max(reading.y, 0.0) * 0.32;
  reading.y /= 1.0 + max(reading.y, 0.0) * 0.6;
  reading.y += sin(reading.x * 1.1 + 0.4) * 0.24 + h * 0.08;
  alpha *= mix(0.14, 1.0, smoothstep(0.58, 1.9, length(reading)));
  float bottom = smoothstep(0.0, 0.24 + x * 0.12 + h * 0.025, vUv.y);
  alpha *= bottom * bottom * (3.0 - 2.0 * bottom);
  alpha *= 1.0 - smoothstep(0.91, 1.12, vUv.y) * 0.55;
  gl_FragColor = vec4(mix(ground, color, alpha), 1.0);
}`

/** A flat optical film: quiet transmission and one broad reflection, without an extruded bevel. */
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
uniform float time;
uniform vec3 pointer;
uniform vec3 ink;
uniform vec3 ground;

void main() {
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  vec2 textUv = (screen - title.xy) / title.zw;
  if (textUv.x < 0.0 || textUv.y < 0.0 || textUv.x > 1.0 || textUv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float dark = 1.0 - smoothstep(0.25, 0.6, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  vec4 glyph = texture2D(glyphs, textUv);
  float distance = (glyph.r - 0.5) * 2.0 * distanceRange;
  float contour = (1.0 - glyph.a) * smoothstep(-1.0, -0.1, distance) * mix(0.36, 0.02, dark) * material;
  if (glyph.a < 0.002) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, contour);
    return;
  }
  vec2 plane = (vUv - 0.5) * vec2(resolution.x / resolution.y, 1.0) * ${heroPlaneScale.toFixed(1)};
  vec2 toPointer = pointer.xy - plane;
  float proximity = exp(-dot(toPointer, toPointer) * 1.25) * pointer.z;
  vec2 flow = vec2(sin(plane.y * 1.2 + time * 0.12), cos(plane.x - time * 0.09));
  vec2 outward = glyph.gb * 2.0 - 1.0;
  vec2 offset = (flow * 0.6 + outward * 0.4) * min(2.4, fontSize * 0.035) * material / resolution;
  vec3 transmitted = texture2D(scene, clamp(vUv + vec2(offset.x, -offset.y), vec2(0.0), vec2(1.0))).rgb;
  float luminance = dot(transmitted, vec3(0.2126, 0.7152, 0.0722));
  transmitted = mix(vec3(luminance), transmitted, 0.30);
  float reflectedPosition = plane.x * 0.72 + plane.y * 0.42 + sin(time * 0.10) * 2.2;
  float reflection = exp(-pow(reflectedPosition / 1.15, 2.0));
  float film = mix(0.66, 0.72, dark) + reflection * 0.10 - proximity * 0.035;
  vec3 glass = mix(transmitted, ink, film);
  // A subpixel contour keeps light glass readable, with no drop shadow or nested reflective ridge.
  float edge = 1.0 - smoothstep(0.0, 0.65, max(distance, 0.0));
  glass *= 1.0 - edge * mix(0.12, 0.025, dark);
  glass += vec3(reflection * 0.025 + proximity * 0.012);
  vec3 color = mix(ink, clamp(glass, 0.0, 1.0), material);
  float alpha = glyph.a + contour;
  gl_FragColor = vec4(color * glyph.a / max(alpha, 0.0001), alpha);
}`
