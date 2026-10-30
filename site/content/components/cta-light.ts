export interface Lamp { x: number, y: number, z: number }
export interface Box { left: number, top: number, width: number, height: number }

export const ctaLitProperties = ['--lit-x', '--lit-y', '--lit-angle', '--cast-x', '--cast-y', '--lit-near'] as const

/** The largest backing store the field may use: at most 2× density and about two million pixels. */
export function backingDensity(width: number, height: number, ratio: number, budget = 2_000_000) {
  if (!(width > 0 && height > 0)) return 1
  return Math.max(0.5, Math.min(ratio || 1, 2, Math.sqrt(budget / (width * height))))
}

/**
 * A native control reads the lamp as a highlight position, a rim angle and a cast-shadow offset,
 * the same contract the hero hands its controls. Values are rounded to what the eye can tell apart,
 * so a moving lamp restyles a control only now and then.
 */
export function litValues(box: Box, lamp: Lamp, near = 1, { elevation = 6, text = false } = {}): string[] {
  const centerX = box.left + box.width / 2
  const centerY = box.top + box.height / 2
  const scale = elevation / Math.max(lamp.z - elevation, 1)
  const castX = Math.max(-10, Math.min(10, (centerX - lamp.x) * scale))
  const castY = Math.max(-10, Math.min(10, (centerY - lamp.y) * scale))
  // A control is near when the lamp is over it. A block of text is large, so closeness counts from its
  // edge over about one line, and the lamp has to come to the words themselves to light them fully.
  const outside = Math.hypot(Math.max(box.left - lamp.x, 0, lamp.x - box.left - box.width), Math.max(box.top - lamp.y, 0, lamp.y - box.top - box.height))
  const line = Math.max(48, box.height * 0.5)
  const closeness = text
    ? Math.exp(-(outside * outside) / (line * line))
    : Math.exp(-(((lamp.x - centerX) / (box.width * 0.9)) ** 2 + ((lamp.y - centerY) / (box.height * 2.4)) ** 2))
  return [
    `${Math.round(Math.max(-60, Math.min(160, (lamp.x - box.left) / box.width * 100)))}%`,
    `${Math.round(Math.max(-160, Math.min(260, (lamp.y - box.top) / box.height * 100)))}%`,
    `${Math.round(Math.atan2(lamp.x - centerX, centerY - lamp.y) * 180 / Math.PI)}deg`,
    `${castX.toFixed(1)}px`,
    `${castY.toFixed(1)}px`,
    (closeness * near).toFixed(2)
  ]
}
