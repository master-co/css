export { heroVertexSource as ctaVertexSource } from './hero-shaders'

export const ctaRippleCount = 3

/**
 * The closing silk: one gold point lifts a sheet whose warp threads fan out into radial folds.
 * Every pixel is mapped back to its thread (lane `u` across, depth `s` down), so threads stay one
 * device pixel crisp at any density and merge into the woven sheet where they crowd together.
 * Coordinates are CSS pixels with y down; z points toward the viewer.
 */
export const ctaSilkSource = `
precision highp float;
varying vec2 vUv;
uniform vec2 resolution;
uniform float density;
uniform vec2 origin;
uniform vec2 extent;
uniform float lanes;
uniform float reveal;
uniform vec3 lamp;
uniform float carried;
uniform vec4 ripples[${ctaRippleCount}];
uniform float rippling;
uniform vec3 shadow;
uniform vec3 body;
uniform vec3 sheen;
uniform float dark;

const float PI = 3.14159265;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}

// The sheet opens fast below the point and hangs nearly straight toward the hem.
float spreadAt(float s) {
  s = clamp(s, 0.0, 1.0);
  // Just below the point the warp is drawn into a short, taut neck before the cloth opens.
  return (1.0 - pow(1.0 - s, 2.1)) * mix(0.05, 1.0, smoothstep(0.025, 0.2, s));
}

// Smooth value noise along the warp, so neighbouring threads share a luster, as bundles of silk do.
float bundle(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

// Radial folds deepen from the lifted point toward the hem; their spacing is uneven, like real cloth.
float foldAt(float u) {
  return sin(u * 5.2 * PI + sin(u * 2.3 + 0.4) * 1.7) * 0.7 + sin(u * 11.0 * PI + 1.3) * 0.18;
}

// The neck keeps a few pixels of gathered warp under the bead, however small the sheet is drawn.
float neckAt(float s) {
  return 1.6 * (1.0 - smoothstep(0.0, 0.18, s));
}

vec3 restAt(float u, float s) {
  float w = extent.x * spreadAt(s) + neckAt(s);
  float depth = extent.x * 0.05 * smoothstep(0.0, 0.9, s);
  float z = foldAt(u) * depth;
  // Folds also gather the cloth sideways a little, so crests lean into their valleys.
  float x = origin.x + w * u + cos(u * 5.2 * PI) * depth * 0.18;
  return vec3(x, origin.y + s * extent.y, z);
}

// One tap's wave at a point on the sheet: a ring that travels outward, thins and fades.
float crestAt(vec2 at, vec4 r) {
  float crest = length(at - r.xy) - r.z * 560.0;
  return exp(-crest * crest / 2200.0) * pow(1.0 - r.z, 2.0) * r.w;
}

vec3 positionAt(float u, float s) {
  vec3 p = restAt(u, s);
  if (rippling < 0.5) return p;
  // A tap sends one wave through the warp: threads swing sideways and their folds lift as it passes.
  float hold = smoothstep(0.0, 0.25, s);
  vec2 at = p.xy;
  for (int i = 0; i < ${ctaRippleCount}; i++) {
    vec4 r = ripples[i];
    if (r.w <= 0.0) continue;
    float wave = crestAt(at, r);
    float crest = length(at - r.xy) - r.z * 560.0;
    p.x += sin(crest * 0.06) * wave * 5.5 * hold;
    p.z += wave * 22.0 * hold;
  }
  return p;
}

float waveLight(vec2 at) {
  if (rippling < 0.5) return 0.0;
  float light = 0.0;
  for (int i = 0; i < ${ctaRippleCount}; i++) {
    vec4 r = ripples[i];
    if (r.w > 0.0) light += crestAt(at, r);
  }
  return min(light, 1.0);
}

void main() {
  vec2 screen = vec2(vUv.x, 1.0 - vUv.y) * resolution;
  float s = (screen.y - origin.y) / extent.y;
  vec3 color = vec3(0.0);
  float alpha = 0.0;
  // The bead and its thread are there before the sheet unfurls, so the field waits on a single point.
  float opened = 1.0;

  if (s > 0.0) {
    // Invert the drape: find the lane whose thread passes through this pixel.
    float w = max(extent.x * spreadAt(s) + neckAt(s), 0.001);
    float u = (screen.x - origin.x) / w;
    float depth = extent.x * 0.05 * smoothstep(0.0, 0.9, s);
    for (int i = 0; i < 2; i++) {
      // The fold's sideways gather is the only nonlinear term, so its slope is known exactly.
      float dxdu = w - sin(u * 5.2 * PI) * 5.2 * PI * depth * 0.18;
      u -= (positionAt(u, s).x - screen.x) / max(dxdu, w * 0.2);
    }
    float e = 0.0015;
    vec3 p = positionAt(u, s);
    vec3 du = (positionAt(u + e, s) - positionAt(u - e, s)) / (2.0 * e);
    vec3 ds = (positionAt(u, s + e) - positionAt(u, max(s - e, 0.0))) / (s > e ? 2.0 * e : e + s);
    vec3 normal = normalize(cross(du, ds));
    normal *= sign(normal.z + 0.0001);
    // Lifted at one point, the sheet is a shallow tent: it slopes toward the viewer away from the point,
    // so its faces turn up and outward and the sheen follows the lamp across them.
    vec2 fromApex = p.xy - origin;
    vec2 slope = fromApex / max(length(fromApex), 1.0) * 0.38 * smoothstep(0.0, 0.1, s);
    normal = normalize(normal + vec3(-slope.x, -slope.y, 0.0) * normal.z);
    vec3 along = normalize(ds);
    vec3 across = normalize(cross(normal, along));

    vec3 toLamp = normalize(lamp - p);
    vec3 halfway = normalize(toLamp + vec3(0.0, 0.0, 1.0));
    float facing = max(dot(normal, halfway), 0.001);
    float diffuse = max(dot(normal, toLamp), 0.0);
    // Satin: the highlight stretches along each thread and stays narrow across it. A broader, softer lobe
    // of the same sheen lies one or two folds wide, and travels with the lamp across the bell.
    float ta = dot(halfway, along) / 0.62;
    float tb = dot(halfway, across) / 0.15;
    float satin = exp(-(ta * ta + tb * tb) / (facing * facing));
    float wa = dot(halfway, along) / 1.1;
    float wb = dot(halfway, across) / 0.4;
    float broad = exp(-(wa * wa + wb * wb) / (facing * facing));
    // Each filament catches a fine glint where it turns square to the light.
    float filament = pow(sqrt(max(1.0 - pow(dot(along, halfway), 2.0), 0.0)), 90.0);
    // A carried lamp lights a wide, soft pool wherever it crosses the sheet.
    vec2 toPool = (p.xy - lamp.xy) / (lamp.z * 0.95);
    float pool = exp(-dot(toPool, toPool)) * carried;
    // Folds hold their valleys in a little shade whatever the lamp does, so the drape keeps its relief.
    float valley = smoothstep(0.25, -0.75, foldAt(u)) * smoothstep(0.04, 0.45, s);

    // Lanes: q runs 0..lanes across the sheet; thread centers sit at half steps.
    float q = (u * 0.5 + 0.5) * lanes;
    float lane = floor(q);
    float character = hash(lane + 1.0);
    // Bundles of a few threads share a luster that drifts slowly along their length.
    float luster = bundle(q / 5.0 + 3.0) * 0.6 + 0.4 * (0.5 + 0.5 * sin(s * 7.0 + bundle(q / 11.0) * 6.28));
    float spacing = abs(du.x * ds.y - du.y * ds.x) / max(length(ds.xy), 0.001) * 2.0 / lanes;
    float spacingDevice = spacing * density;
    float offset = abs(fract(q) - 0.5) * spacingDevice;
    float thread = mix(0.55, 0.85, character) * density;
    float drawn = max(thread, 1.0);
    float line = clamp(drawn * 0.5 + 0.5 - offset, 0.0, 1.0) * thread / drawn;
    // Where threads crowd closer than a few device pixels they read as woven cloth, not moire.
    float woven = clamp(thread / max(spacingDevice, 0.001), 0.0, mix(0.55, 0.75, dark));
    line = mix(woven, line, smoothstep(2.2, 4.5, spacingDevice));

    float edge = 1.0 - smoothstep(0.72, 1.0, abs(u));
    // The hem follows an ellipse around the point: the middle hangs lowest and the sides let go earlier,
    // and each thread ends at its own length, so the sheet frays into the ground instead of meeting a line.
    float reach = min(mix(0.94, 0.64, u * u) + p.z / extent.x * 1.5, 0.96);
    // Every thread ends inside the canvas, so none meets its edge.
    float frayed = min(reach + (character - 0.5) * 0.16 * smoothstep(0.0, 0.5, abs(u) + 0.2), 0.98);
    float hem = 1.0 - smoothstep(reach - 0.38, reach, s);
    float threadHem = 1.0 - smoothstep(frayed - 0.3, frayed, s);
    float sides = smoothstep(0.0, 0.12, screen.x / resolution.x) * smoothstep(0.0, 0.12, 1.0 - screen.x / resolution.x);
    // The sheet unfurls downward from the point, its middle a little ahead of its edges.
    float front = reveal * 1.25 - abs(u) * 0.25;
    float unfurled = 1.0 - smoothstep(front - 0.12, front, s);
    float mask = edge * hem * sides * unfurled * step(abs(u), 1.0);
    float threadMask = edge * threadHem * sides * unfurled * step(abs(u), 1.0);

    // Under a carried lamp the light rakes: crests facing it brighten and valleys fall deeper, so the folds stand up.
    float raked = mix(smoothstep(-0.1, 1.0, diffuse), smoothstep(0.35, 1.0, diffuse), pool * 0.8);
    float light = raked * (1.0 - valley * (0.45 + pool * 0.3));
    vec3 cloth = mix(shadow, body, light);
    // The passing crest catches the light, so a tap reads on a phone without a lamp in hand.
    float swell = waveLight(p.xy) * smoothstep(0.0, 0.2, s);
    float shine = clamp(satin * 0.8 + broad * mix(0.55, 0.5, dark) + pool * (0.38 + satin * 0.5 + broad * 0.3) + swell * 0.55, 0.0, 1.0);
    cloth = mix(cloth, sheen, shine);
    // On a dark ground each filament is a line of light; on a light ground it is a fine line of gold on paler cloth.
    vec3 strand = mix(mix(shadow, body, light * 0.7 + shine * 0.5), cloth, dark);
    strand = mix(strand, sheen, clamp(filament * 0.35 * (0.6 + character * 0.6), 0.0, 1.0) * dark);
    strand *= 0.88 + character * 0.12 + (luster - 0.5) * mix(0.16, 0.5, dark);

    // The cloth itself is sheer: denser near the point, opening into its threads toward the hem.
    float sheer = mix(0.4, 0.17, dark) * (1.0 - smoothstep(0.05, 0.95, s)) + mix(0.06, 0.05, dark);
    // On a light ground the valleys gather more gold and the sheen reads as a paler, glossier band.
    sheer *= mix(0.42 + valley * 0.65 + (1.0 - light) * 0.3 + shine * 0.45 + pool * 0.45, (0.5 + shine * 1.1) * (1.0 - valley * 0.5), dark);
    float strandAlpha = line * mix(0.56 * (0.8 + light * 0.2 + valley * 0.25), 0.5 * (0.5 + light * 0.25 + shine * 0.9 + pool * 0.35) * (1.0 - valley * 0.35), dark);
    strandAlpha *= (1.0 + swell * 0.6 + pool * mix(0.25, 0.45, dark)) * mix(mix(0.8, 0.6, dark), mix(1.15, 1.3, dark), luster);
    // Gathered under the bead, the neck is drawn taut and solid.
    float neck = 1.0 - smoothstep(0.0, 0.07, s);
    strandAlpha = mix(strandAlpha, 0.85, neck * smoothstep(1.0, 0.6, abs(u)));
    float sheetAlpha = clamp(sheer, 0.0, 1.0) * mask;
    strandAlpha = clamp(strandAlpha, 0.0, 1.0) * threadMask;
    color = cloth * sheetAlpha;
    alpha = sheetAlpha;
    color = strand * strandAlpha + color * (1.0 - strandAlpha);
    alpha = strandAlpha + alpha * (1.0 - strandAlpha);
  }

  // One fine string holds the point up, fading into the space above it.
  float above = origin.y - screen.y;
  float string = clamp(0.5 + 0.35 * density - abs(screen.x - origin.x) * density, 0.0, 1.0) * min(0.6 * density, 1.0);
  string *= smoothstep(24.0, 2.0, above) * step(0.0, above) * mix(0.55, 0.7, dark) * smoothstep(0.0, 0.3, reveal);
  color = mix(shadow, sheen, dark * 0.6 + 0.2) * string + color * (1.0 - string);
  alpha = string + alpha * (1.0 - string);

  // The point: a small gold bead where the warp is gathered, lit by the lamp, on a faint glow of its own light.
  vec2 bead = screen - origin;
  float radius = 2.7;
  float d = length(bead);
  float contact = exp(-d * d / 160.0) * mix(0.18, 0.3, dark) * opened;
  color = mix(body, sheen, dark) * contact + color * (1.0 - contact);
  alpha = contact + alpha * (1.0 - contact);
  float cover = clamp((radius - d) * density + 0.5, 0.0, 1.0) * opened;
  if (cover > 0.0) {
    vec3 n = normalize(vec3(bead / radius, sqrt(max(1.0 - dot(bead, bead) / (radius * radius), 0.0))));
    vec3 l = normalize(lamp - vec3(origin, 0.0));
    float lit = max(dot(n, l), 0.0);
    float glint = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 60.0);
    vec3 gem = mix(shadow * mix(0.8, 1.0, dark), body, lit);
    gem = mix(gem, sheen, clamp(glint * 1.3 + dark * 0.4, 0.0, 1.0));
    color = gem * cover + color * (1.0 - cover);
    alpha = cover + alpha * (1.0 - cover);
  }
  gl_FragColor = vec4(color, alpha);
}`
