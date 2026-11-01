import { parseArgs } from 'node:util'
import { execFileSync, spawn } from 'node:child_process'
import { readFile, writeFile, readdir, mkdir, mkdtemp, cp } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from '@playwright/test'
import { repository } from './control.mjs'
import { digest, treeHashes } from './repair-inputs.mjs'
import { repairCheckpoint } from './repair-checkpoint.mjs'
import { compareRepairCandidate } from './repair-regression.mjs'
import { modelArguments } from './invoke.mjs'
import { selectGuardedCohort, summarizeGuardedCohort } from './guarded-cohort.mjs'

const { values } = parseArgs({ options: { source: { type: 'string' }, attempts: { type: 'string', default: '2' } } })
if (!values.source) throw new Error('Usage: node --import tsx scripts/ai-authoring/trials/guarded-cohort-run.mjs --source RECHECK_RUN [--attempts 2]')
const source = resolve(values.source), maxAttempts = Number(values.attempts)
if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw new Error('Expected 1 to 3 attempts')
const oldProtocol = JSON.parse(await readFile(join(source, 'protocol.json'), 'utf8'))
const oldRows = await Promise.all((await readdir(source)).filter(f => f.endsWith('.result.json')).map(async f => JSON.parse(await readFile(join(source, f), 'utf8'))))
const selected = selectGuardedCohort(oldProtocol, oldRows)
for (const item of selected) {
  item.sourceResultHash = digest(await readFile(join(source, item.id + '.result.json')))
  const checkpoint = JSON.parse(await readFile(join(source, item.id, 'checkpoint-0.json'), 'utf8'))
  item.initialCheckHash = digest(JSON.stringify(checkpoint.assessment.checks))
}
const root = await mkdtemp(join(tmpdir(), 'master-guarded-cohort-'))
await mkdir(join(root, 'cases'))
const sourceHashes = await treeHashes(join(repository, 'scripts/ai-authoring'))
const artifactHashes = Object.fromEntries(await Promise.all(Object.keys(oldProtocol.artifactHashes).map(async file => [file, digest(await readFile(join(repository, file)))])))
for (const file of ['trials/check.mjs', 'color-comparison.mjs']) if (sourceHashes[file] !== oldProtocol.sourceHashes[file]) throw new Error('Source scorer changed')
const browser = await chromium.launch(), rows = []
const protocol = { version: 1, mode: 'guarded-cohort', revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source, sourceProtocolHash: digest(await readFile(join(source, 'protocol.json'))),
  selected, sourceHashes, artifactHashes, artifactChanges: Object.keys(artifactHashes).filter(f => artifactHashes[f] !== oldProtocol.artifactHashes[f]),
  client: execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim(), browser: browser.version(), browserHash: digest(await readFile(chromium.executablePath())),
  maxAttempts, timeoutMs: 120000, concurrency: 1, modelArguments,
  design: 'All previously selected recheck cases, including prior passes, from their original failed checkpoint. Fresh model calls, same guarded policy and two attempts by default. No historical replay in children. Independently rebuild/recheck each retained result, compare it with its initial checks, and retain all proposal rejections/errors. Historical comparisons are descriptive.' }
