import { cp, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { check } from './check.mjs'
import { repository } from './control.mjs'

const [directory, task, mode] = process.argv.slice(2)
const allAttempts = mode === '--all-attempts'
if (mode && !allAttempts) throw new Error('Unknown recheck mode')
if (!directory || !task) throw new Error('Usage: node --import tsx scripts/ai-authoring/trials/recheck.mjs RUN_DIRECTORY TASK_OR_all [--all-attempts]')
const root = resolve(directory)
const protocol = JSON.parse(await readFile(join(root, 'protocol.json'), 'utf8'))
const selectedTasks = task === 'all' ? protocol.tasks : [task]
if (!selectedTasks.every(id => protocol.tasks.includes(id))) throw new Error('Task is absent from the recorded protocol')
const digest = data => createHash('sha256').update(data).digest('hex')
const checkerHashes = Object.fromEntries(await Promise.all(['check.mjs', '../color-comparison.mjs', '../browser-diagnostics.mjs'].map(async file => [file, digest(await readFile(new URL(file, import.meta.url)))])))
if (digest(await readFile(join(repository, 'packages/binding/artifacts/mastercss.node'))) !== protocol.toolVersion) throw new Error('Native artifact differs from the recorded experiment')
for (const file of Object.keys(protocol.artifactHashes).filter(file => file.startsWith('packages/') || file === 'bun.lock')) {
  if (digest(await readFile(join(repository, file))) !== protocol.artifactHashes[file]) throw new Error(`Recorded dependency or CLI artifact changed: ${file}`)
}
const runs = []
for (const file of await readdir(root)) {
  if (!file.endsWith('.result.json')) continue
  const row = JSON.parse(await readFile(join(root, file), 'utf8'))
  if (selectedTasks.includes(row.task)) runs.push({ id: file.slice(0, -'.result.json'.length), row })
}
const expected = new Set(selectedTasks.flatMap(taskId => protocol.arms.flatMap(arm => protocol.models.flatMap(model => Array.from({ length: protocol.repeats }, (_, repeat) => JSON.stringify([taskId, arm, model, repeat]))))))
for (const { row } of runs) if (!expected.delete(JSON.stringify([row.task, row.arm, row.model, row.repeat]))) throw new Error('Unexpected or duplicate observation')
if (expected.size) throw new Error('Recheck must include every arm, model and repetition of the task')
const destination = await mkdtemp(join(root, `recheck-${task}-`))
const browser = await chromium.launch()
const results = []
try {
  for (const { id, row } of runs) {
    for (const attempt of allAttempts ? Array.from({ length: row.repairRounds + 1 }, (_, index) => index) : [row.repairRounds]) {
      const work = join(destination, `${id}-attempt-${attempt}`)
      await cp(join(root, id, allAttempts ? `attempt-${attempt}.work` : 'work'), work, { recursive: true, verbatimSymlinks: true })
      const events = (await readFile(join(root, id, `attempt-${attempt}.events.jsonl`), 'utf8')).split('\n').filter(Boolean).flatMap(line => { try { return [JSON.parse(line)] } catch { return [] } })
      const answer = events.filter(e => e.type === 'item.completed' && e.item?.type === 'agent_message').map(e => e.item.text).join('\n')
      const verdict = await check(work, row.task, browser, repository, answer, join(root, id, 'baseline'))
      const original = JSON.parse(await readFile(join(root, id, `attempt-${attempt}.acceptance.json`), 'utf8'))
      const executionPassed = !events.some(event => event.type === 'turn.failed') && row.execution.slice(0, attempt + 1).every(e => e.exit.code === 0 && !e.timedOut && !e.unavailable && !e.hostSkillRead) && !original.checks.some(c => !c.pass && ['protected-file-changed', 'personal-skill-contamination'].includes(c.id))
      results.push({ id, attempt, originalPassed: executionPassed && original.functional && original.styling && original.accessibility && original.browser === 'passed', recheckedPassed: executionPassed && verdict.functional && verdict.styling && verdict.accessibility && verdict.browser === 'passed', verdict, artifacts: work })
    }
  }
} finally {
  await browser.close()
  await writeFile(join(destination, 'report.json'), JSON.stringify({ task, allAttempts, complete: results.length === runs.reduce((n, { row }) => n + (allAttempts ? row.repairRounds + 1 : 1), 0), originalRevision: protocol.revision, checkerHashes, checkerSha256: digest(await readFile(new URL('check.mjs', import.meta.url))), method: allAttempts ? 'Post-run verification of every saved attempt for the selected tasks in separate copies. Original feedback, scores, timings and usage are unchanged; repaired attempts still reflect the original feedback.' : 'Post-run verification of every final output for the selected tasks in separate copies. Original attempts, feedback, scores, timings and token usage remain unchanged. This cannot reconstruct first-attempt outcomes.', results }, null, 2))
}
console.log(JSON.stringify({ destination, checked: results.length, passed: results.filter(r => r.recheckedPassed).length, changed: results.filter(r => r.originalPassed !== r.recheckedPassed).map(r => ({ id: r.id, attempt: r.attempt })) }))
