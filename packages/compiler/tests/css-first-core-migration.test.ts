import { describe, expect, test } from 'vitest'
import { compileCSSManifest } from '../src/node-compiler'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import { createTestCSS } from './helpers/rust-engine'

const baseManifest = { version: 2 as const, languageVersion: 4 as const, utilities: [] }
const compile = (source: string) => compileCSSManifest(source, { baseManifest })

describe('directive language v4 authoring contracts', () => {
  test('lowers fixed, raw and ordered namespace utilities into one executable manifest', () => {
    const { manifest } = compile(`
      @theme { :root { --spacing-card: 1rem; --color-line-brand: red; --color-brand: blue; --color-other: green; } }
      @utility card { color: red; &:hover { color: blue; } }
      @utility pair:* { width: --master-value(); height: --master-value(); }
      @utility outline-* from(--color-line-*, --color-*) { outline-color: --master-value(); }
      @utility align-left { text-align: left; }
      @utility align-right { text-align: right; }
    `)
    expect(manifest.version).toBe(2)
    expect(manifest.languageVersion).toBe(4)
    const css = createTestCSS(manifest)
    expect(css.createRule('card')?.text).toContain('.card:hover{color:#00f}')
    expect(css.createRule('pair:2px')?.text).toContain('width:2px;height:2px')
    expect(css.createRule('outline-brand')?.text).toContain('var(--color-line-brand)')
    expect(css.createRule('outline-other')?.text).toContain('var(--color-other)')
    expect(css.createRule('align-left')?.text).toContain('text-align:left')
    expect(css.createRule('outline-missing')).toBeUndefined()
    expect(css.createRule('align-up')).toBeUndefined()
    css.dispose()
  })

  test('keeps native component layers separate from on-demand utility definitions', () => {
    const result = compileCSSManifest(`
      @layer components { .card { padding: 1rem; } }
      @utility badge { display: inline-block; }
    `, { baseManifest })
    expect(result.nativeCSS).toContain('.card')
    const css = createTestCSS(result.manifest)
    expect(css.createRule('card')).toBeUndefined()
    expect(css.createRule('badge')?.text).toContain('display:inline-block')
    css.dispose()
  })

  test('replaces a whole utility definition including nested branches', () => {
    const { manifest } = compile('@utility card { color: red; &:hover { color: blue; } } @utility card { padding: 2px; }')
    const css = createTestCSS(manifest)
    expect(css.createRule('card')?.text).toBe('.card{padding:2px}')
    css.dispose()
  })

  test('uses explicit slots and resolves forward custom media with logical substitution', () => {
    const { manifest } = compile(`
      @custom-media --screen-card screen and (--card);
      @custom-media --card (width >= 40rem), (orientation: landscape);
      @custom-variant focus-ring { &:focus-visible { @slot; } }
      @utility panel { display: block; @variant screen-card { display: grid; } @variant focus-ring { outline: 2px solid; } }
    `)
    const css = createTestCSS(manifest)
    const text = css.createRule('panel')!.text
    expect(text).toContain('@media screen')
    expect(text).toContain('(width >= 40rem)')
    expect(text).toContain('(orientation: landscape)')
    expect(text).toContain(':focus-visible')
    expect(css.createRule('padding:1px@screen-card')?.text).toContain('@media screen')
    css.dispose()
  })

  test('does not infer named media from breakpoint variables', () => {
    const { manifest } = compile('@theme { :root { --breakpoint-card: 40rem; } }')
    expect(flattenMasterCSSManifestVariables(manifest.variables)).toHaveLength(1)
    expect(manifest.customMedia).toBeUndefined()
    const css = createTestCSS(manifest)
    expect(css.createRule('padding:1px@card')).toBeUndefined()
    css.dispose()
  })

  test.each([
    '@master entry;', '@settings { important: true; }', '@mode dark { .dark { @slot; } }',
    '@utilities { card { display: block; } }', '@dark { .card { color: red; } }',
    '.card { @variant media((width>=40rem)) { display: block; } }',
    '@theme inline { --color-brand: red; }', '@theme static { --color-brand: red; }',
    '@theme dark { --color-brand: red; }', '@theme { --color-brand: red; }',
    '@theme { :root { color: red; } }', '@theme { @keyframes fade { to { opacity: 1; } } }',
    '@utility align-<left|right> { text-align: --master-value(); }',
    '@utility pair:<*> { width: --master-value(); }',
    '@utility pair:* { width: --master-value(1px); }',
    '@utility card { width: --master-value(); }',
    '@custom-media --card (--missing);', '@custom-media --a (--b); @custom-media --b (--a);',
    '@custom-media --card true; @custom-variant card { &:hover { @slot; } }'
  ])('rejects removed or invalid authoring syntax: %s', source => {
    expect(() => compile(source)).toThrow()
  })
})
