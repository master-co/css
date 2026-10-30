import assert from 'node:assert/strict'
import { test } from 'node:test'
import { insidePaletteFace, paletteGeometry, paletteHit } from './palette-geometry'

const columns = 23, rows = 13
const samples = Array.from({ length: columns * rows }, (_, index) => ({
  column: index % columns,
  row: Math.floor(index / columns),
  chroma: .3 * Math.sin(index % columns / columns * Math.PI) * Math.sin(Math.floor(index / columns) / rows * Math.PI)
}))

for (const width of [230, 280, 326, 704, 1180, 1600]) {
  for (const flat of [0, .15, .5, .85, 1]) {
    test(`the ${width}px palette at projection ${flat} keeps every color on the artboard`, () => {
      const height = width < 720 ? 304 : 512
      const geometry = paletteGeometry(width, height, flat, samples, columns, rows)
      assert.equal(geometry.cells.length, columns * rows)
      for (const cell of geometry.cells) {
        for (const point of [...cell.top, ...cell.front, ...cell.left]) {
          assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y))
          assert.ok(point.x >= 0 && point.x <= width, `${cell.index}: x ${point.x}`)
          assert.ok(point.y >= 0 && point.y <= height, `${cell.index}: y ${point.y}`)
        }
      }
      assert.ok(geometry.scale > 0)
    })
  }
}

test('the resting sculpture keeps its entire floor plate inside the viewport', () => {
  for (const [width, height] of [[920, 384], [1180, 512], [1600, 560]]) {
    const raised = paletteGeometry(width, height, 0, samples, columns, rows)
    assert.ok(raised.floor.every(p => p.x > 0 && p.x < width && p.y > 0 && p.y < height))
  }
})

test('every flat swatch can be selected at its center across phone and desktop sizes', () => {
  for (const width of [230, 326, 704, 1180, 1600]) {
    const geometry = paletteGeometry(width, width < 720 ? 304 : 512, 1, samples, columns, rows)
    for (const cell of geometry.cells) assert.equal(paletteHit(geometry, cell.center), cell.index, `width ${width}, cell ${cell.index}`)
    assert.equal(paletteHit(geometry, { x: 0, y: 0 }), undefined)
  }
})

test('the exposed front and left faces of a tall bar select that bar', () => {
  const geometry = paletteGeometry(400, 300, 0, [{ column: 0, row: 0, chroma: .3 }], 1, 1)
  const cell = geometry.cells[0]
  const center = (points: typeof cell.front) => ({ x: points.reduce((sum, p) => sum + p.x, 0) / 4, y: points.reduce((sum, p) => sum + p.y, 0) / 4 })
  assert.equal(paletteHit(geometry, center(cell.front)), 0)
  assert.equal(paletteHit(geometry, center(cell.left)), 0)
  assert.ok(insidePaletteFace(cell.center, cell.top))
})

test('small gutters belong to their nearest swatch instead of clearing the selection', () => {
  const geometry = paletteGeometry(326, 304, 1, samples, columns, rows)
  const first = geometry.cells.find(cell => cell.index === 0)!
  const second = geometry.cells.find(cell => cell.index === 1)!
  const gap = second.top[0].x - first.top[1].x
  assert.equal(paletteHit(geometry, { x: first.top[1].x + gap * .25, y: first.center.y }), 0)
  assert.equal(paletteHit(geometry, { x: first.top[1].x + gap * .75, y: first.center.y }), 1)
  assert.equal(paletteHit(geometry, { x: first.center.x, y: first.top[0].y - 10 }), undefined)
})

test('long family names use separate tracks when the compact desktop grid would overlap them', () => {
  const geometry = paletteGeometry(920, 384, 1, samples, columns, rows)
  assert.ok(Math.abs(geometry.names[0].y - geometry.names[1].y) >= 12)
  const wide = paletteGeometry(1340, 560, 1, samples, columns, rows)
  assert.equal(wide.names[0].y, wide.names[1].y)
})

test('the field keeps normal color order regardless of its painter order', () => {
  const geometry = paletteGeometry(1180, 512, 0, samples, columns, rows)
  const indices = geometry.cells.map((cell) => cell.index)
  assert.equal(new Set(indices).size, samples.length)
  assert.ok(indices.indexOf(columns - 1) < indices.indexOf(0), 'the back-right bars paint before their left neighbors')
  assert.ok(indices.indexOf(0) < indices.indexOf(columns * (rows - 1)), 'the nearest row paints last')
})
