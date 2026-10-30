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
uniform vec3 pointer;
uniform vec3 ring;
uniform vec3 shadow;
uniform vec3 body;
uniform vec3 sheen;
uniform vec3 ground;
uniform vec4 title;
uniform vec4 prose;
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

  // One loose sheet drifts through the title; its contour never traces the text rectangle.
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  float dark = 1.0 - smoothstep(0.25, 0.6, dot(ground, vec3(0.2126, 0.7152, 0.0722)));
  float x = vUv.x - 0.5;
  float crown = 1.0 - title.y / resolution.y + 0.1;
  float edge = crown - x * 0.38 + x * x * 1.05 + sin(x * 5.5 + 0.7) * 0.045 + h * 0.075;
  float alpha = (1.0 - smoothstep(edge - 0.28, edge + 0.075, vUv.y)) * intro;
  // The reading space bends with the sheet and opens toward the lower left, without a closed halo.
  vec2 proseDistance = (screen - prose.xy - prose.zw * 0.5) / max(prose.zw * vec2(0.58, 0.62) + fontSize * vec2(0.75, 0.95), vec2(1.0));
  proseDistance.x += proseDistance.y * 0.18 - 0.1 + max(proseDistance.y, 0.0) * 0.45;
  proseDistance.y /= 1.0 + max(proseDistance.y, 0.0) * 0.5;
  proseDistance.y += sin(proseDistance.x * 1.4 + 0.5) * 0.35 + h * 0.12;
  alpha *= mix(0.08, 1.0, smoothstep(0.62, 1.95, length(proseDistance)));
  alpha *= smoothstep(0.0, 0.18 + x * 0.1 + h * 0.025, vUv.y);
  alpha *= mix(1.0, mix(0.5, 0.3, dark), smoothstep(0.84, 1.0, vUv.y));
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
uniform float time;
uniform vec3 pointer;
uniform vec3 ring;
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
  float signedDistance = (glyph.r - 0.5) * 2.0 * distanceRange;
  // A hairline of ambient occlusion keeps white glass legible on the light canvas too.
  float contact = smoothstep(-1.5, 0.7, signedDistance);
  background *= 1.0 - contact * mix(0.5, 0.12, dark) * material;
  float shadowDistance = (texture2D(glyphs, textUv - vec2(0.0, 0.9) / title.zw).r - 0.5) * 2.0 * distanceRange;
  background *= 1.0 - smoothstep(-1.4, 0.8, shadowDistance) * mix(0.2, 0.1, dark) * material;
  if (glyph.a < 0.002) {
    gl_FragColor = vec4(background, 1.0);
    return;
  }
  float distance = max(0.0, signedDistance);
  float bevel = max(1.3, fontSize * 0.042);
  float shoulder = 1.0 - smoothstep(0.0, bevel, distance);
  vec2 outward = glyph.gb * 2.0 - 1.0;
  vec2 plane = (vUv - 0.5) * vec2(resolution.x / resolution.y, 1.0) * ${heroPlaneScale.toFixed(1)};
  float flow = sin(plane.x * 1.2 + plane.y * 1.8 - time * 0.35);
  vec2 liquid = vec2(sin(plane.y * 2.4 + time * 0.3), cos(plane.x * 1.8 - time * 0.25)) * 0.065;
  vec3 normal = normalize(vec3(outward * shoulder * 0.97 + liquid, sqrt(max(0.06, 1.0 - shoulder * shoulder * 0.94))));
  vec2 toPointer = pointer.xy - plane;
  float proximity = exp(-dot(toPointer, toPointer) * 1.4) * pointer.z;
  vec3 light = normalize(mix(vec3(-0.55, -0.7, 1.2), vec3(toPointer.x, -toPointer.y, 2.4), pointer.z * 0.7));
  vec3 halfLight = normalize(light + vec3(0.0, 0.0, 1.0));
  float highlight = pow(max(dot(normal, halfLight), 0.0), 38.0) * shoulder;
  float rim = pow(1.0 - normal.z, 2.0);
  float thickness = fontSize * 0.7 * (1.0 + proximity * 0.2) * material;
  vec2 offset = (vec2(normal.x, -normal.y) + liquid * 1.4) * thickness / resolution;
  // Nearby rays split just at the curved lip, making the bend visible without a colored outline.
  vec2 refractedUv = clamp(vUv + offset, vec2(0.0), vec2(1.0));
  vec3 transmitted = texture2D(scene, refractedUv).rgb;
  transmitted.r = texture2D(scene, clamp(vUv + offset * 1.018, vec2(0.0), vec2(1.0))).r;
  transmitted.b = texture2D(scene, clamp(vUv + offset * 0.982, vec2(0.0), vec2(1.0))).b;
  float luminance = dot(transmitted, vec3(0.2126, 0.7152, 0.0722));
  transmitted = mix(vec3(luminance), transmitted, 0.32);
  float windowPosition = (screen.x - title.x + (screen.y - title.y) * 0.38) / fontSize + flow * 0.18;
  float windowSpan = (title.z + title.w * 0.38) / fontSize + 6.0;
  float windowCenter = fract(time * 0.055) * windowSpan - 3.0 + pointer.x * pointer.z * 0.5;
  float windowDistance = windowPosition - windowCenter;
  float windowLight = exp(-pow(windowDistance / 1.35, 2.0));
  float windowEdge = exp(-pow((windowDistance + 0.72) / 0.16, 2.0));
  float windowShade = exp(-pow((windowDistance - 1.0) / 0.72, 2.0));
  // A white veil and bright rim keep the type luminous; the body now reveals the moving scene.
  float transmission = mix(0.12, 0.08, dark) + shoulder * 0.2 + windowShade * 0.4 + proximity * 0.28;
  vec3 glass = mix(vec3(0.98), transmitted, transmission);
  glass += vec3(windowLight * 0.14 + windowEdge * 0.22 + proximity * 0.04);
  float focalRim = exp(-pow((length(toPointer) - 0.48) / 0.13, 2.0)) * pointer.z;
  glass += vec3(focalRim * 0.12);
  float edgeLight = dot(normal.xy, normalize(light.xy));
  vec3 reflection = mix(vec3(mix(0.64, 0.82, dark)), vec3(1.0), smoothstep(-0.65, 0.7, edgeLight));
  glass = mix(glass, reflection, rim * 0.55);
  glass += vec3(highlight * 0.5);
  float lip = 1.0 - smoothstep(0.2, 0.95, distance);
  glass = mix(glass, reflection, lip * 0.6);
  // A fine lower contact edge suggests thickness without moving or distorting the letter's outline.
  glass *= 1.0 - shoulder * max(normal.y, 0.0) * mix(0.16, 0.06, dark);
  // A tap catches the same expanding wave in the silk and in each letter's polished edge.
  if (ring.z >= 0.0) {
    float front = length(plane - ring.xy) - ring.z * 2.2;
    float caustic = exp(-front * front * 65.0) * max(0.0, 1.0 - ring.z / 2.4);
    glass = mix(glass, vec3(1.0), caustic * (0.12 + shoulder * 0.5));
  }
  vec3 color = mix(ink, clamp(glass, 0.0, 1.0), material);
  gl_FragColor = vec4(mix(background, color, glyph.a), 1.0);
}`
