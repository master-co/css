import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner, type MasterCSSScannerSourceResult } from '../../src/scanner/node'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest
const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }

for (const binding of ['native', 'wasm'] as const) {
  test(`scanSource retains full input candidates on cache hits and repeated files (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, verbose: 0 })
    try {
      await scanner.init()
      const content = 'document.body.className = "block"'
      const first: MasterCSSScannerSourceResult = await scanner.scanSource('a.mjs', content)
      expect(first).toEqual({ changed: true, candidates: ['block'] })
      expect(await scanner.scanSource('a.mjs', content)).toEqual({ changed: false, candidates: ['block'] })
      expect(await scanner.scanSource('b.mjs', content)).toEqual({ changed: false, candidates: ['block'] })
      expect(await scanner.scanSource('empty.js', '')).toEqual({ changed: false, candidates: [] })
      expect([...scanner.validClasses]).toEqual(['block'])
      expect(scanner.css.text).toContain('.block{display:block}')
    } finally { await scanner.dispose() }
  })

  test(`existing boolean scan and module filters keep behavior (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, exclude: ['excluded/**'], verbose: 0 })
    try {
      await scanner.init()
      let changes = 0
      scanner.on('change', () => changes++)
      expect(await scanner.scan('a.html', '<div class="block"></div>')).toBe(true)
      expect(await scanner.scan('a.html', '<div class="block"></div>')).toBe(false)
      expect(await scanner.scanModule('excluded/a.mjs', 'document.body.className = "inline"')).toBe(false)
      expect(await scanner.scanModule('style.css', 'document.body.className = "inline"')).toBe(false)
      expect(await scanner.scanModule('a.mjs', 'document.body.className = "inline"')).toBe(true)
      expect(changes).toBe(2)
    } finally { await scanner.dispose() }
  })

  test(`candidate ownership stays distinct from native, safelist and blocklist classification (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, safelist: ['inline'], blocklist: ['hidden'], verbose: 0 })
    try {
      await scanner.init()
      scanner.registerNativeClasses(['native'])
      const results = await Promise.all([
        scanner.scanSource('a.html', '<div class="block hidden native"></div>'),
        scanner.scanSource('b.html', '<div class="block native"></div>')
      ])
      expect([...results[0].candidates].sort()).toEqual(['block', 'hidden', 'native'])
      expect([...results[1].candidates].sort()).toEqual(['block', 'native'])
      expect([...scanner.validClasses]).toEqual(['block'])
      expect([...scanner.usedNativeClasses]).toEqual(['native'])
      expect(scanner.css.text).toContain('display:inline')
      expect(scanner.css.text).not.toContain('display:none')
      expect(results.flatMap((result) => result.candidates)).not.toContain('inline')
    } finally { await scanner.dispose() }
  })

  test(`asynchronous adapters and reset preserve each source result (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, verbose: 0 })
    try {
      await scanner.init()
      const results = await Promise.all([
        scanner.scanSource('a.vue', '<template><div class="block flex"></div></template>'),
        scanner.scanSource('b.svelte', '<div class="block grid"></div>'),
        scanner.scanSource('c.html', '<div class="inline"></div>')
      ])
      expect(results.map((result) => [...result.candidates].sort())).toEqual([['block', 'flex'], ['block', 'grid'], ['inline']])
      expect([...scanner.validClasses].sort()).toEqual(['block', 'flex', 'grid', 'inline'])
      await scanner.reset()
      expect(await scanner.scanSource('a.vue', '<template><div class="block flex"></div></template>')).toEqual({ changed: true, candidates: ['block', 'flex'] })
      expect([...scanner.validClasses].sort()).toEqual(['block', 'flex'])
    } finally { await scanner.dispose() }
  })
}
