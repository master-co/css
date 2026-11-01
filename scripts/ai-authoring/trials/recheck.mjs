import { cp, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { check } from './check.mjs'
import { repository } from './control.mjs'

const [directory, task] = process.argv.slice(2)
if (!directory || !task) throw new Error('Usage: node --import tsx scripts/ai-authoring/trials/recheck.mjs RUN_DIRECTORY TASK')
const root = resolve(directory)
const protocol = JSON.parse(await readFile(join(root, 'protocol.json'), 'utf8'))
if (!protocol.tasks.includes(task)) throw new Error('Task is absent from the recorded protocol')
const digest = data => createHash('sha256').update(data).digest('hex')
if (digest(await readFile(join(repository, 'packages/binding/artifacts/mastercss.node'))) !== protocol.toolVersion) throw new Error('Native artifact differs from the recorded experiment')
for (const file of ['packages/cli/dist/bin/index.js', 'bun.lock']) {
  if (digest(await readFile(join(repository, file))) !== protocol.artifactHashes[file]) throw new Error(`Recorded dependency or CLI artifact changed: ${file}`)
}
const runs = []
for (const file of await readdir(root)) {
  if (!file.endsWith('.result.json')) continue
  const row = JSON.parse(await readFile(join(root, file), 'utf8'))
  if (row.task === task) runs.push({ id: file.slice(0, -'.result.json'.length), row })
}
const expected = new Set(protocol.arms.flatMap(arm => protocol.models.flatMap(model => Array.from({ length: protocol.repeats }, (_, repeat) => JSON.stringify([arm, model, repeat])))))
for (const { row } of runs) if (!expected.delete(JSON.stringify([row.arm, row.model, row.repeat]))) throw new Error('Unexpected or duplicate observation')
if (expected.size) throw new Error('Recheck must include every arm, model and repetition of the task')
const destination = await mkdtemp(join(root, `recheck-${task}-`))
const browser = await chromium.launch()
const results = []
try {
  for (const { id, row } of runs) {
    const work = join(destination, id)
    await cp(join(root, id, 'work'), work, { recursive: true, verbatimSymlinks: true })
    const events = (await readFile(join(root, id, `attempt-${row.repairRounds}.events.jsonl`), 'utf8')).split('\n').filter(Boolean).flatMap(line => { try { return [JSON.parse(line)] } catch { return [] } })
    const answer = events.filter(e => e.type === 'item.completed' && e.item?.type === 'agent_message').map(e => e.item.text).join('\n')
    const verdict = await check(work, task, browser, repository, answer, join(root, id, 'baseline'))
    const original = JSON.parse(await readFile(join(root, id, `attempt-${row.repairRounds}.acceptance.json`), 'utf8'))
    const executionPassed = row.execution.every(e => e.exit.code === 0 && !e.timedOut && !e.unavailable && !e.hostSkillRead) && !original.checks.some(c => !c.pass && ['protected-file-changed', 'personal-skill-contamination'].includes(c.id))
    results.push({ id, originalPassed: row.functional && row.styling && row.accessibility && row.browser === 'passed', recheckedPassed: executionPassed && verdict.functional && verdict.styling && verdict.accessibility && verdict.browser === 'passed', verdict, artifacts: work })
  }
} finally {
  await browser.close()
  await writeFile(join(destination, 'report.json'), JSON.stringify({ task, originalRevision: protocol.revision, checkerSha256: digest(await readFile(new URL('check.mjs', import.meta.url))), method: 'Post-run verification of every final output for this task in separate copies. Original attempts, feedback, scores, timings and token usage remain unchanged. This cannot reconstruct first-attempt outcomes.', results }, null, 2))
}
console.log(JSON.stringify({ destination, checked: results.length, passed: results.filter(r => r.recheckedPassed).length, changed: results.filter(r => r.originalPassed !== r.recheckedPassed).map(r => r.id) }))
