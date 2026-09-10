import type { Page } from '@playwright/test'

// Only the existing benchmark observe wrapper passes a real instance here. The
// readonly product facade stays untouched, and inaccessible hooks fail loudly.
export function renderRuntimePreparationInstaller() {
  return `function installBenchmarkRuntimePreparation(runtime, metrics) {
    const retained = runtime.retainedClassNames;
    const observer = runtime.observer;
    if (!(retained instanceof Set) || !observer || typeof observer.disconnect !== 'function') {
      throw new Error('Benchmark requires the observed runtime instance retained Set and MutationObserver.');
    }
    const add = retained.add.bind(retained);
    const remove = retained.delete.bind(retained);
    const clear = retained.clear.bind(retained);
    retained.add = function(value) {
      if (metrics.collectInteractionMutations) metrics.retainedSetAddCount = (metrics.retainedSetAddCount || 0) + 1;
      return add(value);
    };
    retained.delete = function(value) {
      if (metrics.collectInteractionMutations) metrics.retainedSetDeleteCount = (metrics.retainedSetDeleteCount || 0) + 1;
      return remove(value);
    };
    retained.clear = function() {
      if (metrics.collectInteractionMutations) metrics.retainedSetClearCount = (metrics.retainedSetClearCount || 0) + 1;
      return clear();
    };
    return {
      pauseObserver() {
        if (!runtime.observer || typeof runtime.observer.disconnect !== 'function') throw new Error('Observed runtime has no active MutationObserver.');
        runtime.observer.disconnect(); return 1;
      }
    };
  }`
}

export async function forceRetainedCleanup(page: Page) {
  return page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime
    if (!runtime) return { beforeRetainedClassCount: 0, removedClassCount: 0, durationMs: 0, afterRetainedClassCount: 0 }
    const before = runtime.snapshot()
    const retained = Object.entries(before.classRules).filter(([, state]) => state.retained)
    const names = retained.filter(([, state]) => state.usageCount === 0).map(([name]) => name)
    const startedAt = performance.now()
    if (names.length) runtime.deleteClassRules(names)
    const durationMs = performance.now() - startedAt
    const after = runtime.snapshot()
    const remaining = names.filter((name) => after.classRules[name]?.retained || after.classRules[name]?.rules.length)
    if (remaining.length) throw new Error(`Benchmark forced cleanup did not delete inactive rules: ${remaining.join(', ')}`)
    return {
      beforeRetainedClassCount: retained.length,
      removedClassCount: names.length,
      durationMs,
      afterRetainedClassCount: Object.values(after.classRules).filter((state) => state.retained).length
    }
  })
}

export async function preseedRuntimeTempRules(page: Page) {
  return page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime
    const config = globalThis.__interactionConfig as { classes?: { temp?: string[] } } | undefined
    const names = config?.classes?.temp || []
    if (!runtime || !names.length) throw new Error('Runtime temporary-rule preparation requires a runtime and configured classes.')
    const before = globalThis.__readBenchmarkRuntimeSnapshot()
    runtime.ensureClassRules(names)
    const snapshot = runtime.snapshot()
    const missing = names.filter((name: string) => !snapshot.classRules[name]?.rules.length)
    if (missing.length) throw new Error(`Temporary classes did not generate rules: ${missing.join(', ')}`)
    return globalThis.__readBenchmarkRuntimeSnapshot(snapshot).runtimeGeneratedRuleCount - before.runtimeGeneratedRuleCount
  })
}

export async function seedRetainedRuntimeRules(page: Page, count: number) {
  return page.evaluate(async (classCount) => {
    const runtime = globalThis.masterCSSRuntime
    if (!runtime) throw new Error('Retained-volume preparation requires a runtime.')
    const names = Array.from({ length: classCount }, (_, index) => `z:${10000 + index}`)
    const before = runtime.snapshot()
    if (names.some((name) => before.classRules[name]?.rules.length)) throw new Error('Retained-volume classes already exist.')
    const container = document.createElement('div')
    container.hidden = true
    container.classList.add(...names)
    document.body.append(container)
    try {
      for (let frame = 0; frame < 3; frame++) await new Promise<void>((done) => requestAnimationFrame(() => done()))
      const connected = runtime.snapshot()
      if (names.some((name) => !connected.classRules[name]?.rules.length || connected.usageCounts[name] !== 1)) {
        throw new Error('Retained-volume DOM did not produce all requested active rules.')
      }
    } finally { container.remove() }
    for (let frame = 0; frame < 3; frame++) await new Promise<void>((done) => requestAnimationFrame(() => done()))
    const snapshot = runtime.snapshot()
    const entries = names.map((name) => snapshot.classRules[name])
    if (entries.some((entry) => !entry?.retained || entry.usageCount !== 0)) {
      throw new Error('Requested retained volume was not present after DOM removal.')
    }
    const rules = new Map<string, string>()
    for (const entry of entries) for (const rule of entry.rules) rules.set(JSON.stringify([rule.layer, rule.key]), rule.text)
    let rawBytes = 0
    for (const text of rules.values()) rawBytes += new TextEncoder().encode(text).length
    return { classCount: entries.length, ruleCount: rules.size, rawBytes }
  }, count)
}

export async function pauseRuntimeObserver(page: Page) {
  return page.evaluate(() => {
    if (!globalThis.__benchmarkRuntimeControls) throw new Error('Runtime observer instrumentation was not installed.')
    const before = globalThis.masterCSSRuntime!.snapshot()
    const paused = globalThis.__benchmarkRuntimeControls.pauseObserver()
    const after = globalThis.masterCSSRuntime!.snapshot()
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Observer pause changed runtime CSS or public state.')
    return paused
  })
}

declare global {
  var __benchmarkRuntimeControls: { pauseObserver(): number } | undefined
}
