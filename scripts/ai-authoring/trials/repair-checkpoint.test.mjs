import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from '@playwright/test'
import { repairCheckpoint, checkpointStatus, verifiedRepairLoop } from './repair-checkpoint.mjs'
import { prepare, repository } from './control.mjs'
import { compareRepairCandidate } from './repair-regression.mjs'

const verdict = (pass = true) => ({ functional: pass, styling: pass, accessibility: pass, browser: pass ? 'passed' : 'failed', checks: [{ id: 'hover', pass }], diagnostics: { version: 1, evidence: [] } })

test('verification requires complete checks and rejects checker, color and execution failures', async () => {
  assert.equal(checkpointStatus(verdict()), 'passed')
  assert.equal(checkpointStatus({ ...verdict(), checks: [] }), 'unverified')
  assert.equal(checkpointStatus({ ...verdict(), checks: [{ id: 'checker-error', pass: false }] }), 'unverified')
  assert.equal(checkpointStatus({ ...verdict(), colorComparison: { error: 'unavailable' } }), 'unverified')
  assert.equal(checkpointStatus({ ...verdict(), checks: [{ id: 'hover', pass: false }] }), 'failed')
  const root = await mkdtemp(join(tmpdir(), 'master-checkpoint-test-'))
  try {
    for (const file of ['index.html', 'app.css', 'app.js']) await writeFile(join(root, file), file)
    await writeFile(join(root, 'diagnostics.json'), 'stale evidence')
    const initial = await repairCheckpoint({ work: root, checker: async () => verdict(false) })
    await writeFile(join(root, 'app.css'), 'edited')
    const next = await repairCheckpoint({ work: root, sequence: 1, previous: initial, checker: async () => ({ ...verdict(false), checks: [{ id: 'hover', pass: true }, { id: 'touch-tap', pass: false }] }) })
    assert.notEqual(initial.sourceHash, next.sourceHash)
    assert.deepEqual(next.resolvedChecks, ['hover'])
    assert.deepEqual(next.newFailingChecks, ['touch-tap'])
    assert.equal(JSON.parse(await readFile(join(root, '.diagnostic-evidence.json'))).checks[1].id, 'touch-tap')
    const failed = await repairCheckpoint({ work: root, execution: { failed: true }, checker: async () => verdict() })
    assert.equal(failed.status, 'unverified')
    assert.equal(JSON.parse(await readFile(join(root, 'repair-feedback.json'))).status, 'unverified')
    const unavailable = await repairCheckpoint({ work: root, checker: async () => { throw Error('Browser unavailable') } })
    assert.equal(unavailable.status, 'unverified')
    assert.equal(JSON.parse(await readFile(join(root, 'diagnostics.json'))).status, 'unavailable')
    const changed = await repairCheckpoint({ work: root, checker: async () => { await writeFile(join(root, 'app.css'), 'racing edit'); return verdict() } })
    assert.equal(changed.status, 'unverified')
    await rm(join(root, 'app.js'))
    assert.equal((await repairCheckpoint({ work: root, checker: async () => verdict() })).status, 'unverified')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('repair loop uses fresh feedback, verifies the last edit and stops at success, budget or execution failure', async () => {
  const seen = [], recorded = []
  const result = await verifiedRepairLoop({ maxAttempts: 2,
    checkpoint: async ({ sequence }) => ({ sequence, status: sequence === 2 ? 'passed' : 'failed', sourceHash: String(sequence) }),
    repair: async ({ previous }) => { seen.push(previous.sourceHash); return { failed: false, answer: 'Retained CSS' } },
    record: async ({ checkpoint }) => recorded.push(checkpoint.sequence)
  })
  assert.deepEqual(seen, ['0', '1'])
  assert.deepEqual(recorded, [0, 1, 2])
  assert.equal(result.status, 'passed')
  assert.equal(result.exhausted, false)
  const exhausted = await verifiedRepairLoop({ maxAttempts: 1, checkpoint: async () => ({ status: 'failed' }), repair: async () => ({ failed: false }) })
  assert.equal(exhausted.exhausted, true)
  assert.equal(exhausted.checkpoints.length, 2)
  const failed = await verifiedRepairLoop({ checkpoint: async ({ sequence }) => ({ status: sequence ? 'passed' : 'failed' }), repair: async () => ({ failed: true }) })
  assert.equal(failed.status, 'unverified')
  assert.equal(failed.attempts.length, 1)
  for (const status of ['passed', 'unverified']) {
    const stopped = await verifiedRepairLoop({ checkpoint: async () => ({ status }), repair: async () => { throw Error('Must not invoke model') } })
    assert.equal(stopped.attempts.length, 0)
  }
})

test('host checkpoints rebuild and check hover, inherited line-height and touch regressions after each source edit', async () => {
  const work = await mkdtemp(join(tmpdir(), 'master-checkpoint-browser-')), browser = await chromium.launch()
  try {
    await prepare(work, 'tailwind-hover', true)
    const original = await readFile(join(work, 'app.css'), 'utf8')
    const run = (previous, sequence) => repairCheckpoint({ work, task: 'tailwind-hover', browser, repository, baseline: work, answer: 'Retained reset CSS.', previous, sequence })
    const start = await run(undefined, 0)
    assert.equal(start.status, 'passed')
    await writeFile(join(work, 'app.css'), original + '\nbody{line-height:1.2}\n@media (hover:hover){#target:hover{background-color:red!important}}')
    const broken = await run(start, 1)
    assert.equal(broken.status, 'failed')
    assert.ok(broken.failedChecks.some(c => Array.isArray(c.actual) && c.actual.some(d => d.property === 'line-height')))
    assert.ok(broken.failedChecks.some(c => c.id.endsWith('-hover')))
    await writeFile(join(work, 'app.css'), original + '\n#target:hover{background-color:red!important}')
    const regression = await run(broken, 2)
    assert.equal(regression.status, 'failed')
    assert.ok(regression.newFailingChecks.includes('touch-tap'))
    assert.equal(compareRepairCandidate(broken, regression).reason, 'regression')
    assert.ok(compareRepairCandidate(broken, regression).regressions.some(d => d.check === 'touch-tap'))
    await writeFile(join(work, 'app.css'), original)
    const fixed = await run(regression, 3)
    assert.equal(fixed.status, 'passed')
    assert.deepEqual(fixed.failedChecks, [])
    assert.notEqual(fixed.sourceHash, broken.sourceHash)
    assert.equal(fixed.sourceHash, start.sourceHash)
    assert.ok(fixed.generatedCSSHash)
    assert.equal(compareRepairCandidate(broken, fixed).adopt, true)
  } finally { await browser.close(); await rm(work, { recursive: true, force: true }) }
})
