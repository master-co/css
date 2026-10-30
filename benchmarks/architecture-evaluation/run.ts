import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve, isAbsolute, sep } from 'node:path'
import { chromium } from '@playwright/test'
import { arms, tasks, fixture, type Arm, type TaskId } from './fixtures'
import { check, digest, environment, masterCLI, tailwindCLI, mcpCLI, resultRoot, sourceHashes } from './acceptance'
import schema from './review.schema.json'

const writeJSON = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const readJSON = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const safeId = (value: string) => { assert.match(value ?? '', /^[a-z0-9][a-z0-9-]{0,79}$/); return value }
const workspacePath = (value: string) => {
  const path = resolve(value)
  assert(path.startsWith(resultRoot + sep), 'Trial path must be inside the results directory')
  assert(realpathSync(path).startsWith(realpathSync(resultRoot) + sep), 'Trial path resolves outside the results directory')
  return path
}

// Validates the deliberately small, closed JSON Schema subset used by this kit.
function validate(value: unknown, rule: any, path = '$'): void {
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  assert(rule.type === 'integer' ? Number.isInteger(value) : type === rule.type, `${path}: expected ${rule.type}`)
  if (rule.enum) assert(rule.enum.includes(value), `${path}: invalid enum`)
  if (rule.minimum !== undefined) assert(Number.isFinite(value) && Number(value) >= rule.minimum, `${path}: invalid number`)
  if (rule.minLength) assert(String(value).length >= rule.minLength, `${path}: empty string`)
  if (rule.type === 'array') (value as unknown[]).forEach((entry, index) => validate(entry, rule.items, `${path}[${index}]`))
  if (rule.type === 'object') {
    const object = value as Record<string, unknown>
    for (const key of rule.required ?? []) assert(Object.hasOwn(object, key), `${path}: missing ${key}`)
    for (const [key, entry] of Object.entries(object)) {
      assert(rule.properties[key] || rule.additionalProperties !== false, `${path}: unknown ${key}`)
      if (rule.properties[key]) validate(entry, rule.properties[key], `${path}.${key}`)
    }
  }
}

