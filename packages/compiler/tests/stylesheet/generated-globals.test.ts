import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { transformStylesheet } from '../../src/stylesheet/public'

const baseManifest = preset as unknown as MasterCSSManifest

test('separates generated globals at the compiler boundary without relocating mode selectors', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-global-css-'))
  const tokens = join(root, 'tokens.css')
  writeFileSync(tokens, `
    @mode ocean { [data-theme="ocean"] { @slot; } }
    @theme { --color-probe: red; }
    @theme ocean { --color-probe: blue; }
  `)
  const file = join(root, 'card.module.css')
  const source = '@reference "./tokens.css"; .card { color: var(--color-probe); }'
  const inline = await transformStylesheet(file, source, { baseManifest })
  const separate = await transformStylesheet(file, source, { baseManifest, generatedGlobals: 'separate' })
  expect(inline.globalStylesheet).toBeUndefined()
  expect(inline.code).toContain('--color-probe:red')
  expect(separate.code).toMatch(/\.card\s*\{\s*color:\s*var\(--color-probe\)/)
  expect(separate.code).not.toContain('--color-probe:')
  expect(separate.globalStylesheet?.css).toContain(':root,:host{--color-probe:red}')
  expect(separate.globalStylesheet?.css).toContain('[data-theme=ocean]{--color-probe:blue}')
  expect(separate.dependencies).toContain(tokens)
  expect(Object.isFrozen(separate.globalStylesheet)).toBe(true)
  expect(inline.code).toContain(separate.globalStylesheet!.css)
})

test('separation still rejects invalid local declarations atomically under strict validation', async () => {
  await expect(transformStylesheet('/project/card.module.css',
    '@theme { --color-probe:red; } .card { color:var(--color-probe); width:calc(1px + 1s); }',
    { baseManifest, generatedGlobals: 'separate', validation: 'error' }
  )).rejects.toThrow()
})
