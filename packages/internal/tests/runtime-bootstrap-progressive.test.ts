import { expect, test, vi } from 'vitest'
import { createMasterCSSRuntimeBootstrapSource } from '../src/runtime-bootstrap'

type Module = { default: unknown } | undefined

function load() {
  const refreshes: [unknown, unknown][] = []
  let update: (modules: Module[]) => void = () => {}
  const runtime = {
    dispose() {},
    observe() { return runtime },
    refresh(manifest: unknown, emittedGlobals: unknown) {
      refreshes.push([manifest, emittedGlobals])
      return runtime
    }
  }
  const start = vi.fn(async (_options: { manifest: unknown }) => runtime)
  const hot = {
    data: {},
    accept(dependencies: unknown, callback?: typeof update) { if (Array.isArray(dependencies)) update = callback! },
    dispose() {}
  }
  const source = createMasterCSSRuntimeBootstrapSource({ progressive: true })
  const body = source.replace(/^import .*\n/gm, '').replaceAll('import.meta.hot', 'hot')
  new Function('MasterCSSRuntime', 'masterCSSEmittedGlobals', 'document', 'hot', 'console', body)(
    { start }, { variables: {} }, {}, hot, { error: vi.fn() }
  )
  return { source, start, refreshes, update: (modules: Module[]) => update(modules) }
}

test('progressive bootstrap starts the runtime with a lazy project manifest', async () => {
  const bootstrap = load()
  expect(bootstrap.source).not.toMatch(/^import .* from 'virtual:master-css-manifest'/m)
  expect(bootstrap.source).toContain(`import('virtual:master-css-manifest')`)
  await vi.waitFor(() => expect(bootstrap.start).toHaveBeenCalledOnce())
  expect(bootstrap.start.mock.calls[0][0].manifest).toBeTypeOf('function')
})

test('progressive HMR refreshes with updated inputs and never passes the loader', async () => {
  const bootstrap = load()
  await vi.waitFor(() => expect(bootstrap.start).toHaveBeenCalledOnce())
  const globals = { variables: { '--color-primary': 1 } }
  bootstrap.update([undefined, { default: globals }])
  await vi.waitFor(() => expect(bootstrap.refreshes).toHaveLength(1))
  const manifest = { version: 6 }
  bootstrap.update([{ default: manifest }, undefined])
  await vi.waitFor(() => expect(bootstrap.refreshes).toHaveLength(2))
  expect(bootstrap.refreshes).toEqual([[undefined, globals], [manifest, globals]])
})
