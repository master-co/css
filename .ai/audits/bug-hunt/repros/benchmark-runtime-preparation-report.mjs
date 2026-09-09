import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Run the original entrypoint and retained payload checks before inspecting its
// actual diagnostic artifacts. The isolated wrapper removes all report output.
await import('./benchmark-runtime-report.mjs')
const suite = process.argv[2]
assert(['runtime-mutation-diagnostics', 'runtime-style-invalidation-diagnostics'].includes(suite))
const report = JSON.parse(await readFile(`.results/${suite}/report.json`, 'utf8'))
const artifacts = report.artifacts.filter(({ path }) => path.endsWith('/diagnostics.json'))
assert.equal(artifacts.length, suite === 'runtime-mutation-diagnostics' ? 16 : 32)
for (const artifact of artifacts) {
  const result = JSON.parse(await readFile(resolve('..', artifact.path), 'utf8'))
  const id = result.variant?.id || artifact.path.split('/artifacts/')[1].split('/')[0]
  const pageArtifact = report.artifacts.find(({ path }) => path.endsWith(`/pages/${id}/index.html`))
  assert(pageArtifact, id)
  const html = await readFile(resolve('..', pageArtifact.path), 'utf8')
  const configSource = html.match(/window\.__interactionConfig = (\{[^\n]+\});/)
  assert(configSource, id)
  const temporary = JSON.parse(configSource[1]).classes.temp
  assert(temporary.length > 0, id)
  const cleanup = result.forcedRetainedCleanup
  assert.equal(cleanup.beforeRetainedClassCount, result.afterFlushState.retainedClassNames.length, id)
  assert.equal(cleanup.removedClassCount, cleanup.beforeRetainedClassCount, id)
  assert.equal(cleanup.afterRetainedClassCount, 0, id)
  assert.equal(result.afterForcedCleanupState.retainedClassNames.length, 0, id)
  assert(!temporary.some((name) => result.afterForcedCleanupState.retainedClassNames.includes(name)), id)
  if (!result.variant) assert(!temporary.some((name) => result.afterForcedCleanupState.classUtilityNames.includes(name)), id)
  if (suite === 'runtime-style-invalidation-diagnostics') {
    assert.equal(result.afterForcedCleanupState.runtimeStyleRawBytes, result.afterForcedCleanupState.runtimeStyleTextBytes, id)
  }
  const preseed = result.preparation?.preseededRuntimeRuleCount ?? result.preseededRuntimeRuleCount
  const wantsPreseed = result.variant?.preseedTempRules ?? (result.ruleStateId === 'preseed-temp-rules')
  if (wantsPreseed) {
    assert(preseed >= 2, id)
    assert(temporary.every((name) => result.beforeState.classUtilityNames.includes(name)), id)
  } else assert.equal(preseed, 0, id)
  const expectedSamples = {
    'preseeded-runtime-rule-count': preseed,
    'retained-cleanup-removed-class-count': cleanup.removedClassCount,
    'retained-cleanup-duration-ms': cleanup.durationMs
  }
  if (result.variant) {
    const { retainedVolume, pauseObserver, kind } = result.variant
    const prep = result.preparation
    assert.equal(prep.seededRetainedClassCount, retainedVolume, id)
    assert.equal(prep.seededRetainedRuleCount, retainedVolume, id)
    assert.equal(prep.seededRetainedRawBytes, retainedVolume * 24, id)
    assert.equal(prep.observerPaused, Number(pauseObserver), id)
    Object.assign(expectedSamples, {
      'seeded-retained-class-count': prep.seededRetainedClassCount,
      'seeded-retained-rule-count': prep.seededRetainedRuleCount,
      'seeded-retained-raw-bytes': prep.seededRetainedRawBytes,
      'observer-paused': prep.observerPaused,
      'retained-set-add-count': result.runtimeDiagnostics.retainedSetAddCount,
      'retained-set-delete-count': result.runtimeDiagnostics.retainedSetDeleteCount,
      'retained-set-clear-count': result.runtimeDiagnostics.retainedSetClearCount
    })
    const seeded = result.beforeState.retainedClassNames.filter((name) => /^z:10\d{3}$/.test(name))
    assert.equal(seeded.length, retainedVolume, id)
    if (kind === 'runtime-baseline') assert(result.runtimeDiagnostics.retainedSetAddCount > 0, id)
    if (pauseObserver || kind === 'runtime-style-idle') assert.equal(result.runtimeDiagnostics.retainedSetAddCount, 0, id)
  }
  for (const [metricId, value] of Object.entries(expectedSamples)) {
    assert.deepEqual(report.samples.filter((sample) => sample.variantId === id && sample.metricId === metricId).map((sample) => sample.value), [value], `${id}/${metricId}`)
    assert.equal(report.summary.find((entry) => entry.variantId === id && entry.metricId === metricId).median, value, `${id}/${metricId}`)
  }
  assert(!result.consoleWarnings.some((warning) => /wasm.*(mime|streaming)|(mime|streaming).*wasm/i.test(warning)), id)
  console.log(JSON.stringify({ preparationArtifact: id, temporary, preseed, preparation: result.preparation,
    retainedBefore: result.beforeState.retainedClassNames.length,
    retainedAfterProductSettle: result.afterFlushState.retainedClassNames.length,
    retainedSetAdds: result.runtimeDiagnostics.retainedSetAddCount,
    cleanup, pass: true }))
}
console.log(JSON.stringify({ suite, preparationArtifacts: artifacts.length, pass: true }))
