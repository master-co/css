import { expect, test } from 'vitest'
import { createCompiler } from '@master/css-compiler'
import { createEngine } from '@master/css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const baseManifest: MasterCSSManifest = { version: 1, languageVersion: 3 }
const declarations = (css: string) => [...css.matchAll(/(?:display|width|text-align):[^;}]+/g)].map(match => match[0])

test.each(['native', 'wasm'] as const)('448: %s preserves duplicate fallbacks with native declarations in every utility pattern', async (binding) => {
  using compiler = await createCompiler({ binding })
  const { manifest, css } = compiler.compileManifest(`
    @theme { --spacing-audit: 2rem; }
    @utilities {
      audit-frame:<*> { display: block; display: made-up-value; width: --value(); display: flex; }
      audit-space-<~spacing> { display: block; display: made-up-value; width: --value(); display: flex; }
      audit-flow-<left|right> { display: block; display: made-up-value; text-align: --value(); display: flex; }
      audit-base { display: block; display: made-up-value; width: 2rem; display: flex; }
    }
    .card { display: block; display: made-up-value; width: 2rem; display: flex; }
  `, { baseManifest, preserveNativeCSS: true })
  using engine = await createEngine({ manifest, binding })
  const expected = (value: string) => ['display:block', 'display:made-up-value', value, 'display:flex']
  for (const [className, value] of [
    ['audit-frame:2rem', 'width:2rem'],
    ['audit-space-audit', 'width:var(--spacing-audit)'],
    ['audit-flow-left', 'text-align:left'],
    ['audit-base', 'width:2rem']
  ]) {
    const inspection = engine.inspect(className)
    expect(inspection.matchStatus, className).toBe('matched')
    expect(declarations(inspection.rules.map(rule => rule.text).join('')), className).toEqual(expected(value))
  }
  expect(declarations(css)).toEqual(['display: block', 'display: made-up-value', 'width: 2rem', 'display: flex'])
})

test.each(['native', 'wasm'] as const)('448: %s rejects compose instead of partially expanding known or dynamic targets', async (binding) => {
  using compiler = await createCompiler({ binding })
  for (const source of [
    '@utilities { frame { @compose base; } base { display: block; } }',
    '@utilities { frame:<*> { @compose width:--value(); } }',
    '@utilities { frame-<~spacing> { @compose display:block; } }',
    '@utilities { frame-<left|right> { @compose display:block; } }',
    '.card { display: block; @compose display:flex; width: 2rem; }'
  ]) {
    expect(() => compiler.compileManifest(source, { baseManifest })).toThrow('@compose has been removed')
  }
})
