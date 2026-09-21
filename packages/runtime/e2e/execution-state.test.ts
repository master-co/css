import { expect, test } from '@playwright/test'
import type { MasterCSSEngine } from '@master/css'
import init from './init'

test('runtime synchronizes warm ensures, deletions and globals with batched execution state', async ({ page }) => {
  await init(page)
  const counts = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const internals = runtime as unknown as {
      bindingEngine: MasterCSSEngine
      registerEmittedGlobals(globals: { variables: Record<string, number> }): void
      themeLayer: { tokenCounts: Map<string, number> }
    }
    runtime.ensureClassRules(Array.from({ length: 1000 }, (_, index) => `w:${index}px`))
    const engine = internals.bindingEngine
    const counts = { snapshot: 0, inspect: 0, executionState: 0, mutations: 0, globals: 0 }
    for (const name of ['snapshot', 'inspect', 'executionState'] as const) {
      const original = engine[name].bind(engine)
      Object.defineProperty(engine, name, { value: (...args: unknown[]) => {
        counts[name]++
        return Reflect.apply(original, engine, args)
      }, configurable: true })
    }
    for (let index = 0; index < 5; index++) {
      counts.mutations += runtime.ensureClassRules(['w:999px']).mutations.length
    }
    runtime.deleteClassRules(['w:999px'])
    // An unknown external variable changes counts while producing no CSS mutation.
    internals.registerEmittedGlobals({ variables: { external: 1 } })
    internals.registerEmittedGlobals({ variables: { external: 2 } })
    counts.globals = internals.themeLayer.tokenCounts.get('external') || 0
    return counts
  })
  expect(counts).toEqual({ snapshot: 0, inspect: 0, executionState: 8, mutations: 0, globals: 3 })
})
