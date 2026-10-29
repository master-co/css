import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTitleDistanceField } from './hero-title-mask'

function field(rows: string[], ratio = 1) {
  const width = rows[0].length
  const input = new Uint8ClampedArray(width * rows.length * 4)
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < width; x++) input[(y * width + x) * 4 + 3] = rows[y][x] === '#' ? 255 : 0
  }
  const pixels = createTitleDistanceField(input, width, rows.length, ratio, 8)
  return (x: number, y: number) => {
    const index = (y * width + x) * 4
    return { distance: (pixels[index] / 255 - 0.5) * 16, nx: pixels[index + 1] / 255 * 2 - 1, ny: pixels[index + 2] / 255 * 2 - 1, alpha: pixels[index + 3] }
  }
}

test('glass distances preserve counters and separate nearby letter strokes', () => {
  const at = field(['.......', '.#####.', '.#...#.', '.#...#.', '.#####.', '.......'])
  assert.ok(at(1, 2).distance > 0)
  assert.ok(at(3, 2).distance < 0)
  assert.equal(at(3, 2).alpha, 0)
  assert.equal(at(1, 2).alpha, 255)
  assert.ok(Math.abs(at(3, 2).distance + 1) < 0.07)
  const strokes = field(['.......', '.##.##.', '.##.##.', '.......'])
  assert.ok(strokes(3, 1).distance < 0)
})

test('surface normals point out of each side of a stroke', () => {
  const at = field(['.......', '..###..', '..###..', '..###..', '.......'])
  assert.ok(at(2, 2).nx < -0.9)
  assert.ok(at(4, 2).nx > 0.9)
  assert.ok(at(3, 1).ny < -0.9)
  assert.ok(at(3, 3).ny > 0.9)
})

test('distance units are CSS pixels regardless of device density', () => {
  const rows = ['.......', '..###..', '..###..', '..###..', '.......']
  const standard = field(rows)(3, 2).distance
  const dense = field(rows, 2)(3, 2).distance
  assert.ok(Math.abs(standard / 2 - dense) < 0.07)
})

test('empty glyph textures stay transparent with finite distance channels', () => {
  const at = field(['...', '...', '...'])
  assert.equal(at(1, 1).distance, -8)
  assert.equal(at(1, 1).alpha, 0)
  assert.ok(Math.abs(at(1, 1).nx) < 0.01)
  assert.ok(Math.abs(at(1, 1).ny) < 0.01)
})

test('the distance field retains antialiased glyph coverage', () => {
  const input = new Uint8ClampedArray(3 * 3 * 4)
  input[4 * 4 + 3] = 173
  const pixels = createTitleDistanceField(input, 3, 3, 1, 8)
  assert.equal(pixels[4 * 4 + 3], 173)
  assert.equal(pixels[3], 0)
})
