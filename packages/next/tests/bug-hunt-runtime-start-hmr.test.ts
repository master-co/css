import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, expect, test, vi } from 'vitest'
import withMasterCSS from '../src'

type Manifest = { version: number }
type Runtime = { manifest: Manifest; disposed: boolean; dispose: () => void; observe: () => Runtime }
let source: string
beforeAll(() => {
  const root = mkdtempSync(join(tmpdir(), 'next-runtime-start-hmr-')), cwd = process.cwd()
  try {
    process.chdir(root);withMasterCSS({}, { mode: 'runtime' })
    source = readFileSync(join(root, 'node_modules/.master-css/master-css-next-instrumentation-client.js'), 'utf8')
      .replace(/^import .*\n/gm, '')
      .replaceAll("import('virtual:master-css-manifest')", 'Promise.resolve({ default: modules.manifest })')
      .replaceAll("import('virtual:master-css-emitted-globals')", 'Promise.resolve({ default: modules.emittedGlobals })')
      .replaceAll('import.meta.', 'importMeta.')
  } finally { process.chdir(cwd);rmSync(root, { recursive: true, force: true }) }
})

for (const backend of ['turbopackHot', 'webpackHot']) for (const scenario of ['pending', 'burst', 'replacement', 'dispose', 'failure']) test(`BH-0048 Next ${backend} pending runtime start: ${scenario}`, async () => {
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
    new Function('MasterCSSRuntime', 'masterCSSManifest', 'masterCSSEmittedGlobals', 'modules', 'document', 'importMeta', 'globalThis', source)({ start }, modules.manifest, modules.emittedGlobals, modules, {}, { [backend]: hot }, global)
    return { update: (version: number) => { modules.manifest = { version };update() }, dispose: () => dispose() }
  }
  let module = load()
  await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
  if (scenario === 'replacement') { module.dispose();module = load() }
  if (scenario === 'dispose') module.dispose()
  else { module.update(2);if (scenario === 'burst') module.update(3) }
  // Next resolves dynamic imports before entering the shared runtime start.
  // Advance promise jobs while the first engine start remains explicitly gated.
  for (let i = 0; i < 12; i++) await Promise.resolve()
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
