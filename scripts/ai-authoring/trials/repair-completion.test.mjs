import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from '@playwright/test'
import { repairCompletion } from './repair-completion.mjs'
import { repairCheckpoint } from './repair-checkpoint.mjs'
import { compareRepairCandidate } from './repair-regression.mjs'
import { prepare, repository } from './control.mjs'

test('completion keeps passed reporting obligations and ties unresolved classes to the current checkpoint', () => {
  const checks = [
    { id: 'valid-classes', kind: 'styling', pass: false, actual: ['hover:bg-blue-700'] },
    { id: 'retained-css-reported', kind: 'functional', pass: true },
    { id: 'light-390-hover', kind: 'styling', pass: false }
  ]
  const completion = repairCompletion({ sourceHash: 'current', status: 'failed', assessment: { checks } })
  assert.equal(completion.sourceHash, 'current')
  assert.deepEqual(completion.classes.unresolved, ['hover:bg-blue-700'])
  assert.equal(completion.requiredReports[0].checkpointPassed, true)
  assert.equal(completion.requiredReports[0].requiresFreshAnswer, true)
  assert.deepEqual(completion.remainingChecks.map(check => check.id), ['valid-classes', 'light-390-hover'])
  const missing = repairCompletion({ sourceHash: 'unavailable', status: 'unverified' })
  assert.equal(missing.classes.status, 'unverified')
  assert.deepEqual(missing.requiredReports, [])
  const fixed = repairCompletion({ sourceHash: 'new', status: 'passed', assessment: { checks: checks.map(check => ({ ...check, pass: true, actual: [] })) } })
  assert.deepEqual(fixed.classes.unresolved, [])
  assert.equal(fixed.requiredReports.length, 1)
  assert.equal(fixed.sourceHash, 'new')
  assert.equal(checks[0].pass, false)
})

test('matching browser output still exposes obsolete classes and omitted reporting, then accepts a complete repair', async () => {
  const work = await mkdtemp(join(tmpdir(), 'master-completion-browser-')), browser = await chromium.launch()
  try {
    await prepare(work, 'tailwind-hover', true)
    const html = await readFile(join(work, 'index.html'), 'utf8')
    await writeFile(join(work, 'index.html'), html.replace('class="', 'class="hover:bg-missing-token '))
    const run = (answer, previous) => repairCheckpoint({ work, task: 'tailwind-hover', browser, repository, baseline: work, answer, previous })
    const initial = await run('Retained native CSS reset, palette tokens and state rules.')
    assert.deepEqual(initial.failedChecks.map(check => check.id), ['valid-classes'])
    assert.deepEqual(initial.completion.classes.unresolved, ['hover:bg-missing-token'])
    assert.equal(initial.completion.requiredReports[0].checkpointPassed, true)
    const incomplete = await run('Build completed. Browser verification remains pending.', initial)
    assert.deepEqual(incomplete.failedChecks.map(check => check.id), ['valid-classes', 'retained-css-reported'])
    assert.equal(incomplete.completion.requiredReports[0].checkpointPassed, false)
    const rejected = compareRepairCandidate(initial, incomplete)
    assert.equal(rejected.reason, 'regression')
    assert.deepEqual(rejected.regressions.map(atom => atom.check), ['retained-css-reported'])
    await writeFile(join(work, 'index.html'), html)
    const fixed = await run('Removed the obsolete hover spelling; retained the reset, palette tokens and native hover, focus-visible and disabled CSS. Build completed; host browser verification remains pending.', initial)
    assert.equal(fixed.status, 'passed')
    assert.equal(compareRepairCandidate(initial, fixed).reason, 'passed')
    const feedback = JSON.parse(await readFile(join(work, 'repair-feedback.json'), 'utf8'))
    assert.deepEqual(feedback.completion.classes.unresolved, [])
    assert.equal(feedback.completion.sourceHash, fixed.sourceHash)
    assert.notEqual(fixed.sourceHash, initial.sourceHash)
    assert.equal(feedback.completion.requiredReports[0].requiresFreshAnswer, true)
  } finally { await browser.close(); await rm(work, { recursive: true, force: true }) }
})
