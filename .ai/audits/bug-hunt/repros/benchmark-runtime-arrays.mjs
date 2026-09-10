import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const { createInteractionPage } = await import(pathToFileURL(resolve('shared/interaction-cost.ts')))
const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
const pages = []
for (const modeId of ['master-runtime', 'master-progressive']) {
  for (const strategy of ['baseline', 'defer-remove', 'suppress-remove-during-trace']) {
    pages.push({ modeId, strategy, ...await createInteractionPage({ fixtureId: 'dynamic', modeId, scenarioId: 'mutation-cleanup-cycle',
      variantId: `bh-0173-${modeId}-${strategy}`, runtimeDiagnostics: true, runtimeMutationStrategy: strategy }) })
  }
}
const failures = []
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch()
  try {
    for (const generated of pages) {
      const server = await startBrowserLifecycleServer(generated.root)
      const page = await browser.newPage()
      try {
        await page.goto(server.origin); await page.waitForFunction('globalThis.__benchmarkReady === true')
        for (const phase of ['single', 'repeated-and-empty']) {
          const actual = await page.evaluate((phase) => {
            const names = ['z:23601', 'z:23602', 'z:23603']
            const runtime = masterCSSRuntime, metrics = __interactionMetrics
            metrics.collectInteractionMutations = false
            runtime.deleteClassRules(names)
            resetRuntimeMutationDiagnostics(metrics)
            function presence() {
              const snapshot = runtime.snapshot()
              function selectors(rules) {
                return [...rules].flatMap(rule => [...('selectorText' in rule ? [rule.selectorText] : []), ...('cssRules' in rule ? selectors(rule.cssRules) : [])])
              }
              const native = selectors(document.getElementById('master-css').sheet.cssRules)
              return { snapshot: names.map(name => Boolean(snapshot.classRules[name]?.rules.length)), cssom: names.map(name => native.includes('.' + CSS.escape(name))) }
            }
            const before = presence()
            metrics.collectInteractionMutations = true
            if (phase === 'single') runtime.ensureClassRules(Object.freeze([...names]))
            else { runtime.ensureClassRules(Object.freeze([names[0], names[0], names[1], names[2]])); runtime.ensureClassRules(Object.freeze([])) }
            const ensured = presence()
            if (phase === 'single') runtime.deleteClassRules(Object.freeze([...names]))
            else {
              const first = [names[0], names[1]]; runtime.deleteClassRules(first); first.splice(0, first.length, 'z:29999')
              runtime.deleteClassRules(Object.freeze([names[1], names[2]])); runtime.deleteClassRules(Object.freeze([]))
            }
            const afterDelete = presence()
            metrics.collectInteractionMutations = false
            const flush = __flushRuntimeMutationStrategy('explicit-array-control')
            const afterFlush = presence()
            const repeatFlush = __flushRuntimeMutationStrategy('repeat-empty-control')
            const diagnostics = __readRuntimeMutationDiagnostics()
            runtime.ensureClassRules([names[0]]); runtime.deleteClassRules([names[0]])
            const outsideUncounted = JSON.stringify(diagnostics) === JSON.stringify(__readRuntimeMutationDiagnostics())
            runtime.deleteClassRules(names)
            return {before, ensured, afterDelete, afterFlush, flush, repeatFlush, outsideUncounted, diagnostics}
          }, phase)
          let pass = true
          try {
            const yes = [true, true, true], no = [false, false, false]
            assert.deepEqual(actual.before, { snapshot: no, cssom: no })
            assert.deepEqual(actual.ensured, { snapshot: yes, cssom: yes })
            const delayed = generated.strategy !== 'baseline'
            assert.deepEqual(actual.afterDelete, { snapshot: delayed ? yes : no, cssom: delayed ? yes : no })
            assert.deepEqual(actual.afterFlush, { snapshot: no, cssom: no })
            const entries = phase === 'single' ? 3 : 4
            assert.equal(actual.diagnostics.runtimeAddClassCount, entries)
            assert.equal(actual.diagnostics.runtimeRemoveClassCount, entries)
            assert.equal(actual.diagnostics.runtimeAddCallCount, phase === 'single' ? 1 : 2)
            assert.equal(actual.diagnostics.runtimeRemoveCallCount, phase === 'single' ? 1 : 3)
            assert.equal(actual.flush.flushed, delayed)
            assert.equal(actual.flush.classCount, delayed ? 3 : 0)
            assert.equal(actual.flush.callCount, delayed ? 1 : 0)
            assert.equal(actual.flush.queuedClassCountBeforeFlush, delayed ? entries : 0)
            assert.equal(actual.repeatFlush.flushed, false)
            assert.equal(actual.repeatFlush.classCount, 0)
            assert(actual.outsideUncounted)
          } catch (error) { pass = false; failures.push({engine, modeId: generated.modeId, strategy: generated.strategy, phase, message: error.message}) }
          console.log(JSON.stringify({engine, modeId: generated.modeId, strategy: generated.strategy, phase, ...actual, pass}))
        }
      } finally { await page.close(); await server.close() }
    }
  } finally { await browser.close() }
}
assert.deepEqual(failures, [])
