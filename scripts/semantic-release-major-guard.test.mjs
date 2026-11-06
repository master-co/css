import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyRelease } from './semantic-release-major-guard.mjs'

const breaking = { hash: 'cad9e45ce0', message: 'Update(Integrations): Rename a mode\n\nBREAKING CHANGE: Use the new name.' }

test('a major release inferred from a breaking footer is refused', () => {
  assert.throws(
    () => verifyRelease({}, { commits: [breaking], nextRelease: { type: 'major', version: '3.0.0' } }),
    /Refusing to release 3\.0\.0[\s\S]*cad9e45ce Update\(Integrations\): Rename a mode/
  )
})

test('a major release requested by Bump(Major) proceeds', () => {
  const bump = { hash: 'b', message: 'Bump(Major): Release the next major version' }
  assert.doesNotThrow(() => verifyRelease({}, { commits: [breaking, bump], nextRelease: { type: 'major', version: '3.0.0' } }))
})

test('patch and minor releases are not checked', () => {
  for (const type of ['patch', 'minor']) {
    assert.doesNotThrow(() => verifyRelease({}, { commits: [breaking], nextRelease: { type, version: '2.0.1' } }))
  }
})
