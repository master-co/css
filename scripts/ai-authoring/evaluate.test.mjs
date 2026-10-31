import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize, tasks } from './evaluate.mjs'

const run = {
  task: 'settings-card', arm: 'skill', model: 'pinned-model', client: 'test-client', fixtureRevision: 'commit', toolVersion: 'version',
  repeat: 0, repairRounds: 1, invalidClasses: 0, toolCalls: 3, inputTokens: 400, outputTokens: 200, durationMs: 1000,
  functional: true, styling: true, accessibility: true, browser: 'passed'
}
test('counts attempts and reports incomplete coverage without claiming unchecked success', () => {
  assert.equal(tasks.length, 12)
  const [result] = summarize([run, { ...run, repeat: 1, browser: 'not-checked' }, { ...run, repeat: 2, styling: false }])
  assert.equal(result.attempts, 3)
  assert.equal(result.successRate, 1 / 3)
  assert.equal(result.firstPassRate, 0)
  assert.equal(result.withinTwoRepairsRate, 1 / 3)
  assert.equal(result.browserUnchecked, 1)
  assert.equal(result.missingTasks.length, 11)
  assert.equal(result.inputTokens, 1200)
})
test('rejects duplicate observations, missing metrics and invalid arms', () => {
  assert.throws(() => summarize([run, run]), /Duplicate/)
  assert.throws(() => summarize([{ ...run, inputTokens: undefined }]), /inputTokens/)
  assert.throws(() => summarize([{ ...run, arm: 'unknown' }]), /Unknown/)
  assert.throws(() => summarize([{ ...run, browser: true }]), /browser/)
  assert.equal(summarize([run, { ...run, model: 'second-model' }]).length, 2)
})

test('records unavailable timeout and build metrics separately from measured zero', () => {
  const [result] = summarize([{ ...run, inputTokens: null, outputTokens: null, invalidClasses: null, functional: false, browser: 'not-checked' }])
  assert.equal(result.attempts, 1)
  assert.equal(result.successRate, 0)
  assert.deepEqual(result.unmeasured, { invalidClasses: 1, inputTokens: 1, outputTokens: 1 })
})
