import assert from 'node:assert/strict'
import { withCITimeouts, isCI } from '../../../../shared/vitest-ci-config.ts'
const input = { testTimeout: 1, hookTimeout: 240000, teardownTimeout: undefined, name: 'control' }
const result = withCITimeouts(input)
assert.equal(input.testTimeout, 1)
assert.equal(result.testTimeout, isCI ? 180000 : 1)
assert.equal(result.hookTimeout, 240000)
assert.equal(result.teardownTimeout, isCI ? 180000 : undefined)
assert.equal(result.name, 'control')
assert.deepEqual(withCITimeouts(), isCI ? { testTimeout: 180000, hookTimeout: 180000, teardownTimeout: 180000 } : {})
console.log(JSON.stringify({ isCI, result, mutation: false, status: 'PASS' }))
