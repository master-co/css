import type { PaletteCell, PaletteGeometry, PalettePoint } from './palette-geometry'

export interface PaletteColor {
  token: string
  name: string
  tier: string
  value: string
  chroma: number
  column: number
  row: number
}

export interface PalettePaints {
  ground: string
  sheet: string
  ink: string
  muted: string
  line: string
  signal: string
  inverse: string
  font: string
}

/** Rounded projected corners keep the tiles precise at small sizes and soft at retina density. */
export function palettePath(points: readonly PalettePoint[], radius = 0) {
  const path = new Path2D()
  if (!radius) {
    path.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) path.lineTo(point.x, point.y)
  } else {
    for (let index = 0; index < points.length; index++) {
      const prev = points[(index + points.length - 1) % points.length], p = points[index], next = points[(index + 1) % points.length]
      const before = Math.min(.22, radius / Math.hypot(p.x - prev.x, p.y - prev.y))
      const after = Math.min(.22, radius / Math.hypot(next.x - p.x, next.y - p.y))
      const x = p.x + (prev.x - p.x) * before, y = p.y + (prev.y - p.y) * before
      if (index === 0) path.moveTo(x, y)
      else path.lineTo(x, y)
      path.quadraticCurveTo(p.x, p.y, p.x + (next.x - p.x) * after, p.y + (next.y - p.y) * after)
    }
  }
  path.closePath()
  return path
}

function strokeLine(ctx: CanvasRenderingContext2D, points: readonly PalettePoint[]) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  ctx.stroke()
}

/** The complete field is cached between projection, theme and size changes. */
export function paintPaletteField(ctx: CanvasRenderingContext2D, width: number, height: number, geometry: PaletteGeometry, colors: readonly PaletteColor[], paints: PalettePaints, names: readonly string[], tiers: readonly string[]) {
  ctx.fillStyle = paints.ground
  ctx.fillRect(0, 0, width, height)
  const depth = 1 - geometry.flat
  if (depth > .001) {
    const floor = palettePath(geometry.floor, 6)
    ctx.save()
    ctx.shadowColor = 'rgb(0 0 0 / .10)'
    ctx.shadowBlur = 18 * depth
    ctx.shadowOffsetY = 8 * depth
    ctx.fillStyle = paints.sheet
    ctx.fill(floor)
    ctx.restore()
    ctx.strokeStyle = paints.line
    ctx.lineWidth = .75
    ctx.stroke(floor)
    // Sparse registration marks locate the plate without a second patterned surface.
    ctx.strokeStyle = paints.muted
    ctx.globalAlpha = .35 * depth
    for (const corner of geometry.floor) {
      strokeLine(ctx, [{ x: corner.x - 4, y: corner.y + 9 }, { x: corner.x - 4, y: corner.y + 13 }, { x: corner.x, y: corner.y + 13 }])
    }
    ctx.globalAlpha = 1
  }
  for (const cell of geometry.cells) {
    const color = colors[cell.index]
    const value = color.value
    if (cell.lift > .1) {
      for (const [face, shade] of [[cell.left, .3], [cell.front, .17]] as const) {
        const path = palettePath(face)
        ctx.fillStyle = value
        ctx.fill(path)
        const upper = Math.min(...face.map((p) => p.y)), lower = Math.max(...face.map((p) => p.y))
        const gradient = ctx.createLinearGradient(0, upper, 0, Math.max(upper + 1, lower))
        gradient.addColorStop(0, `rgb(0 0 0 / ${shade * .65})`)
        gradient.addColorStop(1, `rgb(0 0 0 / ${shade})`)
        ctx.fillStyle = gradient
        ctx.fill(path)
      }
    }
    const top = palettePath(cell.top, Math.min(2.4, geometry.scale * 2))
    ctx.fillStyle = value
    ctx.fill(top)
    ctx.strokeStyle = geometry.flat > .98 ? paints.line : 'rgb(0 0 0 / .08)'
    ctx.lineWidth = .55
    ctx.stroke(top)
    if (depth > .01) {
      ctx.strokeStyle = `rgb(255 255 255 / ${.28 * depth})`
      ctx.lineWidth = .6
      strokeLine(ctx, [cell.top[0], cell.top[1]])
    }
  }
  if (geometry.flat > .82) {
    ctx.globalAlpha = (geometry.flat - .82) / .18
    ctx.fillStyle = paints.muted
    ctx.font = `${width < 720 ? 9 : 10}px ${paints.font}`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let row = 0; row < tiers.length; row++) ctx.fillText(tiers[row], geometry.tiers[row].x, geometry.tiers[row].y)
    if (width >= 720) {
      ctx.textAlign = 'center'
      for (let col = 0; col < names.length; col++) ctx.fillText(names[col], geometry.names[col].x, geometry.names[col].y - 2)
    }
    ctx.globalAlpha = 1
  }
}

/** Selection is a small, separate pass over the cached field, keeping pointer exploration inexpensive. */
export function paintPaletteSelection(ctx: CanvasRenderingContext2D, width: number, geometry: PaletteGeometry, cell: PaletteCell, color: PaletteColor, paints: PalettePaints) {
  const shape = palettePath(cell.top, Math.min(2.4, geometry.scale * 2))
  ctx.lineJoin = 'round'
  ctx.strokeStyle = paints.ground
  ctx.lineWidth = 4
  ctx.stroke(shape)
  ctx.strokeStyle = paints.signal
  ctx.lineWidth = 1.5
  ctx.stroke(shape)
  if (geometry.flat > .98) {
    ctx.fillStyle = paints.ink
    ctx.font = `10px ${paints.font}`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const tier = geometry.tiers[color.row]
    ctx.fillText(color.tier, tier.x, tier.y)
    if (width >= 720) {
      ctx.textAlign = 'center'
      const name = geometry.names[color.column]
      ctx.fillText(color.name, name.x, name.y - 2)
    }
  }
  // One screen-facing tag, with a leader that never cuts through a color's center.
  ctx.font = `11px ${paints.font}`
  const tagWidth = ctx.measureText(color.token).width + 18
  const x = Math.max(10, Math.min(width - tagWidth - 10, cell.center.x - tagWidth / 2))
  const above = Math.min(...cell.top.map((p) => p.y)) - 34
  const axisBottom = geometry.flat > .98 ? Math.max(...geometry.names.map(point => point.y)) + 12 : 4
  const y = above < axisBottom ? Math.max(...cell.top.map((p) => p.y)) + 8 : Math.max(4, above)
  ctx.fillStyle = paints.ink
  ctx.beginPath()
  ctx.roundRect(x, y, tagWidth, 24, 5)
  ctx.fill()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = paints.inverse
  ctx.fillText(color.token, x + 9, y + 12)
}
