import { readFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'
import { createRuntimeWasmSession } from '../src/node'

afterEach(() => vi.unstubAllGlobals())

it('loads the packaged Wasm artifact in Node without fetch support for file URLs', async () => {
  const session = await createRuntimeWasmSession(JSON.stringify({
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
    '../artifacts/mastercss_wasm_runtime_bg.wasm',
    import.meta.url
  )))
  const session = await createRuntimeWasmSession(JSON.stringify({
    version: 1,
    variables: {
      color: [{ key: 'red-60', value: '#d00' }]
    },
    utilities: []
  }), {
    input,
    emittedGlobalsJSON: JSON.stringify({ variables: { 'color-red-60': 1 } })
  })

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
    '../artifacts/mastercss_wasm_runtime_bg.wasm',
    import.meta.url
  )))
  const session = await createRuntimeWasmSession(
    JSON.stringify({ version: 1, utilities: [] }),
    { input }
  )

  const transition = session.ensureClassRules(['display:block', 'made-up:nope'])
  expect(transition.mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe(
    '@layer utilities{.display\\:block{display:block}}'
  )
  session.dispose()
})
