import assert from 'node:assert/strict'
import { test } from 'node:test'
import Color from 'colorjs.io'
import { auditNaturalColors, colorLevels, mapToSRGB, naturalColorNames, resolveColor } from './natural-colors-audit'

function channel(color: Color, name: 'l' | 'h') {
  const value = color.oklch[name]
  assert.ok(typeof value === 'number' && Number.isFinite(value))
  return value
}

for (const { family, steps, modes } of auditNaturalColors()) {
  test(`${family}: gamut, perceptual spacing and text contrast`, () => {
    assert.deepEqual(steps.map(step => step.level), colorLevels)
    const colors = steps.map(step => new Color(step.value))
    const mapped = colors.map(mapToSRGB)
    for (const [index, step] of steps.entries()) {
      assert.ok(step.inP3, `${family}-${step.level} must fit Display P3`)
      assert.ok(step.mappingDelta < 0.02, `${family}-${step.level} loses too much character in sRGB`)
      const hueDifference = Math.abs(channel(colors[index], 'h') - channel(mapped[index], 'h'))
      assert.ok(Math.min(hueDifference, 360 - hueDifference) < 3, `${family}-${step.level}: sRGB mapping shifts the hue`)
      if (!index) continue
      assert.ok(channel(colors[index], 'l') < channel(colors[index - 1], 'l'), `${family}: original lightness reverses`)
      assert.ok(channel(mapped[index], 'l') < channel(mapped[index - 1], 'l'), `${family}: sRGB lightness reverses`)
      // Design bounds for these material palettes, not universal perception thresholds.
      assert.ok(step.deltaPerLevel! >= 0.003 && step.deltaPerLevel! <= 0.012, `${family}-${step.level}: abrupt or collapsed interval`)
      const mappedDelta = mapped[index].deltaEOK(mapped[index - 1]) / (colorLevels[index] - colorLevels[index - 1])
      assert.ok(mappedDelta >= 0.003 && mappedDelta <= 0.012, `${family}-${step.level}: sRGB interval collapses or jumps`)
      assert.ok(Math.abs(channel(colors[index], 'h') - channel(colors[index - 1], 'h')) <= 5, `${family}: abrupt hue change`)
    }
    for (const mode of modes) {
      for (const [surface, contrast] of Object.entries(mode.contrast)) {
        assert.ok(contrast >= 4.5, `text:${family} on ${mode.mode} surface:${surface}: ${contrast}`)
      }
    }
  })
}

test('material families remain distinct from one another through the middle range', () => {
  for (const [index, family] of naturalColorNames.entries()) {
    for (const other of naturalColorNames.slice(index + 1)) {
      const meanDifference = [30, 50, 70].reduce((sum, level) => sum + mapToSRGB(resolveColor(`color-${family}-${level}`)).deltaEOK(mapToSRGB(resolveColor(`color-${other}-${level}`))), 0) / 3
      assert.ok(meanDifference >= 0.025, `${family} and ${other} converge: ${meanDifference}`)
    }
  }
})

test('new colors provide a perceptible alternative to neighboring existing palettes', () => {
  const neighbors = { sand: ['stone'], taupe: ['stone', 'gray'], olive: ['lime'], sage: ['gray', 'green'], moss: ['green'], petrol: ['teal', 'slate'], copper: ['brown', 'orange'], terracotta: ['brown', 'orange'] }
  for (const [family, comparisons] of Object.entries(neighbors)) {
    for (const other of comparisons) {
      const meanDifference = [30, 50, 70].reduce((sum, level) => sum + mapToSRGB(resolveColor(`color-${family}-${level}`)).deltaEOK(mapToSRGB(resolveColor(`color-${other}-${level}`))), 0) / 3
      assert.ok(meanDifference >= 0.025, `${family} overlaps ${other}: ${meanDifference}`)
    }
  }
})
