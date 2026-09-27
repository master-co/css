import { expect, test } from 'vitest'
import { createCompiler } from '@master/css-compiler'
import { createEngine } from '@master/css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const baseManifest: MasterCSSManifest = { version: 1, languageVersion: 3 }
const declarations = (css: string) => [...css.matchAll(/(?:display|width|text-align):[^;}]+/g)].map(match => match[0])

test.each(['native', 'wasm'] as const)('448: %s patterns compose fixed forward references without losing declaration boundaries', async (binding) => {
  using compiler = await createCompiler({ binding })
  const { manifest, css } = compiler.compileManifest(`
    @theme { --spacing-audit: 2rem; }
    @utilities {
      audit-frame:<*> { @compose audit-base; width: --value(); @compose display:flex; }
      audit-space-<~spacing> { @compose audit-base; width: --value(); @compose display:flex; }
      audit-flow-<left|right> { @compose audit-base; text-align: --value(); @compose display:flex; }
      audit-base { display: block; display: made-up-value; }
    }
    .card { @compose audit-frame:2rem; }
  `, { baseManifest, preserveNativeCSS: true })
  using engine = await createEngine({ manifest, binding })
  const expected = (value: string) => ['display:block', 'display:made-up-value', value, 'display:flex']
  for (const [className, value] of [
    ['audit-frame:2rem', 'width:2rem'],
    ['audit-space-audit', 'width:var(--spacing-audit)'],
    ['audit-flow-left', 'text-align:left']
  ]) {
    const inspection = engine.inspect(className)
    expect(inspection.matchStatus, className).toBe('matched')
    expect(declarations(inspection.rules.map(rule => rule.text).join('')), className).toEqual(expected(value))
  }
  expect(declarations(css)).toEqual(expected('width:2rem'))
  expect(() => compiler.compileManifest(
    '@utilities { frame:<*> { @compose width:--value(); } }', { baseManifest }
  )).toThrow('@compose targets must be fixed classes')
})
