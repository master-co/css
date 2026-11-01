import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { profile, schedule, cliWrapper, bridgeInstructions, assertResume, usesCLI, repairFeedback } from './protocol.mjs'
import { compare } from './compare.mjs'

test('pilot has complete balanced pairs and leaves the original campaign at 240 trials', () => {
  const models = ['gpt-6.1-sol', 'gpt-6-luna']
  const pilot = schedule(profile('bridge-pilot'), models)
  assert.equal(pilot.length, 32)
  assert.equal(new Set(pilot.map(row => row.id)).size, 32)
  assert.equal(pilot[0].arm, 'skill-cli')
  assert.equal(pilot[16].arm, 'skill-mcp-bridge')
  assert.equal(pilot[0].model, models[0])
  assert.equal(pilot[16].model, models[1])
  assert.equal(schedule(profile(), models).length, 240)
  assert.throws(() => profile('typo'), /Unknown profile/)
  assert.match(bridgeInstructions('skill-cli', true), /node master-css.mjs suggest/)
  assert.match(bridgeInstructions('skill-mcp-bridge', true), /CLI suggestion command is disabled/)
})

test('wrapper records real stdin calls and failures, and prevents suggestions in the MCP arm', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-bridge-wrapper-'))
  try {
    const binary = join(root, 'fake-cli.mjs')
    await writeFile(binary, 'import fs from \'node:fs\'; console.log(fs.readFileSync(0,\'utf8\')); process.exit(process.argv.includes(\'--fail\')?1:0)')
    const wrapper = join(root, 'master-css.mjs')
    await writeFile(wrapper, cliWrapper(binary, true))
    for (const fail of [false, true]) {
      const result = spawnSync(process.execPath, [wrapper, 'suggest', '--stdin', ...(fail ? ['--fail'] : [])], { encoding: 'utf8', input: 'display:flex;' })
      assert.equal(result.status, Number(fail))
      assert.equal(result.stdout.trim(), 'display:flex;')
    }
    const log = await readFile(join(root, 'bridge-calls.jsonl'), 'utf8')
    assert.deepEqual(log.trim().split('\n').map(line => JSON.parse(line).status), [0, 1])
    const help = spawnSync(process.execPath, [wrapper, 'suggest', '--help'], { encoding: 'utf8', input: '' })
    assert.equal(help.status, 0)
    assert.equal(await readFile(join(root, 'bridge-calls.jsonl'), 'utf8'), log)
    await writeFile(wrapper, cliWrapper(binary, false))
    const blocked = spawnSync(process.execPath, [wrapper, 'suggest'], { encoding: 'utf8' })
    assert.equal(blocked.status, 1)
    assert.match(blocked.stderr, /disabled/)
    assert.equal(await readFile(join(root, 'bridge-calls.jsonl'), 'utf8'), log)
  } finally { await rm(root, { recursive: true, force: true }) }
})

const protocol = {
  profile: 'bridge-pilot', tasks: ['settings-card'], arms: ['skill-cli', 'skill-mcp-bridge'],
  models: ['model'], repeats: 1, revision: 'commit', corpusHash: 'corpus', clientVersion: 'client', toolVersion: 'tool'
}
const rows = protocol.arms.map(arm => ({
  task: 'settings-card', arm, model: 'model', client: 'client', fixtureRevision: 'commit:corpus', toolVersion: 'tool', repeat: 0,
  repairRounds: 0, toolCalls: 2, inputTokens: 100, cachedInputTokens: 60, outputTokens: 10, invalidClasses: 0,
  durationMs: 2000, modelDurationMs: 1000, functional: true, styling: true, accessibility: true, browser: 'passed',
  mcpCalls: arm === 'skill-cli' ? 0 : 2, mcpErrors: 0, bridgeCalls: { cli: arm === 'skill-cli' ? 1 : 0, cliErrors: 0, mcp: arm === 'skill-cli' ? 0 : 1 }
}))

test('comparison reports paired failures, cache hits and model time without dropping failed rows', () => {
  const report = compare(protocol, [rows[0], { ...rows[1], functional: false, repairRounds: 2, inputTokens: 300 }])
  assert.deepEqual(report.pairs, { cliWins: 1, mcpWins: 0, bothPass: 0, bothFail: 0 })
  assert.equal(report.arms['skill-mcp-bridge'].inputTokens, 300)
  assert.equal(report.arms['skill-mcp-bridge'].passed, 0)
  assert.equal(report.arms['skill-cli'].cachedInputTokens, 60)
  assert.equal(report.arms['skill-cli'].medianModelDurationMs, 1000)
  assert.equal(report.failures.length, 1)
})

test('comparison rejects missing pairs, mixed versions, missing metrics and crossed tools', () => {
  assert.throws(() => compare(protocol, [rows[0]]), /Incomplete/)
  assert.throws(() => compare(protocol, [rows[0], rows[0]]), /Duplicate/)
  for (const patch of [{ client: 'other' }, { cachedInputTokens: null }, { inputTokens: null }, { cachedInputTokens: 101 }, { mcpCalls: 1 }]) {
    assert.throws(() => compare(protocol, [{ ...rows[0], ...patch }, rows[1]]))
  }
})

