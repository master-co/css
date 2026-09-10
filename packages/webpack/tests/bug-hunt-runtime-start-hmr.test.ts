import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { expect, test, vi } from 'vitest'

type Manifest = { version: number }
type Runtime = { manifest: Manifest; disposed: boolean; dispose: () => void; observe: () => Runtime }
const source = stripTypeScriptTypes(readFileSync(new URL('../src/runtime.ts', import.meta.url), 'utf8'))
  .replace(/^import .*\n/gm, '')
  .replaceAll('masterCSSManifest', 'modules.manifest')
  .replaceAll('masterCSSEmittedGlobals', 'modules.emittedGlobals')
  .replaceAll('import.meta.webpackHot', 'importMeta.webpackHot')

for (const scenario of ['pending', 'burst', 'replacement', 'dispose', 'failure']) test(`BH-0048 Webpack pending runtime start: ${scenario}`, async () => {
  const gate = Promise.withResolvers<undefined>(), instances: Runtime[] = [], global = {}, modules = { manifest: { version: 1 }, emittedGlobals: {} }
  let pending = true
  function instance(manifest: Manifest): Runtime {
    const runtime = { manifest, disposed: false, dispose: vi.fn(() => { runtime.disposed = true }), observe: vi.fn(() => runtime) }
    instances.push(runtime);return runtime
  }
  const initial = instance(modules.manifest), shared = gate.promise.then(() => { pending = false;return initial }, error => { pending = false;throw error })
  const start = vi.fn(async ({ manifest }: { manifest: Manifest }) => pending ? shared : instance(manifest))
  function load() {
    let update: () => void, dispose: () => void
    const hot = { accept(dependencies: unknown, callback?: () => void) { if (Array.isArray(dependencies)) update = callback! }, dispose(callback: () => void) { dispose = callback } }
    new Function('MasterCSSRuntime', 'modules', 'document', 'module', 'importMeta', 'globalThis', source)({ start }, modules, {}, { hot }, { webpackHot: hot }, global)
    return { update: (version: number) => { modules.manifest = { version };update() }, dispose: () => dispose() }
  }
  let module = load()
  await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
  if (scenario === 'replacement') { module.dispose();module = load() }
  if (scenario === 'dispose') module.dispose()
  else { module.update(2);if (scenario === 'burst') module.update(3) }
  if (scenario === 'failure') gate.reject(new Error('Controlled startup failure'))
  else gate.resolve(undefined)
  if (scenario === 'dispose') {
    await vi.waitFor(() => expect(initial.dispose).toHaveBeenCalledOnce())
    expect(initial.observe).not.toHaveBeenCalled()
    return
  }
  await vi.waitFor(() => expect(instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(instances.at(-1)?.manifest.version).toBe(scenario === 'burst' ? 3 : 2)
  expect(instances.at(-1)?.disposed).toBe(false)
  expect(initial.observe).not.toHaveBeenCalled()
  if (scenario !== 'failure') expect(initial.dispose).toHaveBeenCalledOnce()
  module.dispose()
})
