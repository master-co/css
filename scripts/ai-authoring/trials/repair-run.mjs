import { parseArgs } from 'node:util'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, readdir, mkdir, mkdtemp, cp } from 'node:fs/promises'
import { tmpdir, userInfo } from 'node:os'
import { join, resolve, relative } from 'node:path'
import { chromium } from '@playwright/test'
import { repository } from './control.mjs'
import { check } from './check.mjs'
import { invoke, modelArguments } from './invoke.mjs'
import { selectRepairSeeds, prepareRepairSeed, copyRepairInput, treeHashes, digest, passed } from './repair-inputs.mjs'
import { repairSchedule, compareRepairs } from './repair-comparison.mjs'

const { values } = parseArgs({ options: { source: { type: 'string' }, presentation: { type: 'string', default: 'compact' }, calibration: { type: 'boolean', default: false }, limit: { type: 'string' }, concurrency: { type: 'string', default: '2' } } })
if (!values.source) throw new Error('Usage: node --import tsx scripts/ai-authoring/trials/repair-run.mjs --source PRIOR_RUN [--calibration --limit 4] [--concurrency 2]')
if (!['compact', 'navigation'].includes(values.presentation)) throw new Error('Unknown presentation')
const concurrency = Number(values.concurrency), limit = values.limit ? Number(values.limit) : Infinity
if (!Number.isInteger(concurrency) || concurrency < 1 || (limit !== Infinity && (!Number.isInteger(limit) || limit < 1))) throw new Error('Invalid run size')
if (values.limit && !values.calibration) throw new Error('Only calibration may limit coverage')
const root = await mkdtemp(join(tmpdir(), 'master-repair-pairs-'))
const models = ['gpt-6.1-sol', 'gpt-6-luna'], timeoutMs = 120000
const selection = await selectRepairSeeds(resolve(values.source), values.calibration)
const sourceHashes = await treeHashes(join(repository, 'scripts/ai-authoring'))
const artifacts = ['bun.lock', 'packages/binding/artifacts/mastercss.node', 'packages/css/src/index.css']
for (const pkg of ['cli', 'mcp', 'compiler', 'tooling', 'css', 'schema', 'preset', 'binding', 'internal', 'engine-js']) {
  const directory = join(repository, 'packages', pkg, pkg === 'preset' ? 'src' : 'dist')
  for (const file of await readdir(directory, { recursive: true, withFileTypes: true })) if (file.isFile()) artifacts.push(relative(repository, join(file.parentPath, file.name)))
}
const artifactHashes = Object.fromEntries(await Promise.all(artifacts.sort().map(async file => [file, digest(await readFile(join(repository, file)))])))
const cacheRoot = join(userInfo().homedir, '.cache/mastercss')
await mkdir(cacheRoot, { recursive: true })
const browser = await chromium.launch()
const rows = [], seeds = []
let blocked = null, protocol
async function verifyEnvironment() {
  if (JSON.stringify(await treeHashes(join(repository, 'scripts/ai-authoring'))) !== JSON.stringify(sourceHashes)) throw new Error('Runner sources changed')
  for (const [file, hash] of Object.entries(artifactHashes)) if (digest(await readFile(join(repository, file))) !== hash) throw new Error(`Tool artifact changed: ${file}`)
}
try {
  console.log(JSON.stringify({ root, selectedSeeds: selection.seeds.length, mode: values.calibration ? 'calibration' : 'formal' }))
  for (const seed of selection.seeds) {
    const prepared = await prepareRepairSeed(seed, join(root, 'seeds'), browser, repository, values.presentation)
    prepared.repairPrompt = seed.prompt + '\n\nThis is one repair of an existing failed candidate, not a new implementation. Read diagnostics.json for source/target computed values, matched rule candidates, layers, ancestors and unresolved classes. Rules are not proven winners; replay values can differ from scored samples. Fix the failed checks and preserve unrelated behavior. There is one 120-second attempt and no follow-up repair.\nIndependent failed checks: ' + JSON.stringify(prepared.failedChecks)
    if (values.presentation === 'navigation') prepared.repairPrompt += '\nBoth presentations have the same frozen full evidence and read-only expansion helper. diagnostics.json may provide commands to expand properties; use them when useful. Do not edit .diagnostic-tools/, .diagnostic-evidence.json or diagnostic-reads.jsonl. Expansions describe the original failed snapshot, not your edited page.\n'
    prepared.promptHash = digest(prepared.repairPrompt)
    seeds.push(prepared)
  }
  const schedule = repairSchedule(seeds, models).slice(0, limit)
  if (schedule.length % 2) throw new Error('Calibration must contain complete presentation pairs')
  protocol = { version: 1, presentation: values.presentation, mode: values.calibration ? 'calibration' : 'formal', revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: repository }).trim(),
    source: resolve(values.source), sourceProtocolHash: selection.sourceProtocolHash, sourceObservationHash: selection.sourceObservationHash,
    client: execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim(), node: process.version, browser: browser.version(),
    browserHash: digest(await readFile(chromium.executablePath())), models, timeoutMs, concurrency, schedule, sourceHashes, artifactHashes, commonArgs: modelArguments,
    seeds: seeds.map(({ id, originalId, originalModel, task, originalAcceptanceHash, originalHashes, skill, inputHash, inputHashes, reportHashes, reportBytes, promptHash, failedChecks }) => ({ id, originalId, originalModel, task, originalAcceptanceHash, originalHashes, skill, inputHash, inputHashes, reportHashes, reportBytes, promptHash, failedChecks })),
    design: 'All failed first attempts from the selected campaign; initial task files and common repair prompt are byte-identical within seed/model pairs. Only diagnostics.json presentation differs; navigation runs give both arms the same frozen evidence and expansion helper. One repair, no follow-up. Report evidence captured once per seed; model attempts never see the other presentation or previous conversation. Filesystem reads are not a security boundary.' }
  protocol.hash = digest(JSON.stringify(protocol))
  await writeFile(join(root, 'protocol.json'), JSON.stringify(protocol, null, 2))
  await verifyEnvironment()
  console.log(JSON.stringify({ root, trials: schedule.length, prepared: seeds.length, reportBytes: seeds.map(seed => ({ seed: seed.id, ...seed.reportBytes })) }))
  let next = 0
  async function trial(item) {
    const seed = seeds.find(seed => seed.id === item.seed), folder = join(root, item.id), work = join(folder, 'work')
    await mkdir(folder)
    const input = await copyRepairInput(seed, work, item.arm)
    await writeFile(join(folder, 'input-hashes.json'), JSON.stringify(input, null, 2))
    const started = Date.now()
    const run = await invoke({ work, model: item.model, prompt: seed.repairPrompt, folder, attempt: 0, arm: 'skill-cli', common: modelArguments, cacheRoot, repository, timeoutMs })
    const protectedFiles = Object.keys(input.hashes).filter(file => file === 'node_modules' || file.startsWith('.agents/') || file.startsWith('.diagnostic-tools/') || file === '.diagnostic-evidence.json' || file.startsWith('source') || ['build.mjs', 'package.json', 'master-css.mjs'].includes(file))
    const after = await treeHashes(work)
    const violations = protectedFiles.filter(file => after[file] !== input.hashes[file])
    if (after['diagnostics.json'] !== input.reportHash) violations.push('diagnostics.json')
    let verdict
    try { verdict = await check(work, seed.task, browser, repository, run.answer, seed.baseline, { includeDiagnostics: false }) }
    catch (error) { verdict = { functional: false, styling: false, accessibility: false, browser: 'not-checked', invalidClasses: null, checks: [{ id: 'checker-error', pass: false, actual: error.message }] } }
    if (run.unavailable || run.hostSkillRead || violations.length || verdict.browser === 'not-checked' || verdict.colorComparison?.error) blocked = { id: item.id, reason: 'Execution isolation or checker failure', violations }
    let calls = []
    try { calls = (await readFile(join(work, 'bridge-calls.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse) } catch (error) { if (error.code !== 'ENOENT') throw error }
    const events = (await readFile(join(folder, 'attempt-0.events.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
    const reportRead = events.some(event => event.type === 'item.completed' && event.item?.type === 'command_execution' && event.item.exit_code === 0 && /diagnostics\.json/.test(event.item.command ?? '') && /"unresolvedClasses"|"properties"|"evidence"|"ancestors"/.test(event.item.aggregated_output ?? ''))
    let expansions = []
    try { expansions = (await readFile(join(work, 'diagnostic-reads.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse) } catch (error) { if (error.code !== 'ENOENT') throw error }
    const row = { ...item, task: seed.task, protocolHash: protocol.hash, inputHash: input.inputHash, reportHash: input.reportHash, promptHash: seed.promptHash,
      passed: passed(verdict) && !run.failed && !run.hostSkillRead && violations.length === 0, invalidClasses: verdict.invalidClasses,
      inputTokens: run.usage?.input_tokens ?? null, cachedInputTokens: run.usage?.cached_input_tokens ?? null, outputTokens: run.usage?.output_tokens ?? null,
      modelDurationMs: run.durationMs, durationMs: Date.now() - started, cliSuggestions: calls.length, cliErrors: calls.filter(call => call.status !== 0).length, reportRead,
      expansions, expansionCalls: expansions.length, expansionErrors: expansions.filter(call => !call.ok).length, expansionBytes: expansions.reduce((sum, call) => sum + (call.bytes ?? 0), 0),
      execution: { failed: run.failed, timedOut: run.timedOut, unavailable: run.unavailable, hostSkillRead: run.hostSkillRead, exit: run.exit }, violations }
    await writeFile(join(folder, 'acceptance.json'), JSON.stringify(verdict, null, 2))
    await cp(work, join(folder, 'final.work'), { recursive: true, verbatimSymlinks: true })
    await writeFile(join(root, item.id + '.result.json'), JSON.stringify(row, null, 2))
    rows.push(row)
    await verifyEnvironment()
    console.log(JSON.stringify({ completed: rows.length, total: schedule.length, id: item.id, passed: row.passed, reportRead, durationMs: row.durationMs }))
  }
  await Promise.all(Array.from({ length: concurrency }, async () => { while (!blocked && next < schedule.length) { const item = schedule[next++]; try { await trial(item) } catch (error) { blocked = { id: item.id, reason: error.message } } } }))
  if (!blocked) await writeFile(join(root, 'comparison.json'), JSON.stringify(compareRepairs(protocol, rows), null, 2))
} finally {
  await browser.close()
  await writeFile(join(root, 'observations.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + '\n')
  if (blocked) { await writeFile(join(root, 'blocked.json'), JSON.stringify(blocked, null, 2)); process.exitCode = 1 }
  console.log(JSON.stringify({ root, completed: rows.length, blocked }))
}
