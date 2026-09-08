import { readFileSync } from 'node:fs'
import { createToolingBinding } from '@master/css-binding/tooling'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { expect, test } from 'vitest'
import { MasterCSSScanner } from '../../src/scanner'

const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }
for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0010 ${binding} HTML references reach scanner CSS without splitting nonbreaking space`, async () => {
    const tooling = await createToolingBinding({ binding, wasm })
    const session = await tooling.createSourceSession()
    const scanner = new MasterCSSScanner({ manifest: defaultManifest as unknown as MasterCSSManifest, binding, wasm, verbose: 0 })
    const html = '<div class="block&#32;hidden"></div><div class="flex&nbsp;grid"></div><div class=inline&#x2d;flex></div>'
    try {
      expect(session.extract({ files: [{ source: 'index.html', kind: 'html', content: html }] }).files[0].candidates)
        .toEqual(['block', 'hidden', 'flex\u00a0grid', 'inline-flex'])
      await scanner.init()
      await scanner.scan('index.html', html)
      expect(scanner.css.text).toContain('.block{display:block}')
      expect(scanner.css.text).toContain('.hidden{display:none}')
      expect(scanner.css.text).toContain('.inline-flex{display:inline-flex}')
      expect(scanner.css.text).not.toContain('.flex{display:flex}')
      expect(scanner.css.text).not.toContain('.grid{display:grid}')
    } finally {
      session.dispose()
      await scanner.dispose()
    }
  })
}
