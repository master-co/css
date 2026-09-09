import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const load = path => import(pathToFileURL(resolve(path)).href)
const { createInteractionPage } = await load('shared/interaction-cost.ts')
const { startBrowserLifecycleServer } = await load('shared/browser-lifecycle-server.ts')
const { forceRetainedCleanup, preseedRuntimeTempRules, seedRetainedRuntimeRules, pauseRuntimeObserver } = await load('shared/runtime-preparation.ts')
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
 const browser = await launcher.launch()
 try {
  for (const modeId of ['master-runtime', 'master-progressive']) {
   const generated = await createInteractionPage({ fixtureId: 'dynamic', modeId, scenarioId: 'existing-class-toggle', variantId: `bh-0171-${modeId}`, runtimeDiagnostics: true })
   const server = await startBrowserLifecycleServer(generated.root)
   const page = await browser.newPage()
   try {
    await page.goto(server.origin); await page.waitForFunction('window.__benchmarkReady === true')
    const before = await page.evaluate('__readBenchmarkRuntimeSnapshot().runtimeGeneratedRuleCount')
    const seeded = await preseedRuntimeTempRules(page)
    const after = await page.evaluate(`({count: __readBenchmarkRuntimeSnapshot().runtimeGeneratedRuleCount, names: __interactionConfig.classes.temp.filter(name => masterCSSRuntime.snapshot().classRules[name]?.rules.length)})`)
    assert.equal(after.names.length, 2)
    assert.equal(seeded, after.count - before)
    assert(seeded >= 2)
    assert.equal(await preseedRuntimeTempRules(page), 0)
    console.log(JSON.stringify({ engine, modeId, phase: 'preseed', rules: seeded, classes: after.names, repeatDelta: 0, pass: true }))
    for (const volume of [0, 2, 128, 512]) {
     await page.evaluate('Object.assign(__interactionMetrics, {collectInteractionMutations: true, retainedSetAddCount: 0, retainedSetDeleteCount: 0, retainedSetClearCount: 0})')
     const seed = await seedRetainedRuntimeRules(page, volume)
     const before = await page.evaluate('({...__readInteractionState(), metrics: {adds: __interactionMetrics.retainedSetAddCount, deletes: __interactionMetrics.retainedSetDeleteCount}})')
     assert.equal(seed.classCount, volume)
     assert.equal(seed.ruleCount, volume)
     assert.equal(before.metrics.adds, volume)
     assert.equal(before.retainedClassNames.length, volume)
     assert.equal(seed.rawBytes, before.retainedClassRawBytes)
     await page.evaluate('__interactionMetrics.collectInteractionMutations = false')
     const cleaned = await forceRetainedCleanup(page)
     assert.equal(cleaned.beforeRetainedClassCount, cleaned.removedClassCount)
     assert.equal(cleaned.afterRetainedClassCount, 0)
     assert.equal(await page.evaluate('__readInteractionState().retainedClassNames.length'), 0)
     console.log(JSON.stringify({ engine, modeId, phase: 'volume', volume, seed, operationCounts: before.metrics, cleaned, pass: true }))
    }
    await page.evaluate(`(() => {
      masterCSSRuntime.ensureClassRules(['z:29991']);
      window.__independentObserverCount = 0;
      window.__independentObserver = new MutationObserver(() => {window.__independentObserverCount++;});
      window.__independentObserver.observe(document.body, {childList: true});
    })()`)
    assert.equal(await pauseRuntimeObserver(page), 1)
    const paused = await page.evaluate(`(async () => {
      const element = document.createElement('div'); element.className = 'z:29991'; document.body.append(element);
      for (let i=0;i<3;i++) await new Promise(resolve => requestAnimationFrame(resolve));
      const result = { count: masterCSSRuntime.snapshot().usageCounts['z:29991'] || 0, zIndex: getComputedStyle(element).zIndex, independentObserverCount: window.__independentObserverCount };
      element.remove(); window.__independentObserver.disconnect();
      __interactionMetrics.collectInteractionMutations = true; __interactionMetrics.retainedSetClearCount = 0;
      masterCSSRuntime.disconnect(); result.clears = __interactionMetrics.retainedSetClearCount;
      return result;
    })()`)
    assert.equal(paused.count, 0)
    assert.equal(paused.zIndex, '29991')
    assert(paused.independentObserverCount > 0)
    assert.equal(paused.clears, 1)
    console.log(JSON.stringify({ engine, modeId, phase: 'observer', ...paused, pass: true }))
   } finally { await page.close(); await server.close() }
  }
 } finally { await browser.close() }
}
