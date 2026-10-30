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
  // Threads, not sand: the grain is drawn out along the folds' prevailing diagonal.
  p = mat2(0.77, 0.64, -0.64, 0.77) * p * vec2(0.4, 1.0);
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float coverage = clamp(length(color - ground) * 7.0, 0.0, 1.0);
  return color + grainAt(p) * 0.034 * smoothstep(0.025, 0.25, luminance) * coverage;
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

/**
 * Upscale the sculpted gold, and let the raised title cast a soft shadow away from the lamp.
 * Under each liquid-glass control the silk is refracted: the rim pulls in what lies just outside it,
 * splitting it slightly by wavelength, and the middle magnifies a little.
 */
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
uniform float intro;
uniform vec4 lenses[2];
uniform vec2 lensRadii;
uniform vec2 lensFocus;
${sceneSampling}
${lampLighting}
float lensDistance(vec2 p, vec4 rect, float radius) {
  vec2 halfSize = rect.zw * 0.5;
  vec2 q = abs(p - rect.xy - halfSize) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}
// Most of the canvas is far from both controls; a box test skips their distance fields there.
bool near(vec2 p, vec4 rect, float margin) {
  return rect.z > 0.0 && all(greaterThan(p, rect.xy - margin)) && all(lessThan(p, rect.xy + rect.zw + margin));
}
vec2 uvAt(vec2 screen) {
  return vec2(screen.x / resolution.x, 1.0 - screen.y / resolution.y);
}
void main() {
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  vec2 seen = screen;
  vec2 dispersion = vec2(0.0);
  float thick = 0.0;
  for (int i = 0; i < 2; i++) {
    vec4 rect = lenses[i];
    if (!near(screen, rect, 0.0)) continue;
    float radius = i == 0 ? lensRadii.x : lensRadii.y;
    float d = lensDistance(screen, rect, radius);
    if (d < 0.0) {
      float band = min(rect.w * 0.42, 15.0);
      float bend = pow(1.0 - clamp(-d / band, 0.0, 1.0), 2.2);
      vec2 e = vec2(0.5, 0.0);
      vec2 normal = normalize(vec2(
        lensDistance(screen + e.xy, rect, radius) - lensDistance(screen - e.xy, rect, radius),
        lensDistance(screen + e.yx, rect, radius) - lensDistance(screen - e.yx, rect, radius)) + 0.00001);
      vec2 center = rect.xy + rect.zw * 0.5;
      float focus = i == 0 ? lensFocus.x : lensFocus.y;
      seen = center + (screen - center) * (0.94 - focus * 0.05) + normal * bend * band * (2.2 + focus * 1.2);
      dispersion = normal * bend * (2.6 + focus * 1.6);
      thick = max(thick, bend);
    }
  }
  vec3 color = backgroundAt(uvAt(seen));
  // Caustics: each glass control, a little above the silk, gathers the lamp through its curved rim into a
  // thin warm line on the silk just past its far edge, where its shadow would otherwise fall.
  float gathered = 0.0;
  for (int i = 0; i < 2; i++) {
    vec4 rect = lenses[i];
    if (!near(screen, rect, 16.0)) continue;
    float radius = i == 0 ? lensRadii.x : lensRadii.y;
    vec2 throw = clamp((screen - lamp.xy) * 14.0 / max(lamp.z - 14.0, 1.0), vec2(-8.0), vec2(8.0));
    float projected = lensDistance(screen - throw, rect, radius);
    float outside = smoothstep(-0.5, 1.5, lensDistance(screen, rect, radius));
    // The light lands in the crescent between the glass's edge and its projected edge, fading outward.
    gathered += smoothstep(5.0, -3.0, projected) * outside * clamp(length(throw) / 4.0, 0.0, 1.0);
  }
  color += vec3(1.0, 0.86, 0.6) * gathered * mix(0.03, 0.035, step(dot(ground, vec3(0.2126, 0.7152, 0.0722)), 0.4));
  if (dispersion != vec2(0.0)) {
    color.r = backgroundAt(uvAt(seen + dispersion)).r;
    color.b = backgroundAt(uvAt(seen - dispersion)).b;
    // Light travels farther through the thick rim, so its color deepens there.
    color = mix(color, color * color * 1.08, thick * 0.35);
  }
  if (shade > 0.0) {
    screen = seen;
    // Letters float a short height above the silk; a lower lamp throws a longer, softer shadow.
    float elevation = fontSize * 0.16;
    // The room's light comes from above as well, so shadows lean down even under a lamp held over the type.
    vec2 offset = (screen - lamp.xy + vec2(0.0, fontSize * 0.6)) * elevation / max(lamp.z - elevation, 1.0);
    float reach = length(offset);
    offset *= min(1.0, distanceRange * 0.8 / max(reach, 0.0001));
    // The penumbra widens with distance from the letter; the field saturates at its range, so it stays inside.
    float softness = min(distanceRange * 0.95, 2.0 + reach * 0.85);
    float thrown = smoothstep(-softness, softness * 0.35, titleDistance(screen - offset));
    float contact = smoothstep(-fontSize * 0.05, 0.0, titleDistance(screen));
    // A longer shadow spreads the same occlusion over a wider penumbra, so it also fades.
    // Straight under the lamp the letter hides its own shadow; a penumbra all round would read as a blur.
    float visible = smoothstep(0.5, 5.0, reach);
    float amount = (thrown * thrown * 0.17 * visible * (1.0 - 0.4 * smoothstep(0.0, distanceRange, reach)) + contact * 0.035) * shade;
    // Shadows on gold keep a little warmth instead of turning gray.
    color *= mix(vec3(1.0), vec3(0.78, 0.71, 0.60), amount);
  }
  // The whole field fades in over the page's static gold, so arrival never dips through the bare ground.
  gl_FragColor = vec4(color * intro, intro);
}`

export const heroClothSource = `
precision highp float;
varying vec2 vUv;
uniform vec2 resolution;
uniform float time;
uniform vec3 pointer;
uniform vec3 shadow;
uniform vec3 body;
uniform vec3 sheen;
uniform vec3 ground;
uniform vec4 title;
uniform vec4 readingArea;
uniform float fontSize;
uniform vec3 lamp;
uniform float drift;
uniform vec3 ripple;

