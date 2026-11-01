import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assessLintCoverage } from './lint-coverage.mjs'

test('rejects conflating clean inputs with absent coverage, diagnostics with checked inputs, and lint with browser verification', () => {
  const expected = { checkedFiles: 2, filesWithDiagnostics: 1, checkedPaths: ['./clean.html', './bad.html'], sourceCheck: 'complete', hasErrors: true, browserVerified: false, wholeProjectVerified: false }
  const answer = { ...expected, explanation: 'Two selected inputs were checked; only bad.html has diagnostics. Browser behavior was not checked.' }
  assert.equal(assessLintCoverage(JSON.stringify(answer), expected).passed, true)
  for (const [field, value] of [['checkedFiles', 1], ['filesWithDiagnostics', 2], ['sourceCheck', 'no-inputs'], ['browserVerified', true], ['checkedPaths', ['./bad.html']]]) {
    assert.deepEqual(assessLintCoverage(JSON.stringify({ ...answer, [field]: value }), expected).failures, [field])
  }
  assert.equal(assessLintCoverage('{}', expected).passed, false)
  assert.equal(assessLintCoverage('not JSON', expected).passed, false)
  const none = { ...expected, checkedFiles: 0, filesWithDiagnostics: 0, checkedPaths: [], sourceCheck: 'no-inputs', hasErrors: false }
  assert.equal(assessLintCoverage(JSON.stringify({ ...none, explanation: 'No source inputs matched.' }), none).passed, true)
  assert.equal(assessLintCoverage(JSON.stringify({ ...none, sourceCheck: 'complete', explanation: 'Everything is clean.' }), none).passed, false)
})
