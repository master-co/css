import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { createToolingBinding } from '@master/css-binding/tooling'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../../src/node'

const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }
for (const binding of ['native', 'wasm'] as const) test(`${binding} maps HTML attributes without changing existing extraction results`, async () => {
  const tooling = await createToolingBinding({ binding, wasm })
  const session = await tooling.createSourceSession()
  try {
    expect(session.extract({ files: [] })).toEqual({ version: 1, files: [] })
    const [mapped] = session.extract({ files: [], htmlAttributes: ['é&amp;&#x1f600;\r\n'] }).htmlAttributes!
    expect(mapped.value).toBe('é&😀\n')
    expect(mapped.spans).toEqual([
      { range: { start: 0, end: 1 }, sourceRange: { start: 0, end: 1 } },
      { range: { start: 1, end: 2 }, sourceRange: { start: 1, end: 6 } },
      { range: { start: 2, end: 4 }, sourceRange: { start: 6, end: 15 } },
      { range: { start: 4, end: 5 }, sourceRange: { start: 15, end: 17 } }
    ])
  } finally { session.dispose() }
})

test('public tooling session returns frozen HTML mappings and enforces disposal', () => {
  const session = createToolingSessionSync({ manifest: defaultManifest as unknown as MasterCSSManifest })
  const result = session.decodeHTMLAttribute('&quot;block&#32;hidden&quot;')
  expect(result.value).toBe('"block hidden"')
  expect(Object.isFrozen(result)).toBe(true)
  expect(Object.isFrozen(result.spans[0].sourceRange)).toBe(true)
  session.dispose()
  expect(() => session.decodeHTMLAttribute('block')).toThrow(/disposed/)
})
