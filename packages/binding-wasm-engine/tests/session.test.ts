import { readFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'
import { loadWasmEngine } from '../src'
import { createWasmEngineSession } from '../src/node'

afterEach(() => vi.unstubAllGlobals())

it('keys explicit modules by their initialization input', async () => {
  const module = {
    default: vi.fn(async () => ({}))
  }
  const input = new Uint8Array([1])

  await loadWasmEngine({ module, input })
  await loadWasmEngine({ module, input })
  expect(module.default).toHaveBeenCalledTimes(1)
  await expect(loadWasmEngine({
    module,
    input: new Uint8Array([2])
  })).rejects.toMatchObject({
    code: 'WASM_INPUT_CONFLICT',
    domain: 'binding'
  })
})

it('normalizes Wasm initialization failures', async () => {
  const cause = new TypeError('fetch failed')
  await expect(loadWasmEngine({
    module: {
      default: vi.fn(async () => {
        throw cause
      })
    },
    input: new Uint8Array([1])
  })).rejects.toMatchObject({
    code: 'WASM_LOAD_FAILED',
    domain: 'binding',
    cause
  })
})

it('loads the packaged Wasm artifact in Node without fetch support for file URLs', async () => {
  const session = await createWasmEngineSession(JSON.stringify({
    version: 1,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: -2,
      emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))

  expect(session.inspect('block')).toMatchObject({ valid: true, className: 'block' })
  expect(session.snapshot().text).toBe('')
  const transition = session.ensureClassRules(['block'])
  expect(transition.mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe('@layer utilities{.block{display:block}}')
  session.dispose()
})

it('passes emitted globals to the Wasm-owned session', async () => {
  vi.stubGlobal('CSS', { supports: () => true })
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_engine_bg.wasm',
    import.meta.url
  )))
  const session = await createWasmEngineSession(JSON.stringify({
    version: 1,
    variables: {
      color: [{ key: 'red-60', value: '#d00' }]
    },
    utilities: []
  }), {
    emittedGlobals: { variables: { 'color-red-60': 1 } }
  }, { input })

  session.ensureClassRules(['fg:red-60'])
  expect(session.snapshot().text).toBe(
    '@layer utilities{.fg\\:red-60{color:var(--color-red-60)}}'
  )
  session.dispose()
})

it('uses a batched CSS.supports handshake for browser-native declarations', async () => {
  vi.stubGlobal('CSS', {
    supports: (property: string, value: string) => property === 'display' && value === 'block'
  })
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_engine_bg.wasm',
    import.meta.url
  )))
  const session = await createWasmEngineSession(
    JSON.stringify({ version: 1, utilities: [] }),
    {},
    { input }
  )

  const transition = session.ensureClassRules(['display:block', 'made-up:nope'])
  expect(transition.mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe(
    '@layer utilities{.display\\:block{display:block}}'
  )
  session.dispose()
})
