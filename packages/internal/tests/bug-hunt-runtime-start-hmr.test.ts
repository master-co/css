import { expect, test, vi } from 'vitest'
import { createMasterCSSRuntimeBootstrapSource } from '../src/runtime-bootstrap'

type Manifest = { version: number }
type Update = (modules: ({ default: Manifest } | undefined)[]) => void
type Runtime = { manifest: Manifest; disposed: boolean; dispose: () => void; observe: () => Runtime }

function harness() {
  const gate = Promise.withResolvers<undefined>()
  let pending = true
  const instances: Runtime[] = []
  function instance(manifest: Manifest): Runtime {
    const runtime = { manifest, disposed: false, dispose: vi.fn(() => { runtime.disposed = true }), observe: vi.fn(() => runtime) }
    instances.push(runtime)
    return runtime
  }
  const initial = instance({ version: 1 })
  const shared = gate.promise.then(() => { pending = false;return initial }, error => { pending = false;throw error })
  const start = vi.fn(async ({ manifest }: { manifest: Manifest }) => pending ? shared : instance(manifest))
  const errors = vi.fn()
  function load(data: Record<string, unknown> = {}) {
    let update: Update, dispose: (data: Record<string, unknown>) => void
    const hot = {
      data,
      accept(dependencies: unknown, callback?: Update) { if (Array.isArray(dependencies)) update = callback! },
      dispose(callback: typeof dispose) { dispose = callback }
    }
    const source = createMasterCSSRuntimeBootstrapSource().replace(/^import .*\n/gm, '').replaceAll('import.meta.hot', 'hot')
    new Function('MasterCSSRuntime', 'masterCSSManifest', 'masterCSSEmittedGlobals', 'document', 'hot', 'console', source)(
      { start }, { version: 1 }, {}, {}, hot, { error: errors }
    )
    return { update: (manifest: number) => update([{ default: { version: manifest } }, undefined]), dispose: () => { dispose(data);return data } }
  }
  return { gate, instances, start, errors, load }
}

for (const updates of [[2], [2, 3]]) test(`pending startup followed by manifest HMR publishes latest manifest ${updates.at(-1)}`, async () => {
  const h = harness(), module = h.load()
  await vi.waitFor(() => expect(h.start).toHaveBeenCalledTimes(1))
  for (const version of updates) module.update(version)
  h.gate.resolve(undefined)
  await vi.waitFor(() => expect(h.instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(h.instances.at(-1)?.manifest.version).toBe(updates.at(-1))
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
  replacement.update(3);h.gate.resolve(undefined)
  await vi.waitFor(() => expect(h.instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(h.instances.at(-1)?.manifest.version).toBe(3)
  expect(h.instances.at(-1)?.disposed).toBe(false)
  expect(h.instances[0].observe).not.toHaveBeenCalled()
  expect(h.instances[0].dispose).toHaveBeenCalledOnce()
  expect(h.errors).not.toHaveBeenCalled()
  replacement.dispose()
})

test('a failed startup does not poison a later manifest update', async () => {
  const h = harness(), module = h.load()
  await vi.waitFor(() => expect(h.start).toHaveBeenCalledTimes(1))
  module.update(2);h.gate.reject(new Error('Controlled startup failure'))
  await vi.waitFor(() => expect(h.instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(h.instances.at(-1)?.manifest.version).toBe(2)
  expect(h.instances.at(-1)?.disposed).toBe(false)
  expect(h.errors).toHaveBeenCalledOnce()
  module.dispose()
})
