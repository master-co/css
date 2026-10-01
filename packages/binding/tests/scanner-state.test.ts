import { beforeAll, describe, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { loadNativeToolingBinding } from '../src/tooling'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../artifacts/mastercss.node', import.meta.url)
  )
})

const manifest = {
  "version": 4 as const,
  "languageVersion": 13 as const,
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
    },
    {
      "name": "--fg-red",
      "body": [
        {
          "type": "declaration" as const,
          "property": "color",
          "value": [
            {
              "type": "text" as const,
              "value": "red"
            }
          ]
        }
      ]
    }
  ]
}

describe('Rust scanner state session', () => {
  test('keeps source cache and valid/invalid class state behind an opaque handle', () => {
    const scanner = loadNativeToolingBinding({ required: true })!
      .createScannerSession(manifest as never)
    const source = 'export const App = () => <div className="block unknown fg-red" />'

    expect(scanner.scan('App.tsx', source)).toMatchObject({
      changed: true,
      cacheHit: false,
      candidates: ['block', 'unknown', 'fg-red'],
      validClasses: ['block', 'fg-red'],
      invalidClasses: ['unknown'],
      transition: { version: 3 as const }
    })
    expect(scanner.scan('App.tsx', source)).toEqual({
      changed: false,
      cacheHit: true,
      sourceChanged: false,
      candidates: ['block', 'unknown', 'fg-red'],
      usedNativeClasses: [],
      validClasses: [],
      invalidClasses: [],
      transition: { version: 3 as const, mutations: [] }
    })

    expect(scanner.snapshot()).toMatchObject({
      latentClasses: ['block', 'fg-red', 'unknown'],
      validClasses: ['block', 'fg-red'],
      invalidClasses: ['unknown'],
      cachedSources: 1,
      engine: { version: 3 as const }
    })

    scanner.reset()
    expect(scanner.snapshot()).toMatchObject({
      latentClasses: [],
      validClasses: [],
      invalidClasses: [],
      cachedSources: 0,
      engine: { rules: [] }
    })
    scanner.dispose()
  })
})
