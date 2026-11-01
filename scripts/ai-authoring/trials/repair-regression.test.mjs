import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareRepairCandidate, guardedRepairLoop } from './repair-regression.mjs'
const difference = (property, actual = 'bad') => ({ node: 0, property, actual, expected: 'good' })
const checkpoint = (checks, sourceHash = 'input') => ({ sourceHash, status: checks.every(c => c.pass) ? 'passed' : 'failed', assessment: { checks, browser: checks.every(c => c.pass) ? 'passed' : 'failed', functional: true, styling: checks.every(c => c.pass), accessibility: true } })
const checks = (diffs = [difference('background-color')], invalid = ['hover:bg-blue-700']) => [
  { id: 'light-390-hover', kind: 'styling', pass: !diffs.length, actual: diffs },
  { id: 'touch-tap', kind: 'styling', pass: true, actual: [] },
  { id: 'valid-classes', kind: 'styling', pass: !invalid.length, actual: invalid }
]

test('rejects new property failures inside an already failing check and new unresolved names', () => {
  const before = checkpoint(checks())
  const sameCheck = compareRepairCandidate(before, checkpoint(checks([difference('background-color'), difference('height')], [])))
  assert.equal(sameCheck.adopt, false)
  assert.equal(sameCheck.regressions[0].property, 'height')
  assert.ok(sameCheck.resolved.some(x => x.className))
  const names = compareRepairCandidate(before, checkpoint(checks([], ['h-10', 'text-white'])))
  assert.equal(names.reason, 'regression')
  assert.deepEqual(names.regressions.map(x => x.className), ['h-10', 'text-white'])
})

test('requires stable coverage/expectations and strict progress, never infers numeric improvement', () => {
  const before = checkpoint(checks())
  assert.equal(compareRepairCandidate(before, checkpoint(checks().slice(1))).reason, 'coverage-changed')
  assert.equal(compareRepairCandidate(before, checkpoint([...checks(), checks()[0]])).reason, 'unverified')
  assert.equal(compareRepairCandidate(before, checkpoint(checks([{ ...difference('background-color'), expected: 'other' }]))).reason, 'expectation-changed')
  assert.equal(compareRepairCandidate(before, checkpoint(checks([difference('background-color', 'different')]))).reason, 'no-progress')
  assert.equal(compareRepairCandidate(before, checkpoint(checks([difference('background-color')], []))).reason, 'progress')
  assert.equal(compareRepairCandidate(before, checkpoint(checks([], []))).reason, 'passed')
  assert.equal(compareRepairCandidate(before, { ...checkpoint(checks([difference('background-color')], [])), status: 'passed' }).reason, 'unverified')
  assert.equal(compareRepairCandidate(before, { ...checkpoint(checks([], [])), status: 'unverified' }).adopt, false)
  assert.equal(compareRepairCandidate(before, { ...checkpoint(checks([], [])), assessment: { ...checkpoint(checks([], [])).assessment, colorComparison: { error: 'failed' } } }).adopt, false)
})

test('a rejected proposal cannot become the next starting point; accepted progress can', async () => {
  const initial = { checkpoint: checkpoint(checks(), 'initial'), snapshot: 'initial' }, parents = []
  const result = await guardedRepairLoop({ initial, maxAttempts: 3, propose: async ({ accepted, attempt, lastRejection }) => {
    parents.push(accepted.snapshot)
    if (attempt === 0) return { checkpoint: checkpoint(checks([difference('height')]), 'regressed'), snapshot: 'regressed', diff: 'bad patch' }
    if (attempt === 1) {
      assert.equal(lastRejection.diff, 'bad patch')
      assert.equal(lastRejection.decision.reason, 'regression')
      return { checkpoint: checkpoint(checks([difference('background-color')], []), 'partial'), snapshot: 'partial' }
    }
    assert.equal(lastRejection, null)
    return { checkpoint: checkpoint(checks([], []), 'passed'), snapshot: 'passed' }
  } })
  assert.deepEqual(parents, ['initial', 'initial', 'partial'])
  assert.equal(result.status, 'passed')
  assert.equal(result.accepted.snapshot, 'passed')
  const exhausted = await guardedRepairLoop({ initial, maxAttempts: 1, propose: async () => ({ checkpoint: checkpoint(checks([difference('height')]), 'bad'), snapshot: 'bad' }) })
  assert.equal(exhausted.status, 'failed')
  assert.equal(exhausted.exhausted, true)
  assert.equal(exhausted.accepted.snapshot, 'initial')
  const error = await guardedRepairLoop({ initial, propose: async () => ({ checkpoint: { ...initial.checkpoint, status: 'unverified' } }) })
  assert.equal(error.status, 'unverified')
  assert.equal(error.proposals.length, 1)
  assert.equal(error.accepted.snapshot, 'initial')
  const executionError = await guardedRepairLoop({ initial, propose: async () => ({ checkpoint: checkpoint(checks([], [])), execution: { failed: true } }) })
  assert.equal(executionError.status, 'unverified')
  assert.equal(executionError.accepted.snapshot, 'initial')
})
