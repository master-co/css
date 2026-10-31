import assert from 'node:assert/strict'
import { test } from 'node:test'
import snapshot from '../../.generated/benchmarks/docs-page-css-size.json'
import {
  backingDensity, barRect, benchmarkCurve, benchmarkMotion, createBenchmarkAxis, cubicBezier, easedProgress,
  formatKilobytes, introSeconds, readoutShift, satinCenter, snap, toPercent, withAlpha
} from './benchmark-size-canvas'

test('the bars\' curve starts and ends exactly and never runs backwards', () => {
  assert.equal(cubicBezier(benchmarkCurve, 0), 0)
  assert.equal(cubicBezier(benchmarkCurve, 1), 1)
  let previous = 0
  for (let x = 0.01; x < 1; x += 0.01) {
    const y = cubicBezier(benchmarkCurve, x)
    assert.ok(y >= previous, `monotonic at ${x}`)
    previous = y
  }
  // An ease-out: most of the distance is covered early.
  assert.ok(cubicBezier(benchmarkCurve, 0.25) > 0.6)
})

test('a row waits for its delay, then lands at the end of its duration', () => {
  assert.equal(easedProgress(50, 100, 1000), 0)
  assert.equal(easedProgress(1100, 100, 1000), 1)
  assert.equal(easedProgress(5000, 100, 1000), 1)
  assert.equal(easedProgress(0, 0, 0), 1)
  const middle = easedProgress(600, 100, 1000)
  assert.ok(middle > 0.5 && middle < 1)
})

test('the intro leaves the last row time for its ratio inside three seconds', () => {
  const rows = snapshot.pages.length
  const { rowDelay, ratioFade } = benchmarkMotion
  assert.ok(introSeconds(rows) + (rows - 1) * rowDelay + ratioFade <= benchmarkMotion.introSeconds + 1e-9)
  assert.equal(introSeconds(40), 1.2)
})

test('the axis uses round steps, leaves headroom and carries the unit once', () => {
  for (const kind of ['brotliBytes', 'rawBytes'] as const) {
    const maxBytes = Math.max(...snapshot.pages.map((page) => page.css.total[kind]))
    for (const headroom of [1.1, 1.2, 1.45, 2.1]) {
      const axis = createBenchmarkAxis(maxBytes, headroom)
      assert.ok(axis.maxBytes >= maxBytes * headroom, `${kind} ${headroom}: room past the longest bar`)
      assert.ok(axis.ticks.length >= 3 && axis.ticks.length <= 9)
      assert.equal(axis.ticks[0].percent, 0)
      assert.equal(axis.ticks.at(-1)!.percent, 100)
      assert.ok(axis.ticks.at(-1)!.label.endsWith(' kB'))
      assert.equal(axis.ticks.filter((tick) => tick.label.includes('kB')).length, 1)
    }
  }
  assert.deepEqual(createBenchmarkAxis(60_581, 1.2).ticks.map((tick) => tick.label), ['0', '20', '40', '60', '80 kB'])
})

test('sizes read as kilobytes to one decimal', () => {
  assert.equal(formatKilobytes(6052), '6.1 kB')
  assert.equal(formatKilobytes(63_000), '63 kB')
  assert.equal(formatKilobytes(698_368), '698.4 kB')
  assert.equal(toPercent(50, 0), 0)
  assert.equal(toPercent(150, 100), 100)
})

test('the satin crosses the ribbon once per run and is gone at rest', () => {
  assert.equal(satinCenter(100, 200, 1200), undefined)
  assert.equal(satinCenter(1200, 200, 1200), undefined)
  assert.equal(satinCenter(5000, 200, 1200), undefined)
  assert.equal(satinCenter(200, 200, 1200), -0.5)
  assert.ok(Math.abs(satinCenter(700, 200, 1200)! - 0.5) < 1e-6)
  assert.ok(satinCenter(1199, 200, 1200)! > 1.4)
  assert.equal(satinCenter(10, 20, 20), undefined)
})

test('a readout rides its bar but stays inside the plot', () => {
  assert.equal(readoutShift(300, 300, 1000, 120), 0)
  assert.equal(readoutShift(400, 300, 1000, 120), 100)
  assert.equal(readoutShift(950, 300, 1000, 120), 580)
  // A settled readout already past the clamp goes no further, and a growing bar leads its readout from behind.
  assert.equal(readoutShift(950, 900, 1000, 120), 0)
  assert.equal(readoutShift(800, 900, 1000, 120), -100)
})

test('the canvas stays within 2x density and its pixel budget', () => {
  assert.equal(backingDensity(350, 780, 3), 2)
  assert.equal(backingDensity(1200, 640, 1), 1)
  for (const [width, height, ratio] of [[1200, 640, 2], [2400, 700, 2], [3600, 900, 3]]) {
    const density = backingDensity(width, height, ratio)
    assert.ok(density <= 2 && density >= 1)
    assert.ok(density === 1 || width * density * height * density <= 3_200_001)
  }
  assert.equal(backingDensity(0, 100, 2), 1)
})

test('bars keep a square zero edge on whole device pixels', () => {
  const rect = barRect({ name: 'React', signal: false, x: 0.3, y: 50.2, width: 1000, percent: 25 }, 20, 2)
  assert.equal(rect.x, 0.5)
  assert.equal(rect.y * 2 % 1, 0)
  assert.equal(rect.height, 20)
  assert.equal(rect.width, 250)
  assert.equal(barRect({ name: 'React', signal: false, x: 0, y: 0, width: 1000, percent: 0 }, 20, 2).width, 0.5)
  assert.equal(snap(10.26, 2), 10.5)
})

test('paints fade without changing their color space', () => {
  assert.equal(withAlpha('rgb(20, 158, 202)', 0), 'rgba(20, 158, 202, 0)')
  assert.equal(withAlpha('rgba(0, 0, 0, 0.5)', 0.5), 'rgba(0, 0, 0, 0.25)')
  assert.equal(withAlpha('rgb(1 2 3 / 50%)', 1), 'rgba(1, 2, 3, 0.5)')
  assert.equal(withAlpha('oklch(0.97 0.05 92)', 0.85), 'oklch(0.97 0.05 92 / 0.85)')
  assert.equal(withAlpha('oklab(0.7 0.02 0.1 / 0.5)', 0.5), 'oklab(0.7 0.02 0.1 / 0.25)')
  assert.equal(withAlpha('color(srgb 1 0.5 0)', 0), 'color(srgb 1 0.5 0 / 0)')
  assert.equal(withAlpha('red', 0.5), 'red')
})
