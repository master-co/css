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
    const html = '<div class="display:block&#32;display:none"></div><div class="display:flex&nbsp;display:grid"></div><div class=display:inline&#x2d;flex></div>'
    try {
      expect(session.extract({ files: [{ source: 'index.html', kind: 'html', content: html }] }).files[0].candidates)
        .toEqual(["display:block", "display:none", "display:flex display:grid", "display:inline-flex"])
      await scanner.init()
      await scanner.scan('index.html', html)
      expect(scanner.css.text).toContain(".display\\:block{display:block}")
      expect(scanner.css.text).toContain(".display\\:none{display:none}")
      expect(scanner.css.text).toContain(".display\\:inline-flex{display:inline-flex}")
      expect(scanner.css.text).not.toContain(".display\\:flex{display:flex}")
      expect(scanner.css.text).not.toContain(".display\\:grid{display:grid}")
    } finally {
      session.dispose()
      await scanner.dispose()
    }
  })
}
