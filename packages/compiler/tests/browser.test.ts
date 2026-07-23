import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { compileManifest } from '../src'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createTestCSS } from './helpers/rust-engine'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

test.concurrent('universal compileManifest lowers directives with a base manifest', async () => {
  const result = await compileManifest(`
    @components {
      btn {
        @compose flex;
        color: red;
      }
    }
  `, {
    baseManifest: defaultManifest
  })
  const css = createTestCSS(result.manifest)

  css.ensureClassRules('btn')

  expect(result.diagnostics).toEqual([])
  expect(result.manifest.utilities?.some((utility) => utility.name === 'btn' && utility.layer === 'components')).toBe(true)
  expect(css.text).toContain('.btn')
  expect(css.text).toContain('display:flex')
  expect(css.text).toContain('color:red')
  css.dispose()
})

test.concurrent('universal compileManifest rejects @reference directives', async () => {
  await expect(compileManifest('@reference "./tokens.css";', {
    baseManifest: defaultManifest
  })).rejects.toThrow(
    'Universal manifest compilation cannot resolve @reference directives'
  )
})
