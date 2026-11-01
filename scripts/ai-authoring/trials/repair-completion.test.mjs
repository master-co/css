import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
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

test('clean lint cannot clear invalid markup classes, while real native CSS hooks remain valid', async () => {
  const work = await mkdtemp(join(tmpdir(), 'master-completion-inspect-')), browser = await chromium.launch()
  const cli = args => {
    const result = spawnSync(process.execPath, [join(repository, 'packages/cli/dist/bin/index.js'), ...args], { cwd: work, encoding: 'utf8', timeout: 30000 })
    assert.ifError(result.error)
    assert.equal(result.signal, null)
    return { status: result.status, report: JSON.parse(result.stdout) }
  }
  try {
    await prepare(work, 'fallback-order', true)
    const html = await readFile(join(work, 'index.html'), 'utf8')
    const unsupported = ['h-10', 'px-4', 'rounded-lg', 'text-white']
    await writeFile(join(work, 'index.html'), html.replace('class="fallback"', `class="fallback ${unsupported.join(' ')}"`))
    assert.equal(cli(['lint', 'index.html', '--fix']).status, 0)
    const lint = cli(['lint', 'index.html'])
    assert.equal(lint.status, 0)
    assert.equal(lint.report.version, 5)
    assert.equal(lint.report.coverage.status, 'complete')
    assert.equal(lint.report.summary.checkedFiles, 1)
    assert.equal(lint.report.summary.filesWithDiagnostics, 0)
    assert.equal(lint.report.summary.diagnostics, 0)
    const inspection = cli(['inspect', 'index.html', '--classes', `fallback ${unsupported.join(' ')}`])
    assert.equal(inspection.status, 1)
    const markup = inspection.report.files.find(file => file.filePath.endsWith('/index.html'))
    assert.deepEqual(markup.discovered.invalid.slice().sort(), ['fallback', ...unsupported].sort())
    assert.ok(markup.discovered.usedNative.includes('fallback'))
    assert.ok(!markup.discovered.valid.includes('fallback'))
    assert.ok(inspection.report.diagnostics.some(item => item.code === 'UNKNOWN_TOKEN'))
    assert.deepEqual(inspection.report.missingCSS.missing.map(item => item.className).sort(), unsupported.slice().sort())
    const run = previous => repairCheckpoint({ work, task: 'fallback-order', browser, repository, baseline: work, answer: 'Retained native CSS for ordered display fallback and padding override.', previous })
    const invalid = await run()
    assert.deepEqual(invalid.failedChecks.map(check => check.id), ['valid-classes'])
    assert.deepEqual(invalid.completion.classes.unresolved.slice().sort(), unsupported.slice().sort())
    await writeFile(join(work, 'index.html'), html)
    const finalInspection = cli(['inspect', 'index.html', '--classes', 'fallback'])
    assert.equal(finalInspection.status, 0)
    assert.deepEqual(finalInspection.report.files[0].discovered.invalid, ['fallback'])
    assert.deepEqual(finalInspection.report.missingCSS.present, [{ className: 'fallback', status: 'present', reason: 'native-css' }])
    assert.deepEqual(finalInspection.report.missingCSS.missing, [])
    assert.ok(finalInspection.report.files[0].discovered.usedNative.includes('fallback'))
    const fixed = await run(invalid)
    assert.equal(fixed.status, 'passed')
    assert.equal(compareRepairCandidate(invalid, fixed).reason, 'passed')
    assert.equal(compareRepairCandidate(fixed, invalid).reason, 'regression')
  } finally { await browser.close(); await rm(work, { recursive: true, force: true }) }
})
