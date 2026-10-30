/** Site-only drawing geometry. Coordinates are CSS pixels; the renderer owns device density. */
export interface PalettePoint { x: number, y: number }

export interface PaletteSample {
  column: number
  row: number
  chroma: number
}

export interface PaletteCell {
  index: number
  top: PalettePoint[]
  left: PalettePoint[]
  front: PalettePoint[]
  center: PalettePoint
  lift: number
}

export interface PaletteGeometry {
  cells: PaletteCell[]
  floor: PalettePoint[]
  names: PalettePoint[]
  tiers: PalettePoint[]
  scale: number
  flat: number
  grid?: { left: number, top: number, stepX: number, stepY: number, columns: number, rows: number, indices: number[] }
}

export function paletteGeometry(width: number, height: number, flat: number, samples: readonly PaletteSample[], columns: number, rows: number, readoutInset = 76): PaletteGeometry {
  const narrow = width < 720
  const turn = (1 - flat) * -27 * Math.PI / 180
  const tilt = (1 - flat) * 54 * Math.PI / 180
  const cosTurn = Math.cos(turn), sinTurn = Math.sin(turn), cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt)
  const cellWidth = 44
  const availableWidth = Math.max(1, width - (narrow ? 54 : 100))
  const denseNames = !narrow && Math.min(availableWidth / columns, (height - 118) / (rows * 29) * cellWidth) < 46
  const nameLift = denseNames ? 14 : 0
  const topSpace = (narrow ? 28 : 44) + (denseNames ? 18 : 0)
  const availableHeight = Math.max(1, height - topSpace - Math.max(64, readoutInset))
  const flatScale = Math.min(availableWidth / (columns * cellWidth), 1.15)
  const narrowCellHeight = availableHeight / (rows * flatScale)
  const cellHeight = 29 + (narrow ? (narrowCellHeight - 29) * flat : 0)
  const gridWidth = cellWidth * columns, gridHeight = cellHeight * rows
  const project = (x: number, y: number, z = 0): PalettePoint => ({
    x: cosTurn * x - sinTurn * y,
    y: cosTilt * (sinTurn * x + cosTurn * y) - sinTilt * z
  })
  const floorCorners = [[-gridWidth / 2, -gridHeight / 2], [gridWidth / 2, -gridHeight / 2], [gridWidth / 2, gridHeight / 2], [-gridWidth / 2, gridHeight / 2]]
  const projected = floorCorners.map(([x, y]) => project(x, y))
  const peakY = samples.map((sample) => project((sample.column + .5) * cellWidth - gridWidth / 2, sample.row * cellHeight - gridHeight / 2, sample.chroma * 205 * (1 - flat)).y)
  const minX = Math.min(...projected.map((p) => p.x)), maxX = Math.max(...projected.map((p) => p.x))
  const minY = Math.min(...projected.map((p) => p.y), ...peakY), maxY = Math.max(...projected.map((p) => p.y))
  const scale = Math.min(availableWidth / (maxX - minX), availableHeight / (maxY - minY), 1.15)
  const point = (x: number, y: number, z = 0): PalettePoint => {
    const p = project(x, y, z)
    return { x: width / 2 + flat * 7 + p.x * scale, y: topSpace + availableHeight / 2 + (p.y - (minY + maxY) / 2) * scale }
  }
  const gapX = Math.max(3.5, 2.25 / scale)
  const gapY = Math.max(3.5, 2.25 / scale)
  const cells = samples.map((sample, index): PaletteCell => {
    const x = sample.column * cellWidth - gridWidth / 2, y = sample.row * cellHeight - gridHeight / 2
    const lift = sample.chroma * 205 * (1 - flat)
    const top = [point(x, y, lift), point(x + cellWidth - gapX, y, lift), point(x + cellWidth - gapX, y + cellHeight - gapY, lift), point(x, y + cellHeight - gapY, lift)]
    return {
      index, top, lift,
      left: [top[0], top[3], point(x, y + cellHeight - gapY), point(x, y)],
      front: [top[3], top[2], point(x + cellWidth - gapX, y + cellHeight - gapY), point(x, y + cellHeight - gapY)],
      center: point(x + (cellWidth - gapX) / 2, y + (cellHeight - gapY) / 2, lift)
    }
  }).sort((a, b) => (samples[a.index].row - samples[b.index].row) || (samples[b.index].column - samples[a.index].column))
  let grid: PaletteGeometry['grid']
  if (flat === 1) {
    const origin = point(-gridWidth / 2 - gapX / 2, -gridHeight / 2 - gapY / 2)
    const indices = Array.from({ length: columns * rows }, () => -1)
    samples.forEach((sample, index) => { indices[sample.row * columns + sample.column] = index })
    grid = { left: origin.x, top: origin.y, stepX: cellWidth * scale, stepY: cellHeight * scale, columns, rows, indices }
  }
  return {
    cells, flat, scale,
    grid,
    floor: floorCorners.map(([x, y]) => point(x + Math.sign(x) * 9, y + Math.sign(y) * 9)),
    names: Array.from({ length: columns }, (_, column) => {
      const label = point((column + .5) * cellWidth - gridWidth / 2, -gridHeight / 2 - 18)
      return { x: label.x, y: label.y - (column % 2) * nameLift }
    }),
    tiers: Array.from({ length: rows }, (_, row) => point(-gridWidth / 2 - 12, (row + .5) * cellHeight - gridHeight / 2))
  }
}

export function insidePaletteFace(point: PalettePoint, face: readonly PalettePoint[]) {
  return face.every((a, index) => {
    const b = face[(index + 1) % face.length]
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) >= -.01
  })
}

/** Painted front faces participate in hit testing, so a tall bar never feels hollow. */
export function paletteHit(geometry: PaletteGeometry, point: PalettePoint): number | undefined {
  if (geometry.grid) {
    const grid = geometry.grid
    const column = Math.floor((point.x - grid.left) / grid.stepX), row = Math.floor((point.y - grid.top) / grid.stepY)
    if (column < 0 || column >= grid.columns || row < 0 || row >= grid.rows) return
    const index = grid.indices[row * grid.columns + column]
    return index >= 0 ? index : undefined
  }
  for (let index = geometry.cells.length - 1; index >= 0; index--) {
    const cell = geometry.cells[index]
    if (insidePaletteFace(point, cell.top) || (cell.lift > .1 && (insidePaletteFace(point, cell.front) || insidePaletteFace(point, cell.left)))) return cell.index
  }
}
