import { readFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'
import { createWasmRenderSession, loadWasmEngine } from '../src'
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
  "version": 4 as const,
  "languageVersion": 8 as const,
  "mixins": [
    {
      "name": "--block",
      "body": [
        {
          "type": "declaration" as const,
          "property": "display",
          "value": [
            {
              "type": "text" as const,
              "value": "block"
            }
          ]
        }
      ]
    }
  ]
}))

  expect(session.inspect('block')).toMatchObject({ matchStatus: 'matched', className: 'block' })
  expect(session.snapshot().text).toBe('')
  const transition = session.ensureClassRules(['block'])
  expect(transition.mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe('@layer utilities{.block{display:block}}')
  session.dispose()

  const nativeDeclarationSession = await createWasmEngineSession(JSON.stringify({
  "theme": [
    {
      "type": "rule" as const,
      "prelude": ":root,:host",
      "children": [
        {
          "type": "declaration" as const,
          "name": "stripe",
          "value": "linear-gradient(red,blue)"
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 8 as const,
  "variables": {
    "": [
      {
        "name": "stripe",
        "key": "stripe",
        "type": "string" as const,
        "values": [
          {
            "path": [
              ":root,:host"
            ],
            "value": "linear-gradient(red,blue)"
          }
        ]
      }
    ]
  }
}))
  nativeDeclarationSession.ensureClassRules(["background:var(--stripe)"])
  expect(nativeDeclarationSession.snapshot().text).toBe(
    '@layer theme{:root,:host{--stripe:linear-gradient(red,blue)}}'
    + "@layer utilities{.background\\:var\\(--stripe\\){background:var(--stripe)}}"
  )
  nativeDeclarationSession.dispose()
})

it('passes emitted globals to the Wasm-owned session', async () => {
  vi.stubGlobal('CSS', { supports: () => true })
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_engine_bg.wasm',
    import.meta.url
  )))
  const session = await createWasmEngineSession(JSON.stringify({
  "theme": [
    {
      "type": "rule" as const,
      "prelude": ":root,:host",
      "children": [
        {
          "type": "declaration" as const,
          "name": "color-red-60",
          "value": "#d00"
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 8 as const,
  "variables": {
    "color": [
      {
        "key": "red-60",
        "values": [
          {
            "path": [
              ":root,:host"
            ],
            "value": "#d00"
          }
        ]
      }
    ]
  }
}), {
    emittedGlobals: { variables: { 'color-red-60': 1 } }
  }, { input })

  session.ensureClassRules(['fg-red-60'])
  expect(session.snapshot().text).toBe(
    '@layer utilities{.fg-red-60{color:var(--color-red-60)}}'
  )
  session.dispose()
})

it('registers emitted globals after the Wasm-owned session starts', async () => {
  vi.stubGlobal('CSS', { supports: () => true })
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_engine_bg.wasm',
    import.meta.url
  )))
  const session = await createWasmEngineSession(JSON.stringify({
  "theme": [
    {
      "type": "rule" as const,
      "prelude": ":root,:host",
      "children": [
        {
          "type": "declaration" as const,
          "name": "color-red-60",
          "value": "#d00"
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 8 as const,
  "variables": {
    "color": [
      {
        "key": "red-60",
        "values": [
          {
            "path": [
              ":root,:host"
            ],
            "value": "#d00"
          }
        ]
      }
    ]
  }
}), {}, { input })

  session.ensureClassRules(['fg-red-60'])
  expect(session.snapshot().text).toContain('--color-red-60:#d00')
  expect(session.registerEmittedGlobals({ variables: { 'color-red-60': 1 } }).mutations.length)
    .toBeGreaterThan(0)
  expect(session.snapshot().text).toBe(
    '@layer utilities{.fg-red-60{color:var(--color-red-60)}}'
  )
  session.dispose()
  expect(() => session.registerEmittedGlobals({ variables: {} })).toThrow('disposed')
})

it('preserves native declarations independently of browser CSS.supports', async () => {
  vi.stubGlobal('CSS', {
    supports: (property: string, value: string) => property === 'display' && value === 'block'
  })
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_binding_wasm_engine_bg.wasm',
    import.meta.url
  )))
  const session = await createWasmEngineSession(
    JSON.stringify({
  "version": 4 as const,
  "languageVersion": 8 as const
}),
    {},
    { input }
  )

  const transition = session.ensureClassRules(['display:block', 'made-up:nope'])
  expect(transition.mutations).toHaveLength(2)
  expect(session.snapshot().text).toBe(
    '@layer utilities{.display\\:block{display:block}.made-up\\:nope{made-up:nope}}'
  )
  session.dispose()

  const renderSession = await createWasmRenderSession(
    JSON.stringify({
  "version": 4 as const,
  "languageVersion": 8 as const
}),
    {},
    { input }
  )

  expect(renderSession.nativeDeclarationCandidates(['accent-color:transparent'])).toHaveLength(1)
  renderSession.ensureClassRules(['accent-color:transparent'])
  const snapshot = renderSession.snapshot() as { snapshot: { text: string } }
  expect(snapshot.snapshot.text).toBe(
    '@layer utilities{.accent-color\\:transparent{accent-color:transparent}}'
  )
  renderSession.dispose()
})