protocol.hash = digest(JSON.stringify(protocol))
await writeFile(join(root, 'protocol.json'), JSON.stringify(protocol, null, 2))
console.log(JSON.stringify({ root, cases: selected.length, maxAttempts }))
async function verifyEnvironment() {
  if (JSON.stringify(await treeHashes(join(repository, 'scripts/ai-authoring'))) !== JSON.stringify(sourceHashes)) throw new Error('Runner sources changed')
  for (const [file, hash] of Object.entries(artifactHashes)) if (digest(await readFile(join(repository, file))) !== hash) throw new Error('Tool artifact changed: ' + file)
}
async function runCase(item, folder) {
  const log = createWriteStream(join(root, item.id + '.log'), { flags: 'wx' })
  const child = spawn(process.execPath, ['--import', 'tsx', join(repository, 'scripts/ai-authoring/trials/guarded-run.mjs'), '--source', source, '--case', item.id, '--cohort-case', '--output', folder, '--attempts', String(maxAttempts)], { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', chunk => { log.write(chunk); process.stdout.write(chunk) })
  child.stderr.on('data', chunk => log.write(chunk))
  const exit = await new Promise(resolve => { child.on('error', error => resolve({ error: error.message })); child.on('close', (code, signal) => resolve({ code, signal })) })
  await new Promise(resolve => log.end(resolve))
  if (exit.code !== 0) throw new Error('Child failed: ' + JSON.stringify(exit))
}
let blocked = null
try {
  for (const item of selected) {
    const folder = join(root, 'cases', item.id)
    let result = null, verification = null, delta = null, error = null
    try {
      await verifyEnvironment()
      await runCase(item, folder)
      result = JSON.parse(await readFile(join(folder, 'result.json'), 'utf8'))
      const child = JSON.parse(await readFile(join(folder, 'protocol.json'), 'utf8'))
      if (child.mode !== 'cohort-case' || child.case.id !== item.id || child.model !== item.model || child.maxAttempts !== maxAttempts || child.timeoutMs !== protocol.timeoutMs || child.sourceProtocolHash !== protocol.sourceProtocolHash) throw new Error('Mixed child selection or budget')
      for (const key of ['sourceHashes', 'artifactHashes', 'modelArguments', 'client', 'browserHash']) if (JSON.stringify(child[key]) !== JSON.stringify(protocol[key])) throw new Error('Mixed child environment: ' + key)
      const initial = JSON.parse(await readFile(join(folder, 'initial.json'), 'utf8'))
      if (initial.sourceHash !== item.initialSourceHash || digest(JSON.stringify(initial.assessment.checks)) !== item.initialCheckHash) throw new Error('Initial source or scored failure changed')
      // A second, independent rebuild evaluates the exact retained sources.
      const work = join(folder, 'verification.work')
      await cp(join(folder, 'retained.work'), work, { recursive: true, verbatimSymlinks: true })
      const accepted = result.proposals.filter(p => p.decision.adopt).at(-1)
      const answer = accepted ? JSON.parse(await readFile(join(folder, `attempt-${accepted.attempt}`, 'execution.json'), 'utf8')).answer : 'Retained reset CSS.'
      verification = await repairCheckpoint({ work, task: item.task, browser, repository, baseline: join(folder, 'baseline'), answer, sequence: result.attempts + 1, previous: initial })
      delta = compareRepairCandidate(initial, verification)
      await writeFile(join(folder, 'verification.json'), JSON.stringify({ checkpoint: verification, delta }, null, 2))
      if (verification.sourceHash !== result.retainedSourceHash || verification.status !== result.retainedStatus || ['unverified', 'coverage-changed', 'expectation-changed'].includes(delta.reason)) throw new Error('Final verification is inconsistent')
      if (delta.regressions.length) throw new Error('Retained source introduced measured regressions')
      await verifyEnvironment()
    } catch (e) { error = e.message; blocked = { id: item.id, error } }
    const row = { id: item.id, protocolHash: protocol.hash, previousStatus: item.previousStatus,
      status: error ? 'unverified' : result.status, finalVerified: Boolean(!error && verification?.status === 'passed'), retainedRegressions: delta?.regressions.length ?? null,
      attempts: result?.attempts ?? null, rejected: result?.rejected ?? null,
      regressiveProposals: result?.proposals.filter(p => p.decision.reason === 'regression').length ?? null,
      noProgressProposals: result?.proposals.filter(p => p.decision.reason === 'no-progress').length ?? null,
      inputTokens: result?.inputTokens ?? null, cachedInputTokens: result?.cachedInputTokens ?? null, outputTokens: result?.outputTokens ?? null,
      retainedSourceHash: result?.retainedSourceHash ?? null, verificationSourceHash: verification?.sourceHash ?? null, error }
    rows.push(row)
    await writeFile(join(root, item.id + '.result.json'), JSON.stringify(row, null, 2))
    console.log(JSON.stringify({ completed: rows.length, total: selected.length, id: item.id, status: row.status, attempts: row.attempts, rejected: row.rejected, retainedRegressions: row.retainedRegressions, error }))
    if (blocked) break
  }
} finally {
  await browser.close()
  await writeFile(join(root, 'observations.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + '\n')
  await writeFile(join(root, 'summary.json'), JSON.stringify(summarizeGuardedCohort(protocol, rows), null, 2))
  if (blocked) { await writeFile(join(root, 'blocked.json'), JSON.stringify(blocked, null, 2)); process.exitCode = 1 }
  console.log(JSON.stringify({ root, completed: rows.length, blocked }))
}
