import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { expect, test, vi } from 'vitest'

type Program = { version: number }
type Runtime = { program: unknown; disposed: boolean; dispose: () => void; observe: () => Runtime; refresh: ReturnType<typeof vi.fn> }
type Modules = { program: Program; emittedGlobals: object; importProgram: () => Promise<{ default: Program }> }

const read = (file: string) => stripTypeScriptTypes(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'))
  .replace(/^import\b[\s\S]*?['"][^'"]*['"];?$/gm, '')
  .replace(/^export /gm, '')
// Each entry runs after the shared start module, as Webpack evaluates them.
const sources = Object.fromEntries((['runtime.ts', 'progressive-runtime.ts'] as const).map(file => [file, `${read('runtime-start.ts')}\n${read(file)}`
  .replaceAll(`import('virtual:master-css-program')`, 'modules.importProgram()')
  .replaceAll('masterCSSProgram', 'modules.program')
  .replaceAll('masterCSSEmittedGlobals', 'modules.emittedGlobals')
  .replaceAll('import.meta.webpackHot', 'importMeta.webpackHot')]))

function createHarness(file: keyof typeof sources) {
  const gate = Promise.withResolvers<undefined>(), instances: Runtime[] = [], global = {}
  const modules: Modules = { program: { version: 1 }, emittedGlobals: { version: 1 }, importProgram: vi.fn(async () => ({ default: modules.program })) }
  let pending = true
  function instance(program: unknown): Runtime {
    const runtime: Runtime = { program, disposed: false, dispose: vi.fn(() => { runtime.disposed = true }), observe: vi.fn(() => runtime), refresh: vi.fn() }
    instances.push(runtime);return runtime
  }
  const initial = instance(modules.program), shared = gate.promise.then(() => { pending = false;return initial }, error => { pending = false;throw error })
  const start = vi.fn(async ({ program }: { program: unknown }) => pending ? shared : instance(program))
  function load() {
    const accepted = new Map<string, () => void>()
    let dispose: () => void
    const hot = {
      accept(dependencies: unknown, callback?: () => void) {
        for (const dependency of typeof dependencies === 'function' ? [] : [dependencies].flat() as string[]) accepted.set(dependency, callback!)
      },
      dispose(callback: () => void) { dispose = callback }
    }
    new Function('MasterCSSRuntime', 'modules', 'document', 'importMeta', 'globalThis', '__webpack_public_path__', sources[file])({ start }, modules, {}, { webpackHot: hot }, global, '/')
    return {
      // Webpack calls each distinct accept callback of the updated dependencies once.
      update: (...dependencies: string[]) => { for (const callback of new Set(dependencies.map(dependency => accepted.get(dependency)!))) callback() },
      dispose: () => dispose()
    }
  }
  return { gate, instances, initial, start, modules, load }
}

for (const scenario of ['pending', 'burst', 'replacement', 'dispose', 'failure']) test(`BH-0048 Webpack pending runtime start: ${scenario}`, async () => {
  const { gate, instances, initial, start, modules, load } = createHarness('runtime.ts')
  let module = load()
  const update = (version: number) => { modules.program = { version };module.update('virtual:master-css-program') }
  await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
  if (scenario === 'replacement') { module.dispose();module = load() }
  if (scenario === 'dispose') module.dispose()
  else { update(2);if (scenario === 'burst') update(3) }
  if (scenario === 'failure') gate.reject(new Error('Controlled startup failure'))
  else gate.resolve(undefined)
  if (scenario === 'dispose') {
    await vi.waitFor(() => expect(initial.dispose).toHaveBeenCalledOnce())
    expect(initial.observe).not.toHaveBeenCalled()
    return
  }
  await vi.waitFor(() => expect(instances.at(-1)?.observe).toHaveBeenCalledOnce())
  expect(instances.at(-1)?.program).toEqual({ version: scenario === 'burst' ? 3 : 2 })
  expect(instances.at(-1)?.disposed).toBe(false)
  expect(initial.observe).not.toHaveBeenCalled()
  if (scenario !== 'failure') expect(initial.dispose).toHaveBeenCalledOnce()
  module.dispose()
})

test('runtime mode starts with the imported program and refreshes with updated imports', async () => {
  const { gate, initial, start, modules, load } = createHarness('runtime.ts')
  const module = load()
  await vi.waitFor(() => expect(start).toHaveBeenCalledOnce())
  gate.resolve(undefined)
  await vi.waitFor(() => expect(initial.observe).toHaveBeenCalledOnce())
  expect(start.mock.calls[0][0]).toMatchObject({ program: { version: 1 }, emittedGlobals: { version: 1 } })
  modules.program = { version: 2 }
  modules.emittedGlobals = { version: 2 }
  module.update('virtual:master-css-program', 'virtual:master-css-emitted-globals')
  await vi.waitFor(() => expect(initial.refresh).toHaveBeenCalledOnce())
  expect(initial.refresh).toHaveBeenCalledWith({ version: 2 }, { version: 2 })
  expect(modules.importProgram).not.toHaveBeenCalled()
  module.dispose()
})

test('progressive mode defers the program until the engine starts and refreshes HMR updates', async () => {
  const { gate, initial, start, modules, load } = createHarness('progressive-runtime.ts')
  const module = load()
  await vi.waitFor(() => expect(start).toHaveBeenCalledOnce())
  gate.resolve(undefined)
  await vi.waitFor(() => expect(initial.observe).toHaveBeenCalledOnce())
  const { program } = start.mock.calls[0][0]
  // A pre-rendered page keeps the engine deferred, so nothing imports the program.
  expect(program).toBeTypeOf('function')
  expect(modules.importProgram).not.toHaveBeenCalled()
  await expect((program as () => Promise<Program>)()).resolves.toEqual({ version: 1 })

  // Only emitted globals changed: the runtime re-executes its current program.
  modules.emittedGlobals = { version: 2 }
  module.update('virtual:master-css-emitted-globals')
  await vi.waitFor(() => expect(initial.refresh).toHaveBeenCalledOnce())
  expect(initial.refresh).toHaveBeenLastCalledWith(undefined, { version: 2 })
  expect(modules.importProgram).toHaveBeenCalledOnce()

  modules.program = { version: 2 }
  module.update('virtual:master-css-program')
  await vi.waitFor(() => expect(initial.refresh).toHaveBeenCalledTimes(2))
  expect(initial.refresh).toHaveBeenLastCalledWith({ version: 2 }, { version: 2 })
  expect(modules.importProgram).toHaveBeenCalledTimes(2)
  module.dispose()
  expect(initial.dispose).toHaveBeenCalledOnce()
})
