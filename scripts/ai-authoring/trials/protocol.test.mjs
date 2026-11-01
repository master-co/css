import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { profile, schedule, cliWrapper, bridgeInstructions, assertResume } from './protocol.mjs'
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
  for (const field of ['artifactHashes', 'harnessHashes', 'profile', 'tasks', 'arms', 'models', 'repeats', 'concurrency', 'commonArgs']) {
    assert.throws(() => assertResume(protocol, { ...protocol, [field]: 'changed' }), new RegExp(field))
  }
})
