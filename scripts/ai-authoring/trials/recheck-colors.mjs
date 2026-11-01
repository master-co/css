import { readFile, readdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { compareColors } from '../color-comparison.mjs'

if (!process.argv[2]) throw new Error('Usage: node scripts/ai-authoring/trials/recheck-colors.mjs RUN_DIRECTORY')
const root = resolve(process.argv[2])
const protocol = JSON.parse(await readFile(join(root, 'protocol.json'), 'utf8'))
const rows = await Promise.all((await readdir(root)).filter(file => file.endsWith('.result.json')).map(async file => ({ id: file.slice(0, -'.result.json'.length), ...JSON.parse(await readFile(join(root, file), 'utf8')) })))
const expected = new Set(protocol.tasks.flatMap(task => protocol.arms.flatMap(arm => protocol.models.flatMap(model => Array.from({ length: protocol.repeats }, (_, repeat) => JSON.stringify([task, arm, model, repeat]))))))
for (const row of rows) if (!expected.delete(JSON.stringify([row.task, row.arm, row.model, row.repeat]))) throw new Error('Unexpected or duplicate trial')
if (expected.size) throw new Error('Missing trials')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const browser = await chromium.launch()
const results = [], hashes = {}
const output = await mkdtemp(join(tmpdir(), 'master-color-recheck-'))
try {
  for (const row of rows) for (let attempt = 0; attempt <= row.repairRounds; attempt++) {
    const file = join(row.id, `attempt-${attempt}.acceptance.json`)
    const bytes = await readFile(join(root, file))
    hashes[file] = digest(bytes)
    const original = JSON.parse(bytes)
    const checks = structuredClone(original.checks)
    const equivalent = []
    for (const check of checks) {
      if (check.pass || !row.task.startsWith('tailwind-') || check.kind !== 'styling') continue
      let differences = check.actual
      // Historical touch checks stored color/color/opacity arrays, unlike desktop checks.
      if (/^touch-/.test(check.id) && Array.isArray(check.actual?.actual) && Array.isArray(check.actual?.expected)) {
        const properties = ['background-color', 'color', 'opacity']
        differences = check.actual.actual.flatMap((value, i) => value === check.actual.expected[i] ? [] : [{ node: 0, property: properties[i], actual: value, expected: check.actual.expected[i] }])
      }
      if (!Array.isArray(differences) || !differences.length || !differences.every(item => item && typeof item === 'object' && typeof item.property === 'string')) continue
      const comparison = await compareColors(browser, differences)
      equivalent.push(...comparison.equivalent.map(item => ({ check: check.id, ...item })))
      if (!comparison.differences.length) check.pass = true
    }
    const execution = row.execution[attempt]
    const events = await readFile(join(root, row.id, `attempt-${attempt}.events.jsonl`), 'utf8')
    const executionPassed = execution?.exit.code === 0 && !execution.timedOut && !execution.unavailable && !execution.hostSkillRead && !events.split('\n').some(line => { try { return JSON.parse(line).type === 'turn.failed' } catch { return false } })
    const originalPassed = executionPassed && original.functional && original.styling && original.accessibility && original.browser === 'passed'
    const correctedPassed = executionPassed && !original.buildError && original.browser !== 'not-checked' && checks.every(check => check.pass)
    results.push({ id: row.id, task: row.task, arm: row.arm, model: row.model, repeat: row.repeat, attempt, final: attempt === row.repairRounds, originalPassed, correctedPassed, equivalent, changedChecks: checks.filter((check, i) => check.pass !== original.checks[i].pass).map(check => check.id) })
  }
  for (const [file, hash] of Object.entries(hashes)) if (digest(await readFile(join(root, file))) !== hash) throw new Error('Recorded acceptance file changed during audit')
  await writeFile(join(output, 'report.json'), JSON.stringify({
    version: 1, originalRoot: root, originalRevision: protocol.revision, browser: browser.version(),
    method: 'Uniform color-only reclassification of every recorded attempt. Uses original computed samples; no rebuild, browser replay, model call or replacement of original scores/costs. Cannot detect unrelated checker errors or reconstruct different repair histories.',
    comparisonSha256: digest(await readFile(new URL('../color-comparison.mjs', import.meta.url))),
    observationSha256: digest(await readFile(join(root, 'observations.jsonl'))), acceptanceHashes: hashes, results
  }, null, 2))
  console.log(JSON.stringify({ output, checked: results.length, changed: results.filter(row => row.originalPassed !== row.correctedPassed).map(({ id, attempt, final }) => ({ id, attempt, final })) }))
} finally { await browser.close() }
