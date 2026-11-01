import assert from 'node:assert/strict'
import { test } from 'node:test'
import { selectGuardedCohort, summarizeGuardedCohort } from './guarded-cohort.mjs'

const source = { hash: 'source', sourceHashes: {}, artifactHashes: {}, selected: ['a', 'b', 'c'].map(id => ({ id, model: 'model', task: 'task' })) }
const oldRows = source.selected.map((item, i) => ({ ...item, protocolHash: 'source', status: i ? 'passed' : 'failed', attempts: 2, checkpoints: [{ status: 'failed', sourceHash: 'initial-' + item.id }] }))

test('keeps prior successes and failures from their original failed checkpoints; rejects missing and mixed cases', () => {
  const selected = selectGuardedCohort(source, oldRows)
  assert.equal(selected.length, 3)
  assert.equal(selected.filter(c => c.previousStatus === 'passed').length, 2)
  assert.equal(selected[1].initialSourceHash, 'initial-b')
  assert.throws(() => selectGuardedCohort(source, oldRows.slice(1)), /Incomplete/)
  assert.throws(() => selectGuardedCohort(source, [oldRows[0], oldRows[0], oldRows[2]]), /duplicate/)
  for (const patch of [{ model: 'other' }, { protocolHash: 'other' }, { status: 'unverified' }, { checkpoints: [{ status: 'passed' }] }]) assert.throws(() => selectGuardedCohort(source, [{ ...oldRows[0], ...patch }, ...oldRows.slice(1)]), /Ineligible/)
})

test('separates proposed regressions from retained results and keeps errors, missing usage and incomplete coverage explicit', () => {
  const protocol = { hash: 'cohort', selected: selectGuardedCohort(source, oldRows) }
  const row = { id: 'a', protocolHash: 'cohort', status: 'passed', finalVerified: true, retainedRegressions: 0, attempts: 2, rejected: 1, regressiveProposals: 1, noProgressProposals: 0, inputTokens: 100, cachedInputTokens: 50, outputTokens: 10 }
  const error = { ...row, id: 'b', status: 'unverified', finalVerified: false, retainedRegressions: null, attempts: null, rejected: null, regressiveProposals: null, inputTokens: null, cachedInputTokens: null, outputTokens: null }
  const summary = summarizeGuardedCohort(protocol, [row, error])
  assert.equal(summary.passed, 1)
  assert.equal(summary.unverified, 1)
  assert.equal(summary.unmeasuredUsage, 1)
  assert.equal(summary.unmeasuredAttempts, 1)
  assert.equal(summary.unmeasuredProposals, 1)
  assert.equal(summary.regressiveProposals, 1)
  assert.equal(summary.retainedRegressions, null)
  assert.deepEqual(summary.missing, ['c'])
  assert.equal(summary.outcomes[2].current, 'pending')
  for (const patch of [{ finalVerified: false }, { retainedRegressions: 1 }, { protocolHash: 'other' }, { inputTokens: -1 }, { cachedInputTokens: 101 }]) assert.throws(() => summarizeGuardedCohort(protocol, [{ ...row, ...patch }]))
  assert.throws(() => summarizeGuardedCohort(protocol, [row, row]), /duplicate/)
})
