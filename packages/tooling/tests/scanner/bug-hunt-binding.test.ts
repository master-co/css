import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner } from '../../src/scanner'

const manifest = defaultManifest as unknown as MasterCSSManifest
const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }

test('BH-0026 selected Wasm loader failures are not silently replaced by native execution', async () => {
  const scanner = new MasterCSSScanner({ manifest, binding: 'wasm', wasm: { module: {} }, verbose: 0 })
  try {
    await expect(scanner.init()).rejects.toThrow()
    expect(scanner.initialized).toBe(false)
  } finally { await scanner.dispose() }
})

test('BH-0026 explicit native load failures do not fall back to available Wasm', async () => {
  const scanner = new MasterCSSScanner({ manifest, binding: 'native', native: { bindingPath: '/__master_css_missing_native__' }, wasm, verbose: 0 })
  try {
    await expect(scanner.init()).rejects.toThrow()
    expect(scanner.initialized).toBe(false)
  } finally { await scanner.dispose() }
})

test('BH-0026 real Wasm scanner survives reset and can deliberately switch to native', async () => {
  const scanner = new MasterCSSScanner({ manifest, binding: 'wasm', wasm, verbose: 0 })
  try {
    await scanner.init()
    await scanner.scanModule('entry.mjs', 'export const classes = "block"')
    expect(scanner.css.text).toContain('.block{display:block}')
    await scanner.reset()
    expect(scanner.css.text).toBe('')
    await scanner.scan('entry.html', '<div class="hidden"></div>')
    expect(scanner.css.text).toContain('.hidden{display:none}')
    await scanner.reset({ manifest, binding: 'native', wasm: { module: {} }, verbose: 0 })
    await scanner.scan('entry.html', '<div class="flex"></div>')
    expect(scanner.css.text).toContain('.flex{display:flex}')
  } finally { await scanner.dispose() }
})
