import { beforeAll, expect, test } from 'vitest'
import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import CSSScanner from '../../src/scanner'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../../native/artifacts/mastercss.node',
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
} as unknown as MasterCSSManifest

test('Rust scanner cache/state matches the TypeScript scanner oracle slice', async () => {
  const source = 'export const App = () => <div className="block unknown fg:red" />'
  const oracle = await new CSSScanner({ manifest }).init()
  const binding = loadNativeBinding({ required: true })!.binding
  const scanner = new binding.ScannerSession(JSON.stringify(manifest))

  expect(await oracle.scan('App.tsx', source)).toBe(true)
  const rust = JSON.parse(scanner.scan('App.tsx', source)) as {
    changed: boolean
    candidates: string[]
    validClasses: string[]
    invalidClasses: string[]
  }
  expect(rust).toMatchObject({
    changed: true,
    candidates: ['block', 'unknown', 'fg:red'],
    validClasses: [...oracle.validClasses],
    invalidClasses: [...oracle.invalidClasses]
  })
  expect(JSON.parse(scanner.state()).engine.text).toBe(oracle.css.text)

  expect(await oracle.scan('App.tsx', source)).toBe(false)
  expect(JSON.parse(scanner.scan('App.tsx', source))).toMatchObject({
    changed: false,
    cacheHit: true
  })
})