test('resume rejects changed tools, selection, concurrency and model identifiers', () => {
  assert.doesNotThrow(() => assertResume(protocol, { ...protocol }))
  for (const field of ['artifactHashes', 'harnessHashes', 'profile', 'tasks', 'arms', 'models', 'repeats', 'concurrency', 'commonArgs', 'skillVariants', 'feedbackModes']) {
    assert.throws(() => assertResume(protocol, { ...protocol, [field]: 'changed' }), new RegExp(field))
  }
})

test('diagnostic pilot changes only repair evidence and rejects crossed modes or skills', () => {
  const selection = profile('diagnostics-pilot')
  assert.equal(schedule(selection, ['gpt-6.1-sol', 'gpt-6-luna']).length, 16)
  assert.equal(selection.skillRevisions[selection.arms[0]], selection.skillRevisions[selection.arms[1]])
  assert.equal(bridgeInstructions(selection.arms[0], true), bridgeInstructions(selection.arms[1], true))
  assert.doesNotMatch(repairFeedback([{ pass: false }], 'checks'), /diagnostics/)
  assert.match(repairFeedback([{ pass: false }], 'browser-evidence'), /Read diagnostics.json/)
  const diagnosticProtocol = { ...protocol, profile: selection.name, arms: selection.arms, feedbackModes: selection.feedbackModes,
    skillVariants: Object.fromEntries(selection.arms.map(arm => [arm, { revision: 'same', files: { 'SKILL.md': 'hash' } }])) }
  const runs = selection.arms.map(arm => ({ ...rows[0], arm, skillRevision: 'same', feedbackMode: selection.feedbackModes[arm],
    firstAttemptInputTokens: 90, firstAttemptCachedInputTokens: 50, firstAttemptOutputTokens: 9, firstAttemptModelDurationMs: 500,
    repairRounds: 1, functional: arm.endsWith('b') }))
  const report = compare(diagnosticProtocol, runs)
  assert.deepEqual(report.pairs, { checksWins: 0, evidenceWins: 1, bothPass: 0, bothFail: 0 })
  assert.equal(report.arms['skill-diagnostics-b'].repairInputTokens, 10)
  assert.equal(report.arms['skill-diagnostics-b'].repairedTrialsPassed, 1)
  assert.throws(() => compare(diagnosticProtocol, [{ ...runs[0], feedbackMode: 'browser-evidence' }, runs[1]]), /feedback mode/)
  assert.throws(() => compare({ ...diagnosticProtocol, skillVariants: { ...diagnosticProtocol.skillVariants, [selection.arms[0]]: { revision: 'other' } } }, runs), /identical skills/)
})

test('import pilot pairs two immutable skill revisions with identical CLI instructions', () => {
  const selection = profile('skill-import-pilot')
  const trials = schedule(selection, ['gpt-6.1-sol', 'gpt-6-luna'])
  assert.equal(trials.length, 16)
  assert.equal(new Set(trials.map(row => row.id)).size, 16)
  assert.deepEqual(selection.tasks.map(task => task.id), ['tailwind-card', 'tailwind-hover'])
  assert.ok(selection.arms.every(usesCLI))
  assert.notEqual(...selection.arms.map(arm => selection.skillRevisions[arm]))
  assert.equal(bridgeInstructions(selection.arms[0], true), bridgeInstructions(selection.arms[1], true))
})

test('import comparison retains first-attempt costs, skill identity and paired failures', () => {
  const importProtocol = { ...protocol, profile: 'skill-import-pilot', arms: ['skill-import-a', 'skill-import-b'], skillVariants: {
    'skill-import-a': { revision: 'before' }, 'skill-import-b': { revision: 'after' }
  } }
  const runs = importProtocol.arms.map((arm, i) => ({ ...rows[i], arm, skillRevision: i ? 'after' : 'before', mcpCalls: 0,
    bridgeCalls: { cli: 1, cliErrors: 0, mcp: 0 }, firstAttemptInputTokens: 90, firstAttemptCachedInputTokens: 50,
    firstAttemptOutputTokens: 9, firstAttemptModelDurationMs: 500, functional: Boolean(i)
  }))
  const report = compare(importProtocol, runs)
  assert.deepEqual(report.pairs, { beforeWins: 0, afterWins: 1, bothPass: 0, bothFail: 0 })
  assert.equal(report.arms['skill-import-a'].firstAttemptInputTokens, 90)
  assert.equal(report.arms['skill-import-b'].medianFirstAttemptModelDurationMs, 500)
  for (const patch of [{ skillRevision: 'other' }, { firstAttemptInputTokens: null }, { firstAttemptInputTokens: 101 }, { firstAttemptCachedInputTokens: 91 }, { mcpCalls: 1 }]) {
    assert.throws(() => compare(importProtocol, [{ ...runs[0], ...patch }, runs[1]]))
  }
  assert.throws(() => compare({ ...importProtocol, arms: ['skill-import-a'] }, [runs[0]]), /Unexpected pilot arms/)
})