async function selftest() {
  const folder = resolve(resultRoot, 'controls', new Date().toISOString().replace(/[:.]/g, '-'))
  mkdirSync(folder, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const reports = []
  const starterFailures: Record<TaskId, string[]> = {
    'token-migration': ['brand-0', 'brand-1', 'old-token-removed'],
    'responsive-layout': ['cards-768', 'cards-1024'],
    'scoped-hover': ['danger-hover'],
    'dynamic-value': ['progress--20', 'progress-0', 'progress-63.5', 'progress-120'],
    'source-discovery': ['warning-background', 'warning-color'],
    'reduced-motion': ['pulse-reduce']
  }
  try {
    for (const arm of arms) for (const task of tasks) for (const solved of [false, true]) {
      const workspace = resolve(folder, arm, task.id, solved ? 'solution' : 'starter')
      mkdirSync(workspace, { recursive: true })
      for (const [name, contents] of Object.entries(fixture(arm, task.id, solved))) writeFileSync(resolve(workspace, name), contents)
      const report = await check(workspace, arm, task.id, browser)
      assert.equal(report.passed, solved, `${arm}/${task.id}: ${JSON.stringify(report.checks.filter(row => !row.pass))}`)
      assert.deepEqual(report.checks.filter(row => !row.pass).map(row => row.id), solved ? [] : starterFailures[task.id])
      reports.push({ arm, task: task.id, solved, checks: report.checks.length, expectedOutcome: true })
      console.log(`${arm}/${task.id}/${solved ? 'solution passes' : 'starter rejected'}`)
    }
    validate({ status: 'completed', reviewSeconds: 1, repairIterations: 0, toolCalls: 1, findings: [], visualReview: 'pass', transcript: 'control-only', notes: '' }, schema)
    assert.throws(() => validate({ status: 'completed' }, schema))
    writeJSON(resolve(folder, 'controls.json'), { kind: 'deterministic-controls-not-model-results', environment: environment(), reports })
    console.log(`48 controls checked; no model trials performed. ${folder}`)
  } finally { await browser.close() }
}

const [command, ...args] = process.argv.slice(2)
if (command === 'selftest') await selftest()
else if (command === 'init') {
  const folder = resolve(resultRoot, safeId(args[0]))
  mkdirSync(folder, { recursive: true })
  workspacePath(folder)
  writeJSON(resolve(folder, 'protocol.json'), {
    version: 1, model: { provider: '', id: '', revision: '', harness: '', settings: {} },
    repeats: 3, maxSeconds: 900, maxToolCalls: 60,
    contextPolicy: 'Fresh session per trial; identical pinned documentation access; no solution/control access; no learning from previous trials.',
    reviewer: '', documentationRevision: '', environment: environment()
  })
  console.log(`Fill model, reviewer and documentationRevision before preparing trials: ${folder}/protocol.json`)
} else if (command === 'prepare') {
  const [experiment, armInput, taskInput, repetition] = args
  const folder = workspacePath(resolve(resultRoot, safeId(experiment)))
  const protocol = readJSON(resolve(folder, 'protocol.json'))
  for (const key of ['provider', 'id', 'revision', 'harness']) assert(protocol.model[key]?.trim(), `Set model.${key}`)
  assert(protocol.reviewer?.trim() && protocol.documentationRevision?.trim(), 'Pin reviewer and documentationRevision')
  assert(Number.isInteger(protocol.repeats) && protocol.repeats >= 3)
  assert(Number.isFinite(protocol.maxSeconds) && protocol.maxSeconds > 0)
  assert(Number.isInteger(protocol.maxToolCalls) && protocol.maxToolCalls > 0)
  const arm = arms.find(value => value === armInput)!
  const task = tasks.find(value => value.id === taskInput)!
  const repeat = Number(repetition)
  assert(arm && task && Number.isInteger(repeat) && repeat >= 1 && repeat <= protocol.repeats, 'Use a listed arm/task and a protocol repetition')
  const workspace = resolve(folder, `${arm}-${task.id}-${repeat}`)
  assert(!existsSync(workspace), 'Trial already exists; use a new experiment ID instead of overwriting evidence')
  mkdirSync(workspace)
  for (const [name, contents] of Object.entries(fixture(arm, task.id))) writeFileSync(resolve(workspace, name), contents)
  writeJSON(resolve(workspace, 'trial.json'), { version: 1, arm, task: task.id, repeat, protocol, protocolSHA256: digest(JSON.stringify(protocol)), initialSourceHashes: sourceHashes(workspace) })
  const buildCommand = arm === 'native-css' ? 'cp input.css output.css' : arm === 'tailwind'
    ? `${process.execPath} ${tailwindCLI} -i input.css -o output.css`
    : `${process.execPath} ${masterCLI} generate index.html app.js -o output.css -v 0 --strict`
  writeFileSync(resolve(workspace, 'PROMPT.md'), `${task.prompt}\n\nThis is a second change to a working fixture. Edit only index.html, input.css, app.js. Preserve all unrelated behavior. Do not edit output.css or evaluator metadata. Use the existing arm's authoring idiom. No new dependencies, network assets, browser CSS compiler, or evaluator/solution access.\n\nBudget: ${protocol.maxSeconds} seconds, ${protocol.maxToolCalls} tool calls. Stop and report if blocked.\n\nBuild: ${buildCommand}\n${arm === 'master-mcp' ? 'The local Master MCP is enabled in addition to CLI.' : 'Do not use Master MCP.'}\n`)
  if (arm === 'master-mcp') writeJSON(resolve(workspace, 'mcp.json'), { mcpServers: { mastercss: { command: process.execPath, args: [mcpCLI, '--root', workspace] } } })
  writeJSON(resolve(workspace, 'review.template.json'), { status: 'completed', reviewSeconds: null, repairIterations: null, toolCalls: null, findings: [], visualReview: 'not-reviewed', transcript: '', notes: '' })
  console.log(workspace)
} else if (command === 'start') {
  const workspace = workspacePath(args[0])
  const trial = readJSON(resolve(workspace, 'trial.json'))
  assert.deepEqual(sourceHashes(workspace), trial.initialSourceHashes, 'Starter was edited before the clock started')
  writeJSON(resolve(workspace, 'started.json'), { startedAt: new Date().toISOString() })
} else if (command === 'check' || command === 'record') {
  const workspace = workspacePath(args[0])
  const trial = readJSON(resolve(workspace, 'trial.json')) as { arm: Arm, task: TaskId, protocol: any }
  let acceptance: Awaited<ReturnType<typeof check>> | { passed: false, checks: [], error: string, sourceHashes: ReturnType<typeof sourceHashes> }
  try { acceptance = await check(workspace, trial.arm, trial.task) }
  catch (error) {
    if (command === 'check') throw error
    acceptance = { passed: false, checks: [], error: error instanceof Error ? error.message : String(error), sourceHashes: sourceHashes(workspace, true) }
  }
  if (command === 'check') {
    console.log(JSON.stringify({ passed: acceptance.passed, failed: acceptance.checks.filter(row => !row.pass) }, null, 2))
    if (!acceptance.passed) process.exitCode = 1
  } else {
    const review = readJSON(resolve(args[1]))
    validate(review, schema)
    const transcript = isAbsolute(review.transcript) ? review.transcript : resolve(workspace, review.transcript)
    assert(existsSync(transcript), 'The saved agent/tool transcript is required')
    const { startedAt } = readJSON(resolve(workspace, 'started.json'))
    const finishedAt = new Date().toISOString()
    const elapsedSeconds = (Date.parse(finishedAt) - Date.parse(startedAt)) / 1000
    assert(elapsedSeconds >= review.reviewSeconds, 'Review time exceeds total elapsed time')
    const adjudicated = review.findings.filter((finding: any) => ['agent', 'cli', 'mcp'].includes(finding.source) && finding.verdict !== 'unresolved')
    const falsePositives = adjudicated.filter((finding: any) => finding.verdict === 'false-positive').length
    const withinBudget = elapsedSeconds <= trial.protocol.maxSeconds && review.toolCalls <= trial.protocol.maxToolCalls
    const finalEnvironment = environment()
    const environmentChanged = JSON.stringify(finalEnvironment) !== JSON.stringify(trial.protocol.environment)
    writeJSON(resolve(workspace, 'result.json'), {
      kind: 'model-trial', ...trial, startedAt, finishedAt, elapsedSeconds, withinBudget, review,
      diagnosticFalseDiscoveryRate: adjudicated.length ? falsePositives / adjudicated.length : null,
      accepted: review.status === 'completed' && withinBudget && !environmentChanged && acceptance.passed && review.visualReview === 'pass',
      acceptance, transcriptSHA256: digest(readFileSync(transcript)), finalEnvironment, environmentChanged
    })
    console.log(resolve(workspace, 'result.json'))
  }
} else {
  console.log('Commands: init <experiment> | prepare <experiment> <arm> <task> <repeat> | start <trial-path> | check <trial-path> | record <trial-path> <review.json> | selftest')
  console.log(JSON.stringify({ arms, tasks }, null, 2))
  if (command) process.exitCode = 1
}
