import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lampValues, litProperties } from '@master/internal-site/home/home-lamp.ts'

const box = { left: 100, top: 400, width: 200, height: 60 }
const read = (values: string[]) => values.map(value => Number.parseFloat(value))

test('the resting lamp hangs above, so light falls from the top and shadows fall below', () => {
  const values = lampValues(box, { x: 200, y: -300, z: 900, near: 0 })
  assert.equal(values.length, litProperties.length)
  const [x, y, angle, castX, castY, near] = read(values)
  assert.equal(x, 50)
  assert.ok(y < 0, 'the lamp sits above the element')
  assert.equal(Math.abs(angle), 0, 'the lit rim faces straight up')
  assert.equal(Math.abs(castX), 0)
  assert.ok(castY > 0, 'the shadow falls downward')
  assert.equal(near, 0, 'a resting lamp leaves no hot spot')
})

test('the shadow turns away from a lamp carried to either side', () => {
  const [, , leftAngle, leftCast] = read(lampValues(box, { x: -200, y: 300, z: 260, near: 1 }))
  const [, , rightAngle, rightCast] = read(lampValues(box, { x: 600, y: 300, z: 260, near: 1 }))
  assert.ok(leftAngle < 0 && rightAngle > 0, 'the near rim faces the lamp')
  assert.ok(leftCast > 0 && rightCast < 0, 'the shadow falls away from the lamp')
})

test('a lamp brightens a frame from its edge, not only near its center', () => {
  const large = { left: 0, top: 0, width: 1200, height: 800 }
  const [, , , , , inside] = read(lampValues(large, { x: 1150, y: 40, z: 260, near: 1 }))
  const [, , , , , beyond] = read(lampValues(large, { x: 1700, y: 40, z: 260, near: 1 }))
  assert.equal(inside, 1)
  assert.ok(beyond < 0.1)
})

test('positions stay bounded however far the lamp travels', () => {
  const [x, y] = read(lampValues(box, { x: -5000, y: 5000, z: 260, near: 1 }))
  assert.equal(x, -60)
  assert.equal(y, 160)
})
