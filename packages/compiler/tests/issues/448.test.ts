import { expect, test } from 'vitest'
import { createCompiler } from '@master/css-compiler'
import { createEngine } from '@master/css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const baseManifest: MasterCSSManifest = {
  "version": 4 as const,
  "languageVersion": 6 as const
}
const declarations = (css: string) => [...css.matchAll(/(?:display|width|text-align):[^;}]+/g)].map(match => match[0])

test.each(['native', 'wasm'] as const)('448: %s preserves duplicate fallbacks with native declarations in every utility pattern', async (binding) => {
  using compiler = await createCompiler({ binding })
  const { manifest, css } = compiler.compileManifest(`
    @theme { :root { --spacing-audit: 2rem; --audit-space-audit: var(--spacing-audit); } }
    @mixin --audit-frame(--value) { display: block; display: made-up-value; width: var(--value); display: flex; }
    @mixin --audit-space(--name <string>) { display: block; display: made-up-value; width: var(ident("--audit-space-" var(--name))); display: flex; }
    @mixin --audit-flow-left { display: block; display: made-up-value; text-align: left; display: flex; }
    @mixin --audit-flow-right { display: block; display: made-up-value; text-align: right; display: flex; }
    @mixin --audit-base { display: block; display: made-up-value; width: 2rem; display: flex; }
    .card { display: block; display: made-up-value; width: 2rem; display: flex; }
  `, { baseManifest, preserveNativeCSS: true })
  using engine = await createEngine({ manifest, binding })
  const expected = (value: string) => ['display:block', 'display:made-up-value', value, 'display:flex']
  for (const [className, value] of [
    ['audit-frame(2rem)', 'width:2rem'],
    ['audit-space-audit', 'width:var(--audit-space-audit)'],
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
    '@mixin --frame { @compose base; } @mixin --base { display: block; }',
    '@mixin --frame(--value) { @compose width:var(--value); }',
    '@mixin --frame(--name <string>) { @compose display:block; }',
    '@mixin --frame-left { @compose display:block; }',
    '.card { display: block; @compose display:flex; width: 2rem; }'
  ]) {
    expect(() => compiler.compileManifest(source, { baseManifest })).toThrow('@compose has been removed')
  }
})
