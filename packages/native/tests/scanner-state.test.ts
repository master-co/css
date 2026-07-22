import { beforeAll, describe, expect, test } from 'vitest'
import { loadNativeBinding } from '../src'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

const manifest = {
  version: 1,
  utilities: [
    {
      id: 'display-block',
      name: 'block',
      type: 0,
      emit: {
        type: 'static',
        rules: [{ declarations: { display: 'block' } }]
      },
      matchers: [{ type: 'static', name: 'block' }]
    },
    {
      id: 'color-red',
      name: 'fg:red',
      type: 0,
      emit: {
        type: 'static',
        rules: [{ declarations: { color: 'red' } }]
      },
      matchers: [{ type: 'static', name: 'fg:red' }]
    }
  ]
}

describe('Rust scanner state session', () => {
  test('keeps source cache and valid/invalid class state behind an opaque handle', () => {
    const binding = loadNativeBinding({ required: true })!.binding
    const scanner = new binding.ScannerSession(JSON.stringify(manifest))
    const source = 'export const App = () => <div className="block unknown fg:red" />'

    expect(JSON.parse(scanner.scan('App.tsx', source))).toMatchObject({
      changed: true,
      cacheHit: false,
      candidates: ['block', 'unknown', 'fg:red'],
      validClasses: ['block', 'fg:red'],
      invalidClasses: ['unknown'],
      transition: { version: 1 }
    })
    expect(JSON.parse(scanner.scan('App.tsx', source))).toEqual({
      changed: false,
      cacheHit: true,
      candidates: [],
      validClasses: [],
      invalidClasses: [],
      transition: { version: 1, mutations: [] }
    })

    expect(JSON.parse(scanner.state())).toMatchObject({
      latentClasses: ['block', 'unknown', 'fg:red'],
      validClasses: ['block', 'fg:red'],
      invalidClasses: ['unknown'],
      cachedSources: 1,
      engine: { version: 1 }
    })

    scanner.reset()
    expect(JSON.parse(scanner.state())).toMatchObject({
      latentClasses: [],
      validClasses: [],
      invalidClasses: [],
      cachedSources: 0,
      engine: { rules: [] }
    })
    scanner.dispose()
  })
})
