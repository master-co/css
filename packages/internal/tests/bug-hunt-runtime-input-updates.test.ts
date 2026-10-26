import { expect, test, vi } from 'vitest'
import { createMasterCSSRuntimeBootstrapSource } from '../src/runtime-bootstrap'

type Inputs = { program: unknown; emittedGlobals: unknown }
type Module = { default: unknown } | undefined

for (const pending of [false, true]) for (const order of ['program-first', 'globals-first', 'together']) test(`runtime HMR retains latest inputs: ${order}, pending=${pending}`, async () => {
  const initialProgram = { version: 1 as const, mixins: [] }, latestProgram = { version: 1 as const, mixins: [] }
  const initialGlobals = { variables: {} }, latestGlobals = { variables: { '--color-primary': 1 } }
  const gate = Promise.withResolvers<undefined>(), observed: Inputs[] = [], errors = vi.fn()
  let update: (modules: Module[]) => void, dispose: (data: object) => void
  const start = vi.fn(async (inputs: Inputs) => {
    await gate.promise
    return { dispose() {}, observe() { observed.push(inputs);return this }, refresh(program: unknown, emittedGlobals: unknown) { observed.push({ program, emittedGlobals });return this } }
  })
  const hot = { data: {}, accept(dependencies: unknown, callback?: typeof update) { if (Array.isArray(dependencies)) update = callback! }, dispose(callback: typeof dispose) { dispose = callback } }
  const source = createMasterCSSRuntimeBootstrapSource().replace(/^import .*\n/gm, '').replaceAll('import.meta.hot', 'hot')
  new Function('MasterCSSRuntime', 'masterCSSProgram', 'masterCSSEmittedGlobals', 'document', 'hot', 'console', source)(
    { start }, initialProgram, initialGlobals, {}, hot, { error: errors }
  )
  await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
  if (!pending) { gate.resolve(undefined);await vi.waitFor(() => expect(observed).toHaveLength(1)) }
  const program = { default: latestProgram }, globals = { default: latestGlobals }
  const updates = order === 'together' ? [[program, globals]] : order === 'program-first' ? [[program, undefined], [undefined, globals]] : [[undefined, globals], [program, undefined]]
  for (const modules of updates) {
    const count = observed.length;update!(modules)
    if (!pending) await vi.waitFor(() => expect(observed).toHaveLength(count + 1))
  }
  gate.resolve(undefined)
  await vi.waitFor(() => expect(observed.length).toBeGreaterThan(0))
  expect(observed.at(-1)?.program).toBe(latestProgram)
  expect(observed.at(-1)?.emittedGlobals).toBe(latestGlobals)
  expect(errors).not.toHaveBeenCalled()
  dispose!({})
})
