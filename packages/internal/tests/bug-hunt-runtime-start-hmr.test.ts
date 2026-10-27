import { expect, test, vi } from 'vitest'
import { createMasterCSSRuntimeBootstrapSource } from '../src/runtime-bootstrap'

type Program = { version: number }
type Update = (modules: ({ default: Program } | undefined)[]) => void
type Runtime = { program: Program; disposed: boolean; dispose: () => void; observe: () => Runtime }

function harness() {
  const gate = Promise.withResolvers<undefined>()
  let pending = true
  const instances: Runtime[] = []
  function instance(program: Program): Runtime {
    const runtime = { program, disposed: false, dispose: vi.fn(() => { runtime.disposed = true }), observe: vi.fn(() => runtime) }
    instances.push(runtime)
    return runtime
  }
  const initial = instance({ version: 1 })
  const shared = gate.promise.then(() => { pending = false;return initial }, error => { pending = false;throw error })
  const start = vi.fn(async ({ program }: { program: Program }) => pending ? shared : instance(program))
  const errors = vi.fn()
  function load(data: Record<string, unknown> = {}) {
    let update: Update, dispose: (data: Record<string, unknown>) => void
    const hot = {
      data,
      accept(dependencies: unknown, callback?: Update) { if (Array.isArray(dependencies)) update = callback! },
      dispose(callback: typeof dispose) { dispose = callback }
    }
    const source = createMasterCSSRuntimeBootstrapSource().replace(/^import .*\n/gm, '').replaceAll('import.meta.hot', 'hot')
    new Function('MasterCSSRuntime', 'masterCSSProgram', 'masterCSSEmittedGlobals', 'document', 'hot', 'console', source)(
      { start }, { version: 1 }, {}, {}, hot, { error: errors }
    )
    return { update: (program: number) => update([{ default: { version: program } }, undefined]), dispose: () => { dispose(data);return data } }
  }
  return { gate, instances, start, errors, load }
}

for (const updates of [[2], [2, 3]]) test(`pending startup followed by program HMR publishes latest program ${updates.at(-1)}`, async () => {
  const h = harness(), module = h.load()
  await vi.waitFor(() => expect(h.start).toHaveBeenCalledTimes(1))
  for (const version of updates) module.update(version)
  h.gate.resolve(undefined)
  await vi.waitFor(() => expect(h.instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(h.instances.at(-1)?.program.version).toBe(updates.at(-1))
  expect(h.instances.at(-1)?.disposed).toBe(false)
  expect(h.instances[0].observe).not.toHaveBeenCalled()
  expect(h.instances[0].dispose).toHaveBeenCalledOnce()
  expect(h.errors).not.toHaveBeenCalled()
  module.dispose()
})

test('disposing a pending bootstrap never observes its late runtime', async () => {
  const h = harness(), module = h.load()
  await vi.waitFor(() => expect(h.start).toHaveBeenCalledTimes(1))
  module.dispose();h.gate.resolve(undefined)
  await vi.waitFor(() => expect(h.instances[0].dispose).toHaveBeenCalledOnce())
  expect(h.instances[0].observe).not.toHaveBeenCalled()
  expect(h.errors).not.toHaveBeenCalled()
})

test('bootstrap module replacement waits for the disposed module pending start', async () => {
  const h = harness(), old = h.load()
  await vi.waitFor(() => expect(h.start).toHaveBeenCalledTimes(1))
  const replacement = h.load(old.dispose())
  replacement.update(2);h.gate.resolve(undefined)
  await vi.waitFor(() => expect(h.instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(h.instances.at(-1)?.program.version).toBe(2)
  expect(h.instances.at(-1)?.disposed).toBe(false)
  expect(h.instances[0].observe).not.toHaveBeenCalled()
  expect(h.instances[0].dispose).toHaveBeenCalledOnce()
  expect(h.errors).not.toHaveBeenCalled()
  replacement.dispose()
})

test('a failed startup does not poison a later program update', async () => {
  const h = harness(), module = h.load()
  await vi.waitFor(() => expect(h.start).toHaveBeenCalledTimes(1))
  module.update(2);h.gate.reject(new Error('Controlled startup failure'))
  await vi.waitFor(() => expect(h.instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(h.instances.at(-1)?.program.version).toBe(2)
  expect(h.instances.at(-1)?.disposed).toBe(false)
  expect(h.errors).toHaveBeenCalledOnce()
  module.dispose()
})
