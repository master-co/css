import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner } from '../../src/scanner'

const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }

test.each(['native', 'wasm'] as const)('%s scanner keeps native validation aligned across files', async (binding) => {
  const sources = [
    '<div class="made-up:bad"></div>',
    '<div class="blocked:value made-up:bad accent-color:red {accent-color:blue;caret-color:red}"></div>'
  ]
  let expectedCSS: string | undefined
  for (const order of [[0, 1], [1, 0]]) {
    const scanner = await new MasterCSSScanner({
      manifest: defaultManifest as unknown as MasterCSSManifest,
      binding,
      wasm,
      blocklist: ['blocked:value'],
      verbose: 0
    }).init()
    try {
      for (const index of order) await scanner.scan(`${index}.html`, sources[index])
      expect([...scanner.validClasses].sort()).toEqual([
        'accent-color:red',
        'made-up:bad',
        '{accent-color:blue;caret-color:red}'
      ])
      expect([...scanner.invalidClasses]).toEqual([])
      expectedCSS ??= scanner.css.text
      expect(scanner.css.text).toBe(expectedCSS)
      await scanner.scan('repeat.html', sources[1])
      expect(scanner.css.text).toBe(expectedCSS)
    } finally {
      await scanner.dispose()
    }
  }
})