float cloth(vec2 p) {
  // Independent warped folds form broad valleys and continuous curved crests. The silk lies deeper than the
  // type, so while the page scrolls its folds lag behind a little.
  vec2 s = p + vec2(0.0, drift);
  vec2 q = s + vec2(sin(s.y * 0.82 + time * 0.11), sin(s.x * 0.68 - time * 0.09)) * 0.56;
  float a = q.x * 1.13 + q.y * 0.92 + sin(q.y * 0.72 - time * 0.07) * 0.65 + time * 0.21;
  float b = q.x * 0.48 - q.y * 1.22 + sin(q.x * 0.67 + time * 0.08) * 0.85 - time * 0.16;
  float h = sin(a) * 0.72 + sin(b) * 0.64;
  h += atan(sin(a + b * 0.38) * 4.0) * 0.58;
  vec2 local = p - pointer.xy;
  h += pointer.z * 0.20 * exp(-dot(local, local) * 1.15);
  // Pressing a control sends one ring through the silk; it spreads and settles within about two seconds.
  if (ripple.z >= 0.0) {
    float travelled = length(p - ripple.xy) - ripple.z * 1.5;
    h += sin(travelled * 5.0) * exp(-travelled * travelled * 2.6) * 0.34 * exp(-ripple.z * 0.85) * smoothstep(0.0, 0.12, ripple.z);
  }
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
  // A wide rough reflection rolls over the folds, with a restrained highlight at the lip. Pale champagne has
  // little room between body and sheen, so there the reflection tightens and the satin carries the folds.
  float pale = smoothstep(0.6, 0.8, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  float reflection = pow(facing, mix(18.0, 30.0, pale));
  float crest = pow(facing, 40.0) * 0.1;
  vec3 color = mix(shadow, body, smoothstep(0.06, 0.91, lit));
  color = mix(color, sheen, clamp(reflection * 0.74 + crest, 0.0, 1.0));
  // Satin: threads run along each fold, so its highlight stretches along the fold and stays narrow across it.
  vec3 along = vec3(-slope.y, slope.x, 0.0);
  float folded = smoothstep(0.04, 0.35, length(along));
  along = normalize(along + vec3(0.0001, 0.0, 0.0));
  along = normalize(along - normal * dot(along, normal));
  vec3 across = cross(normal, along);
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  float aligned = max(dot(halfway, normal), 0.001);
  float satin = exp(-(pow(dot(halfway, along) / 0.6, 2.0) + pow(dot(halfway, across) / 0.14, 2.0)) / (aligned * aligned));
  color = mix(color, sheen, satin * folded * mix(0.17, 0.32, pale));
  color *= 0.94 + 0.06 * smoothstep(-1.3, 1.3, h);

  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  // A carried lamp rakes across nearby folds: crests that face it brighten, and the light pools softly.
  vec2 fromLamp = (screen - lamp.xy) / (fontSize * 3.2);
  float pool = exp(-dot(fromLamp, fromLamp)) * pointer.z;
  vec3 toLamp = normalize(vec3(lamp.x - screen.x, screen.y - lamp.y, lamp.z));
  float raking = pow(max(dot(normal, toLamp), 0.0), 6.0);
  color = mix(color, sheen, clamp(pool * (raking * 0.6 + 0.08), 0.0, 1.0));
  // Raking light also deepens the folds turned away from it, so the lamp shows on pale silk as contrast.
  color *= 1.0 - pool * (1.0 - raking) * 0.14;
  // The crests nearest the lamp mirror it: a narrow satin glint that slides along the folds with the hand.
  float glint = pow(max(dot(normal, normalize(toLamp + vec3(0.0, 0.0, 1.0))), 0.0), 60.0);
  color = mix(color, sheen * 1.04, clamp(glint * pool * 0.65, 0.0, 1.0));
  // A soft, open reading band keeps pale glass legible when a dark-theme crest crosses it.
  float dark = 1.0 - smoothstep(0.25, 0.6, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  float above = smoothstep(title.y - fontSize * 1.45, title.y - fontSize * 0.12, screen.y);
  float below = 1.0 - smoothstep(title.y + title.w + fontSize * 0.12, title.y + title.w + fontSize * 1.45, screen.y);
  // Dimmed warm rather than neutral: the same luminance drop keeps a bright crest amber instead of khaki.
  color *= mix(vec3(1.0), vec3(0.55, 0.45, 0.3), above * below * dark);
  float x = vUv.x - 0.5;
  // On tall screens the silk's top edge also rises toward the header, so the space above the title is never bare.
  float crown = 1.0 - title.y / resolution.y + 0.18 + clamp(1.0 - aspect, 0.0, 1.0) * 0.16;
  float edge = crown - x * 0.24 + x * x * 0.9 + sin(x * 4.5 + 0.7) * 0.055 + h * 0.055;
  // The fade is sized for a landscape screen; on a tall phone the same fraction of height would leave the top
  // empty, so it narrows there and the silk reaches up toward the header.
  float portrait = mix(0.5, 1.0, clamp(aspect, 0.0, 1.0));
  float alpha = 1.0 - smoothstep(edge - 0.26 * portrait, edge + 0.12 * portrait, vUv.y);
  // The reading space follows the sheet and opens toward the lower left, never a closed panel.
  vec2 reading = (screen - readingArea.xy - readingArea.zw * 0.5) / max(readingArea.zw * vec2(0.62, 0.65) + fontSize * vec2(0.8, 1.05), vec2(1.0));
  reading.x += reading.y * 0.17 - 0.08 + max(reading.y, 0.0) * 0.32;
  reading.y /= 1.0 + max(reading.y, 0.0) * 0.6;
  reading.y += sin(reading.x * 1.1 + 0.4) * 0.24 + h * 0.08;
  alpha *= mix(0.55, 1.0, smoothstep(0.58, 1.9, length(reading)));
  float bottom = smoothstep(0.0, 0.3 + x * 0.12 + h * 0.025, vUv.y);
  alpha *= bottom * bottom * (3.0 - 2.0 * bottom);
  alpha *= 1.0 - smoothstep(0.91, 1.12, vUv.y) * 0.55;
  // Half-faded gold over a neutral ground turns gray; the middle of the fade passes through dark amber, or warm
  // ivory in light mode, while both ends still meet the ground and the full silk exactly.
  // Toward the section's foot the warmth lets go first, so the silk settles into the page without a seam.
  vec3 warmth = mix(mix(ground, sheen, 0.55), shadow * 1.4, dark);
  vec3 fadeGround = mix(ground, warmth, alpha * (1.0 - alpha) * 2.4 * smoothstep(0.12, 0.45, vUv.y));
  gl_FragColor = vec4(mix(fadeGround, color, alpha), 1.0);
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
  // A rasterized diagonal leaves a pixel staircase in the field; four taps a little apart smooth the distance
  // and give a steadier normal, so a lit bevel reads as one line instead of a row of beads.
  vec2 tap = vec2(1.1) / title.zw;
  float east = texture2D(glyphs, textUv + vec2(tap.x, 0.0)).r;
  float west = texture2D(glyphs, textUv - vec2(tap.x, 0.0)).r;
  float south = texture2D(glyphs, textUv + vec2(0.0, tap.y)).r;
  float north = texture2D(glyphs, textUv - vec2(0.0, tap.y)).r;
  float distance = (mix(glyph.r, (east + west + south + north) * 0.25, 0.75) - 0.5) * 2.0 * distanceRange;
  // Screen-space outward direction, y up, so it shares a frame with the lamp.
  vec2 gradient = vec2(west - east, south - north);
  vec2 outward = mix((glyph.gb * 2.0 - 1.0) * vec2(1.0, -1.0), normalize(gradient + vec2(0.00001)), smoothstep(0.004, 0.02, length(gradient)));
  float bevel = clamp(fontSize * 0.03, 1.3, 2.8);
  float rise = clamp(distance / bevel, 0.0, 1.0);
  // A quarter-round edge: steep at the contour, flat across the face.
  float slope = (1.0 - rise) * (1.0 - rise) * 2.4;
  // Hand polishing leaves a face that is almost, not perfectly, flat: reflections waver slightly across it.
  vec2 polish = screen / fontSize;
  vec2 undulation = vec2(sin(polish.y * 2.7 + polish.x * 0.6), sin(polish.x * 2.1 - polish.y * 1.2)) * 0.03;
  vec3 normal = normalize(vec3(outward * slope + undulation * rise, 1.0));
  vec3 light = toLamp(screen);
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  float edge = 1.0 - rise;
  // A flat mirror shows the lamp directly beneath it, at a fixed size however high it hangs; tilting the
  // surface by an angle moves that image by twice the angle times the lamp's height.
  vec2 image = screen - lamp.xy + normal.xy * lamp.z * 2.0;
  float spot = exp(-dot(image, image) / pow(fontSize * 0.16, 2.0));
  // The glow around the lamp's image belongs to a lamp held close; resting high, it leaves the stone even.
  float held = smoothstep(fontSize * 4.6, fontSize * 3.4, lamp.z);
  float pool = exp(-dot(image, image) / pow(fontSize * 2.6, 2.0)) * held;
  // The bevel catches the lamp as one band where its curve turns toward it. Placing that band by distance
  // and weighting it by the edge's direction, not by the exact slope, keeps it even along a diagonal.
  float bevelLine = exp(-pow((edge - 0.75) / 0.28, 2.0)) * pow(max(dot(outward, normalize(halfway.xy + vec2(0.0001))), 0.0), 4.0);
  // Close to the lamp the bevels flare, so where it hangs reads at a glance.
  vec2 fromLamp = (screen - lamp.xy) / (fontSize * 2.4);
  float nearLamp = exp(-dot(fromLamp, fromLamp));
  bevelLine *= 0.2 + nearLamp * 1.4;
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
    // The face takes the lamp as a small spot below full white, so a letter never turns to chrome; the bevel's
    // line reaches the outermost pixel, so the rounded edge itself catches the light, not a ring inside it.
    float plain = (1.0 - edge) * (1.0 - edge);
    vec3 sheenTint = vec3(0.98, 0.86, 0.62);
    float hot = spot * 0.55 * plain * hold + bevelLine * 0.3 * smoothstep(-0.6, 0.4, distance);
    vec3 face = vec3(0.030, 0.029, 0.033);
    float fresnel = pow(view, 1.6);
    vec3 color = face;
    // Around the lamp's image the polished face mirrors the lit silk, warm rather than a gray haze.
    color += mix(surround, sheenTint, 0.6) * pow(pool, 4.0) * 0.06 * hold;
    color += surround * fresnel * mix(0.0, 0.5, toward * toward);
    // Head-on, the polished face is a dark mirror: a few percent of distant silk, softened and dimmed.
    vec3 mirrored = sceneAt(vec2(vUv.x + (vUv.x - 0.5) * 0.3, vUv.y + 0.22 + plane.y * 0.004) + normal.xy * 0.6);
    // Its contrast is kept and its average lowered, so the face reads as black glass holding a reflection
    // rather than as a brown tint.
    vec3 distant = mix(behind, mirrored, 0.7);
    distant = mix(vec3(dot(distant, vec3(0.2126, 0.7152, 0.0722))), distant, 0.2);
    color += distant * distant * distant * 0.035 * hold;
    // Thin edges facing away let a smoky brown through, the way obsidian does when held up to light.
    color += vec3(0.11, 0.06, 0.03) * fresnel * (1.0 - toward) * 0.1;
    color += vec3(1.0, 0.97, 0.92) * hot;
    color += vec3(0.95, 0.88, 0.74) * (sweep * sweep * 0.05 * hold + sweep * 0.16 * edge * toward);
    // A broad, barely-there softbox lies across the face. Like the other reflections it covers the bevel too, so the
    // face is never lighter than its edges and no dark rim reads as an outline.
    float softbox = exp(-pow((band - title.z / fontSize * 0.35) / 3.2, 2.0));
    color += vec3(0.86, 0.85, 0.83) * softbox * 0.01 * hold;
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
    // The body sits a step below white, leaving room for the sheen and highlights to rise above it.
    vec3 color = ink * vec3(0.9, 0.875, 0.83);
    color += refracted * refracted * edge * edge * 0.3;
    // Light pools in the stone's lower edges, which turn a little denser and milkier.
    color *= 1.0 - edge * smoothstep(0.2, 0.9, -outward.y) * 0.08;
    // Adularescence: a cool light floats under the surface where the lamp's angle catches it, brighter than the
    // body with a faint blue fringe, in broad clouds across the whole line rather than patches inside letters.
    vec2 drift = (screen - lamp.xy) / fontSize;
    float billow = 0.5 + 0.35 * sin(drift.x * 0.45 - drift.y * 0.3 + time * 0.16 + sin(drift.y * 0.6 + time * 0.11) * 1.4)
      + 0.15 * sin(drift.x * 0.9 + drift.y * 0.7 - time * 0.21);
    float sheen = smoothstep(0.35, 1.0, pow(halfway.z, 4.0) * billow);
    float fringe = sheen * (1.0 - sheen) * 4.0;
    color = mix(color, vec3(0.84, 0.88, 0.98), fringe * 0.14);
    // At rest the sheen is a soft hint, so the line reads as one stone; a lamp held close brings it out.
    color = mix(color, vec3(1.0, 1.01, 1.04), sheen * mix(0.45, 0.85, held));
    // Where the lamp hangs, the sheen gathers across a few letters into a cool glow, so a held lamp reads at once.
    color = mix(color, vec3(0.88, 0.92, 0.99), pool * 0.6 * (1.0 - edge * 0.5));
    color += vec3(1.0, 0.86, 0.62) * fresnel * toward * 0.24;
    color *= 1.0 - fresnel * (1.0 - toward) * 0.08;
    float plain = (1.0 - edge) * (1.0 - edge);
    float hot = ((spot * 0.6 + pool * 0.07) * plain + bevelLine * 0.2) * hold;
    color += vec3(1.0, 0.97, 0.9) * hot;
    color += vec3(1.0, 0.9, 0.7) * sweep * (0.03 + edge * toward * 0.12);
    // On a pale stone the intro glint reads as a wave of the cool sheen rather than more white.
    float wave = exp(-pow(glintAt / 0.9, 2.0)) * pass;
    color = mix(color, vec3(0.78, 0.85, 1.0), clamp(glinting * 0.6 + wave * 0.45, 0.0, 1.0) * hold);
    moonstone = color;
  }

  vec3 stone = mix(obsidian, moonstone, dark);
  vec3 color = mix(ink, clamp(stone, 0.0, 1.0), material);
  gl_FragColor = vec4(color, glyph.a);
}`
