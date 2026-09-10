import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const { createInteractionPage } = await import(pathToFileURL(resolve('shared/interaction-cost.ts')))
const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
const { seedRetainedRuntimeRules, forceRetainedCleanup } = await import(pathToFileURL(resolve('shared/runtime-preparation.ts')))
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
const pages = []
for (const modeId of ['master-runtime', 'master-progressive']) for (const strategy of ['baseline', 'defer-remove', 'suppress-remove-during-trace']) {
  pages.push({modeId, strategy, ...await createInteractionPage({fixtureId:'dynamic',modeId,scenarioId:'mutation-cleanup-cycle',
    variantId:`bh-0173-scenario-${modeId}-${strategy}`,runtimeDiagnostics:true,runtimeMutationStrategy:strategy})})
}
for (const [engine, launcher] of Object.entries({chromium, firefox, webkit})) {
  const browser = await launcher.launch()
  try {
    for (const generated of pages) for (const retainedVolume of [0, 512]) {
      const server = await startBrowserLifecycleServer(generated.root)
      const page = await browser.newPage()
      try {
        await page.goto(server.origin); await page.waitForFunction('globalThis.__benchmarkReady === true')
        if (retainedVolume) assert.equal((await seedRetainedRuntimeRules(page,retainedVolume)).classCount,retainedVolume)
        const observed = await page.evaluate(async (retainedVolume) => {
          const requests = []
          const prototype = MasterCSSRuntime.prototype
          for (const method of ['ensureClassRules','deleteClassRules']) {
            const original = prototype[method]
            prototype[method] = function(names) {
              if (__interactionMetrics.collectInteractionMutations) requests.push({method,array:Array.isArray(names),names:[...names]})
              return original.call(this,names)
            }
          }
          await __runInteractionScenario()
          const scenarioDiagnostics = __readRuntimeMutationDiagnostics()
          const scenarioRequestCount = requests.length
          const scenarioDeleteRequests = requests.filter(request=>request.method==='deleteClassRules').length
          let extendedObservationMs = 0, extendedFlush = null
          // Some hosts use the runtime's existing 5s timer instead of an idle
          // callback. Observe that real callback separately from the original
          // scenario window; do not change the benchmark's measured duration.
          if (retainedVolume && !scenarioDeleteRequests) {
            const started = performance.now()
            __interactionMetrics.collectInteractionMutations = true
            while (!requests.some(request=>request.method==='deleteClassRules') && performance.now()-started<8000) {
              await new Promise(resolve=>setTimeout(resolve,20))
            }
            if (__interactionMetrics.runtimeMutationStrategyId==='defer-remove') extendedFlush=__flushRuntimeMutationStrategy('extended-observation-control')
            __interactionMetrics.collectInteractionMutations = false
            extendedObservationMs = performance.now()-started
          }
          const diagnostics = __readRuntimeMutationDiagnostics()
          await __waitInteractionFrames(3)
          const snapshot = masterCSSRuntime.snapshot()
          const temporary = __interactionConfig.classes.temp
          const requested = [...new Set(requests.filter(request=>request.method==='deleteClassRules').flatMap(request=>request.names))]
          function remaining() {
            const state = masterCSSRuntime.snapshot()
            function selectors(rules) { return [...rules].flatMap(rule=>[...('selectorText' in rule?[rule.selectorText]:[]),...('cssRules' in rule?selectors(rule.cssRules):[])]) }
            const native = new Set(selectors(document.getElementById('master-css').sheet.cssRules))
            return {snapshot:requested.filter(name=>state.classRules[name]?.rules.length).length,cssom:requested.filter(name=>native.has('.'+CSS.escape(name))).length}
          }
          const beforeExplicitFlush = remaining()
          const afterTraceFlush = __flushRuntimeMutationStrategy('independent-after-trace')
          const afterExplicitFlush = remaining()
          return {requests:requests.map(request=>({method:request.method,array:request.array,classCount:request.names.length,first:request.names.slice(0,3),last:request.names.slice(-3)})),
            diagnostics,scenarioDiagnostics,scenarioRequestCount,scenarioDeleteRequests,extendedObservationMs,extendedFlush,
            idleCallbackAvailable:typeof requestIdleCallback==='function',temporary,usageCounts:temporary.map(name=>snapshot.usageCounts[name]||0),
            scratchChildren:document.getElementById('interaction-scratch').children.length,
            retained:temporary.filter(name=>snapshot.classRules[name]?.retained),
            requestedUnique:requested.length,beforeExplicitFlush,afterExplicitFlush,afterTraceFlush}
        },retainedVolume)
        console.log(JSON.stringify({arrayScenarioObservation:true,engine,modeId:generated.modeId,strategy:generated.strategy,retainedVolume,...observed}))
        assert(observed.requests.every(request=>request.array))
        const adds = observed.requests.filter(request=>request.method==='ensureClassRules')
        const removes = observed.requests.filter(request=>request.method==='deleteClassRules')
        assert.equal(observed.diagnostics.runtimeAddCallCount,adds.length)
        assert.equal(observed.diagnostics.runtimeRemoveCallCount,removes.length)
        assert.equal(observed.diagnostics.runtimeAddClassCount,adds.reduce((n,request)=>n+request.classCount,0))
        assert.equal(observed.diagnostics.runtimeRemoveClassCount,removes.reduce((n,request)=>n+request.classCount,0))
        const scenarioRequests = observed.requests.slice(0,observed.scenarioRequestCount)
        for (const [method,calls,entries] of [['ensureClassRules','runtimeAddCallCount','runtimeAddClassCount'],['deleteClassRules','runtimeRemoveCallCount','runtimeRemoveClassCount']]) {
          const originalWindow = scenarioRequests.filter(request=>request.method===method)
          assert.equal(observed.scenarioDiagnostics[calls],originalWindow.length)
          assert.equal(observed.scenarioDiagnostics[entries],originalWindow.reduce((n,request)=>n+request.classCount,0))
        }
        assert(adds.length>0)
        assert.equal(observed.scratchChildren,0)
        assert(observed.usageCounts.every(count=>count===0))
        if (retainedVolume) {
          assert(removes.length>0)
          assert(observed.requestedUnique>3)
          const deferred = generated.strategy==='suppress-remove-during-trace' ? observed.requestedUnique : 0
          assert.deepEqual(observed.beforeExplicitFlush,{snapshot:deferred,cssom:deferred})
        }
        assert.deepEqual(observed.afterExplicitFlush,{snapshot:0,cssom:0})
        const finalCleanup = await forceRetainedCleanup(page)
        assert.equal(finalCleanup.afterRetainedClassCount,0)
        console.log(JSON.stringify({engine,modeId:generated.modeId,strategy:generated.strategy,retainedVolume,phase:'actual-cleanup-cycle',...observed,finalCleanup,pass:true}))
      } finally { await page.close(); await server.close() }
    }
  } finally { await browser.close() }
}
