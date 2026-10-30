import assert from 'node:assert/strict'
import { test } from 'node:test'
import { backingDensity, ctaLitProperties, litValues } from './cta-light'

test('the closing silk stays within 2x density and about two million pixels', () => {
  assert.equal(backingDensity(390, 256, 3), 2)
  assert.equal(backingDensity(1440, 345, 1), 1)
  for (const [width, height, ratio] of [[1440, 384, 2], [2560, 384, 2], [3840, 400, 3], [1024, 300, 2.5]]) {
    const density = backingDensity(width, height, ratio)
    assert.ok(density <= 2)
    assert.ok(Math.floor(width * density) * Math.floor(height * density) <= 2_000_000)
  }
  assert.equal(backingDensity(0, 100, 2), 1)
})

test('a control casts its shadow away from the lamp and catches it on the near side', () => {
  const box = { left: 100, top: 100, width: 150, height: 52 }
  const fromLeft = litValues(box, { x: 0, y: 40, z: 300 })
  const fromRight = litValues(box, { x: 400, y: 40, z: 300 })
  assert.equal(fromLeft.length, ctaLitProperties.length)
  assert.ok(parseFloat(fromLeft[3]) > 0, 'a lamp on the left throws the shadow right')
  assert.ok(parseFloat(fromRight[3]) < 0, 'a lamp on the right throws the shadow left')
  assert.ok(parseFloat(fromLeft[4]) > 0, 'a lamp above throws the shadow down')
  assert.ok(parseFloat(fromLeft[0]) < 0 && parseFloat(fromRight[0]) > 100)
})

test('shadows stay short and the hot spot only appears when the lamp comes close', () => {
  const box = { left: 0, top: 0, width: 150, height: 52 }
  const low = litValues(box, { x: -2000, y: 2000, z: 10 })
  assert.ok(Math.abs(parseFloat(low[3])) <= 10 && Math.abs(parseFloat(low[4])) <= 10)
  assert.equal(litValues(box, { x: 75, y: 26, z: 200 })[5], '1.00')
  assert.equal(litValues(box, { x: 75, y: 26, z: 200 }, 0.4)[5], '0.40')
  assert.equal(litValues(box, { x: 900, y: -900, z: 200 })[5], '0.00')
})

test('a large title is near only when the lamp comes to its words, and casts a shorter shadow', () => {
  const title = { left: 300, top: 0, width: 600, height: 180 }
  const lamp = { x: 200, y: 400, z: 300 }
  const asText = litValues(title, { x: 600, y: 90, z: 200 }, 1, { elevation: 3, text: true })
  assert.equal(asText[5], '1.00', 'over the words')
  assert.equal(litValues(title, { x: 600, y: 600, z: 200 }, 1, { elevation: 3, text: true })[5], '0.00', 'far below them')
  const text = litValues(title, lamp, 1, { elevation: 3, text: true })
  const control = litValues(title, lamp)
  assert.equal(Math.sign(parseFloat(text[3])), Math.sign(parseFloat(control[3])), 'the shadow falls the same way')
  assert.ok(Math.abs(parseFloat(text[4])) < Math.abs(parseFloat(control[4])))
})
