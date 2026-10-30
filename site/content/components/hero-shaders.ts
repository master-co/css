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

// The lamp is a point light in CSS pixels (y down) at a height above the page; z is that height.
const lampLighting = `
vec3 toLamp(vec2 screen) {
  return normalize(vec3(lamp.x - screen.x, screen.y - lamp.y, lamp.z));
}
float titleDistance(vec2 screen) {
  vec2 uv = (screen - title.xy) / title.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -distanceRange;
  return (texture2D(glyphs, uv).r - 0.5) * 2.0 * distanceRange;
}`

/** Upscale the sculpted gold, and let the raised title cast a soft shadow away from the lamp. */
export const heroCopySource = `
precision highp float;
varying vec2 vUv;
uniform sampler2D scene;
uniform sampler2D glyphs;
uniform vec2 resolution;
uniform float time;
uniform vec3 ground;
uniform vec4 title;
uniform float distanceRange;
uniform float fontSize;
uniform vec3 lamp;
uniform float shade;
${sceneSampling}
${lampLighting}
void main() {
  vec3 color = backgroundAt(vUv);
  if (shade > 0.0) {
    vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
    // Letters float a short height above the silk; a lower lamp throws a longer, softer shadow.
    float elevation = fontSize * 0.11;
    vec2 offset = (screen - lamp.xy) * elevation / max(lamp.z - elevation, 1.0);
    float reach = length(offset);
    offset *= min(1.0, distanceRange * 0.8 / max(reach, 0.0001));
    // The penumbra widens with distance from the letter; the field saturates at its range, so it stays inside.
    float softness = min(distanceRange * 0.95, 2.0 + reach * 0.85);
    float thrown = smoothstep(-softness, softness * 0.35, titleDistance(screen - offset));
    float contact = smoothstep(-fontSize * 0.05, 0.0, titleDistance(screen));
    // A longer shadow spreads the same occlusion over a wider penumbra, so it also fades.
    float amount = (thrown * thrown * 0.22 * (1.0 - 0.4 * smoothstep(0.0, distanceRange, reach)) + contact * 0.08) * shade;
    // Shadows on gold keep a little warmth instead of turning gray.
    color *= mix(vec3(1.0), vec3(0.78, 0.71, 0.60), amount);
  }
  gl_FragColor = vec4(color, 1.0);
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
uniform vec3 lamp;

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
  // A carried lamp rakes across nearby folds: crests that face it brighten, and the light pools softly.
  vec2 fromLamp = (screen - lamp.xy) / (fontSize * 3.2);
  float pool = exp(-dot(fromLamp, fromLamp)) * pointer.z;
  vec3 toLamp = normalize(vec3(lamp.x - screen.x, screen.y - lamp.y, lamp.z));
  float raking = pow(max(dot(normal, toLamp), 0.0), 6.0);
  color = mix(color, sheen, clamp(pool * (raking * 0.6 + 0.08), 0.0, 1.0));
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

/**
 * Cut stone lit by the lamp. Light mode is polished obsidian: a near-black face, a narrow rounded bevel
 * that mirrors the gold, and one sharp highlight. Dark mode is moonstone: a milky body whose bevel bends the gold behind it.
 */
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
uniform float glint;
uniform float time;
uniform vec3 lamp;
uniform vec3 ink;
uniform vec3 ground;
${lampLighting}

vec3 sceneAt(vec2 uv) {
  return texture2D(scene, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
}

void main() {
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  vec2 textUv = (screen - title.xy) / title.zw;
  if (textUv.x < 0.0 || textUv.y < 0.0 || textUv.x > 1.0 || textUv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec4 glyph = texture2D(glyphs, textUv);
  if (glyph.a < 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float dark = 1.0 - smoothstep(0.25, 0.6, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  float distance = (glyph.r - 0.5) * 2.0 * distanceRange;
  // Screen-space outward direction, y up, so it shares a frame with the lamp.
  vec2 outward = (glyph.gb * 2.0 - 1.0) * vec2(1.0, -1.0);
  float bevel = clamp(fontSize * 0.03, 1.3, 2.8);
  float rise = clamp(distance / bevel, 0.0, 1.0);
  // A quarter-round edge: steep at the contour, flat across the face.
  float slope = (1.0 - rise) * (1.0 - rise) * 2.4;
  vec3 normal = normalize(vec3(outward * slope, 1.0));
  vec3 light = toLamp(screen);
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  float facing = max(dot(normal, halfway), 0.0);
  float edge = 1.0 - rise;
  // Antialiased contour pixels sit on the steepest slope; holding reflections back there avoids a beaded rim.
  float hold = smoothstep(0.0, 0.9, distance);
  float view = (1.0 - normal.z) * hold;
  // The bevel looks sideways into the silk around the letter.
  vec2 aside = normal.xy * fontSize * 0.55 / resolution;
  vec3 surround = sceneAt(vUv + aside);
  vec3 behind = sceneAt(vUv);
  // One studio light sweeps across slowly, plus the intro glint that travels once along the line.
  vec2 plane = (screen - title.xy) / fontSize;
  float band = plane.x * 0.8 - plane.y * 0.55;
  float sweep = exp(-pow((band - (fract(time * 0.018 + 0.35) * 2.6 - 0.8) * title.z / fontSize) / 0.9, 2.0));
  float pass = glint * (1.0 - glint) * 4.0;
  float glintAt = band - mix(-2.0, title.z / fontSize + 2.0, glint);
  float glinting = (exp(-pow(glintAt / 0.13, 2.0)) + exp(-pow(glintAt / 0.6, 2.0)) * 0.12) * pass;

  vec3 obsidian;
  {
    // Edges turned toward the lamp mirror the lit silk; edges turned away fall into the stone's own black.
    float toward = smoothstep(-0.35, 0.85, dot(outward, normalize(light.xy + vec2(0.0001))));
    // The bevel is only a few device pixels wide, so its highlight is broad; only the face takes the sharp spot.
    float hot = (pow(facing, mix(1400.0, 90.0, edge)) * mix(1.1, 0.4, edge) + pow(facing, 160.0) * 0.12 * (1.0 - edge)) * hold;
    vec3 face = vec3(0.030, 0.029, 0.033);
    float fresnel = pow(view, 1.6);
    vec3 color = face;
    color += surround * fresnel * mix(0.05, 0.85, toward);
    // Head-on, the polished face is a dark mirror: a few percent of distant silk, softened and dimmed.
    vec3 mirrored = sceneAt(vec2(vUv.x + (vUv.x - 0.5) * 0.3, vUv.y + 0.22 + plane.y * 0.004));
    vec3 distant = mix(behind, mirrored, 0.7);
    color += distant * distant * 0.085 * (1.0 - edge);
    // Thin edges facing away let a smoky brown through, the way obsidian does when held up to light.
    color += vec3(0.11, 0.06, 0.03) * fresnel * (1.0 - toward) * 0.35;
    color += vec3(1.0, 0.97, 0.92) * hot;
    color += vec3(0.95, 0.88, 0.74) * sweep * (0.025 * (1.0 - edge) + 0.16 * edge * toward);
    color += vec3(1.0, 0.95, 0.86) * glinting * (0.28 + edge * 0.9) * hold;
    obsidian = color;
  }

  vec3 moonstone;
  {
    float toward = smoothstep(-0.4, 0.9, dot(outward, normalize(light.xy + vec2(0.0001))));
    float fresnel = pow(view, 1.4);
    vec2 bend = normal.xy * fontSize * 0.3 / resolution;
    vec3 refracted = sceneAt(vUv - bend);
    // A warm, milky body; near the contour the bright gold behind it glows through, never the dark.
    float core = smoothstep(bevel * 0.5, bevel + fontSize * 0.06, distance);
    vec3 color = ink * vec3(0.94, 0.905, 0.85);
    color += refracted * refracted * edge * 0.45;
    // Adularescence: a cool, billowing light floats under the surface where the lamp's angle catches it,
    // brighter than the body, with the stone's blue at its fringe.
    vec2 drift = (screen - lamp.xy) / fontSize;
    float billow = 0.5 + 0.25 * sin(drift.x * 0.9 - drift.y * 0.6 + time * 0.16 + sin(drift.y * 1.3 + time * 0.11) * 1.6)
      + 0.25 * sin(drift.x * 2.3 + drift.y * 1.7 - time * 0.21);
    float sheen = smoothstep(0.28, 1.0, pow(halfway.z, 6.0) * billow) * mix(0.55, 1.0, core);
    float fringe = sheen * (1.0 - sheen) * 4.0;
    color = mix(color, vec3(0.74, 0.82, 1.0), fringe * 0.24);
    color = mix(color, vec3(0.95, 0.98, 1.04), sheen * 0.75);
    color += vec3(1.0, 0.82, 0.52) * fresnel * toward * 0.38;
    color *= 1.0 - fresnel * (1.0 - toward) * 0.16;
    float hot = (pow(facing, mix(1200.0, 90.0, edge)) * mix(0.6, 0.25, edge) + pow(facing, 140.0) * 0.08 * (1.0 - edge)) * hold;
    color += vec3(1.0, 0.97, 0.9) * hot;
    color += vec3(1.0, 0.9, 0.7) * sweep * (0.03 + edge * toward * 0.12);
    // On a pale stone the intro glint reads as a wave of the cool sheen rather than more white.
    color = mix(color, vec3(0.74, 0.83, 1.0), clamp(glinting, 0.0, 1.0) * 0.7 * hold);
    moonstone = color;
  }

  vec3 stone = mix(obsidian, moonstone, dark);
  vec3 color = mix(ink, clamp(stone, 0.0, 1.0), material);
  gl_FragColor = vec4(color, glyph.a);
}`
