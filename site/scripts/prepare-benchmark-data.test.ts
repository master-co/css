import './bundler-imports'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { benchmarkSuites, prepareBenchmarkData, projectBenchmarkSnapshot, readBenchmarkSnapshots } from './prepare-benchmark-data'

test('drops raw lifecycle measurements while preserving all displayed counts', async () => {
  const snapshots = await readBenchmarkSnapshots()
  const source = snapshots['browser-lifecycle']
  const compact = projectBenchmarkSnapshot('browser-lifecycle', source)
  assert.equal(compact.variantCount, source.variants.length)
  assert.equal(compact.scenarioCount, source.scenarios.length)
  assert.equal(compact.modeCount, source.modes.length)
  assert.deepEqual(compact.browser, source.browser)
  assert.ok(JSON.stringify(compact).length < JSON.stringify(source).length / 100)
})

test('preparation preserves mtimes for unchanged outputs and refreshes changed evidence', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'site-benchmark-data-'))
  const site = path.join(temporary, 'site')
  try {
    await mkdir(site)
    const snapshots = await readBenchmarkSnapshots()
    for (const suite of benchmarkSuites) {
      const file = suite === 'long-session-evidence' ? 'browser-lifecycle/long-session-evidence.json' : `${suite}/snapshot.json`
      const target = path.join(temporary, 'benchmarks', file)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, JSON.stringify(snapshots[suite]))
    }
    await prepareBenchmarkData(site)
    const target = path.join(site, '.generated/benchmarks/browser-lifecycle.json')
    const before = (await stat(target)).mtimeMs
    await prepareBenchmarkData(site)
    assert.equal((await stat(target)).mtimeMs, before)
    snapshots['browser-lifecycle'].variants.push({ id: 'new-variant' })
    await writeFile(path.join(temporary, 'benchmarks/browser-lifecycle/snapshot.json'), JSON.stringify(snapshots['browser-lifecycle']))
    await prepareBenchmarkData(site)
    assert.equal(JSON.parse(await readFile(target, 'utf8')).variantCount, snapshots['browser-lifecycle'].variants.length)
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
