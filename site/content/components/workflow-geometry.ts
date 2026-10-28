/**
 * The Workflow figures draw scopes as planes in one oblique projection, like a technical drawing:
 * x runs across, depth (y) recedes up and to the right, and height (z) rises straight up. Front
 * edges stay level, so rows of labels stay level too, and every plane reads as the same kind of thing.
 */
export const obliqueX = 0.5
export const obliqueY = 0.34

export type Point3 = readonly [x: number, y: number, z: number]
export type Point2 = readonly [x: number, y: number]

const round = (value: number) => Math.round(value * 1000) / 1000

export function project([x, y, z]: Point3): Point2 {
  return [round(x + obliqueX * y), round(-z - obliqueY * y)]
}

export function points(corners: readonly Point3[]) {
  return corners.map((corner) => project(corner).join(',')).join(' ')
}

export interface Slab {
  top: string
  front: string
  side: string
  /** The front edge of the top face, where the light catches it. */
  rim: string
  /** The left edge of the top face, which catches less of the same light. */
  flank: string
  /** The plate's footprint dropped below it, for a soft shadow. */
  shadow: string
}

/** A horizontal plate spanning x0..x1 and y0..y1 at height z, `depth` thick. */
export function slab(x0: number, x1: number, y0: number, y1: number, z: number, depth: number): Slab {
  return {
    top: points([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]),
    front: points([[x0, y0, z], [x1, y0, z], [x1, y0, z - depth], [x0, y0, z - depth]]),
    side: points([[x1, y0, z], [x1, y1, z], [x1, y1, z - depth], [x1, y0, z - depth]]),
    rim: points([[x0, y0, z], [x1, y0, z]]),
    flank: points([[x0, y0, z], [x0, y1, z]]),
    shadow: points([[x0 + 0.4, y0, z - depth - 0.9], [x1 - 0.4, y0, z - depth - 0.9], [x1 - 0.4, y1, z - depth - 0.9], [x0 + 0.4, y1, z - depth - 0.9]])
  }
}

export interface Bounds {
  minX: number
  minY: number
  width: number
  height: number
}

export function bounds(all: readonly Point2[], padding: readonly [top: number, right: number, bottom: number, left: number]): Bounds {
  const xs = all.map(([x]) => x)
  const ys = all.map(([, y]) => y)
  const minX = Math.min(...xs) - padding[3]
  const minY = Math.min(...ys) - padding[0]
  return {
    minX: round(minX),
    minY: round(minY),
    width: round(Math.max(...xs) + padding[1] - minX),
    height: round(Math.max(...ys) + padding[2] - minY)
  }
}

/** A projected point as left/top percentages of the stage. */
export function place([x, y]: Point2, box: Bounds) {
  return { left: `${round((x - box.minX) / box.width * 100)}%`, top: `${round((y - box.minY) / box.height * 100)}%` }
}

export function viewBox(box: Bounds) {
  return `${box.minX} ${box.minY} ${box.width} ${box.height}`
}
