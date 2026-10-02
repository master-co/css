import { beforeAll, expect, test } from 'vitest'
import { createToolingBindingSync } from '@master/css-binding/tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { fileURLToPath } from 'node:url'
import { MasterCSSScanner } from './test-scanner'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
})

const manifest = {
  "version": 6 as const,
  "languageVersion": 15 as const,
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
, utilities: [{"name":"block","body":[{"type":"declaration" as const,"property":"display","value":[{"type":"text" as const,"value":"block"}]}],"kind":"static" as const},{"name":"fg-red","body":[{"type":"declaration" as const,"property":"color","value":[{"type":"text" as const,"value":"red"}]}],"kind":"static" as const}] } as unknown as MasterCSSManifest

test('Rust scanner cache/state matches the TypeScript scanner oracle slice', async () => {
  const source = 'export const App = () => <div className="block unknown fg-red" />'
  const oracle = await new MasterCSSScanner({ manifest }).init()
  using scanner = createToolingBindingSync().createScannerSession(manifest)

  expect(await oracle.scan('App.tsx', source)).toBe(true)
  const rust = scanner.scan('App.tsx', source) as {
    changed: boolean
    candidates: string[]
    validClasses: string[]
    invalidClasses: string[]
  }
  expect(rust).toMatchObject({
    changed: true,
    candidates: ['block', 'unknown', 'fg-red'],
    validClasses: [...oracle.validClasses],
    invalidClasses: [...oracle.invalidClasses]
  })
  expect((scanner.snapshot() as { engine: { text: string } }).engine.text).toBe(oracle.css.text)

  expect(await oracle.scan('App.tsx', source)).toBe(false)
  expect(scanner.scan('App.tsx', source)).toMatchObject({
    changed: false,
    cacheHit: true
  })
  await oracle.dispose()
})
