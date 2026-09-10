import { expect, test, vi } from 'vitest'
import { createMasterCSSRuntimeBootstrapSource } from '../src/runtime-bootstrap'

type Inputs = { manifest: unknown; emittedGlobals: unknown }
type Module = { default: unknown } | undefined

for (const pending of [false, true]) for (const order of ['manifest-first', 'globals-first', 'together']) test(`runtime HMR retains latest inputs: ${order}, pending=${pending}`, async () => {
  const initialManifest = { version: 1, utilities: [] }, latestManifest = { version: 1, utilities: [] }
  const initialGlobals = { variables: {} }, latestGlobals = { variables: { '--color-primary': 1 } }
  const gate = Promise.withResolvers<undefined>(), observed: Inputs[] = [], errors = vi.fn()
  let update: (modules: Module[]) => void, dispose: (data: object) => void
  const start = vi.fn(async (inputs: Inputs) => {
    await gate.promise
    return { dispose() {}, observe() { observed.push(inputs);return this } }
  })
  const hot = { data: {}, accept(dependencies: unknown, callback?: typeof update) { if (Array.isArray(dependencies)) update = callback! }, dispose(callback: typeof dispose) { dispose = callback } }
  const source = createMasterCSSRuntimeBootstrapSource().replace(/^import .*\n/gm, '').replaceAll('import.meta.hot', 'hot')
  new Function('MasterCSSRuntime', 'masterCSSManifest', 'masterCSSEmittedGlobals', 'document', 'hot', 'console', source)(
    { start }, initialManifest, initialGlobals, {}, hot, { error: errors }
  )
  await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
  if (!pending) { gate.resolve(undefined);await vi.waitFor(() => expect(observed).toHaveLength(1)) }
  const manifest = { default: latestManifest }, globals = { default: latestGlobals }
  const updates = order === 'together' ? [[manifest, globals]] : order === 'manifest-first' ? [[manifest, undefined], [undefined, globals]] : [[undefined, globals], [manifest, undefined]]
  for (const modules of updates) {
    const count = observed.length;update!(modules)
    if (!pending) await vi.waitFor(() => expect(observed).toHaveLength(count + 1))
  }
  gate.resolve(undefined)
  await vi.waitFor(() => expect(observed.length).toBeGreaterThan(0))
  expect(observed.at(-1)?.manifest).toBe(latestManifest)
  expect(observed.at(-1)?.emittedGlobals).toBe(latestGlobals)
  expect(errors).not.toHaveBeenCalled()
  dispose!({})
})
