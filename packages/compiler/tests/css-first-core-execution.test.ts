import { describe, expect, test } from 'vitest'
import { compileCSSManifest } from '../src/node-compiler'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import { createTestCSS } from './helpers/rust-engine'

const baseManifest = {
  "version": 4 as const,
  "languageVersion": 12 as const
}
const compile = (source: string) => compileCSSManifest(source, { baseManifest })

describe('CSS-first scoped execution', () => {
  test('keeps ordered token declarations and native scopes separate', () => {
    const { manifest, nativeCSS } = compile(`
      @theme {
  --color-source: red; --color-brand: var(--color-source); --color-brand: color-mix(in oklab, var(--color-source), white); --unused: blue;
}

.dark { --color-brand: black; }

@media (width >= 40rem) { .preview { --color-brand: green; } }
      @mixin --card { color: var(--color-brand); }
    `)
    const variable = flattenMasterCSSManifestVariables(manifest.variables).find(variable => variable.name === 'color-brand')!
    expect(variable.values.map(value => value.path)).toEqual([
      [':root,:host'], [':root,:host']
    ])
    expect(variable.dependencies).toEqual(['color-source'])
    const css = createTestCSS(manifest)
    expect(css.text).toBe('')
    css.ensureClassRules('card')
    expect(css.themeLayer.text).toContain('--color-source:red')
    expect(css.themeLayer.text).toContain('--color-brand:var(--color-source);--color-brand:')
    expect(nativeCSS.replace(/\s+/g, '')).toContain('.dark{--color-brand:black;}')
    expect(nativeCSS.replace(/\s+/g, '')).toContain('.preview{--color-brand:green;}')
    expect(css.themeLayer.text).not.toContain('--unused:')
    css.deleteClassRules('card')
    expect(css.themeLayer.text).toBe('')
    css.dispose()
  })

  test('preserves token declaration order when a base manifest is extended', () => {
    const first = compile(`@theme {
  --color-brand: red;
}`)
    const second = compileCSSManifest(`@theme {
  --color-brand: blue;
}

.dark { --color-brand: blue; } @mixin --card { color: var(--color-brand); }`, { baseManifest: first.manifest })
    const css = createTestCSS(second.manifest).ensureClassRules('card')
    expect(css.themeLayer.text).toContain(':root,:host{--color-brand:red}')
    expect(second.nativeCSS.replace(/\s+/g, '')).toContain('.dark{--color-brand:blue;}')
    css.dispose()
  })

  test('preserves native keyframes independently of utility lifecycle', () => {
    const result = compileCSSManifest(`
      @theme {
  --color-brand: red;
}
      @keyframes fade { to { background: var(--color-brand); opacity: 1; } }
      @mixin --card { animation: fade 1s; }
    `, { baseManifest })
    expect(result.nativeCSS).toContain('@keyframes fade')
    expect(result.manifest).not.toHaveProperty('animations')
    const css = createTestCSS(result.manifest).ensureClassRules('card')
    expect(css.text).toContain('animation:fade 1s')
    expect(css.text).not.toContain('@keyframes')
    css.deleteClassRules('card')
    expect(css.text).toBe('')
    expect(result.nativeCSS).toContain('@keyframes fade')
    css.dispose()
  })

  test('keeps nested selectors, condition order and declaration fallbacks', () => {
    const { manifest } = compile(`
      @mixin --card {
        color: red; color: future(red);
        p { display: block; } &:hover { color: blue; }
        @media (width >= 40rem) { @supports (display: grid) { display: grid; } }
        display: flex;
      }
    `)
    const css = createTestCSS(manifest)
    const text = css.createRule('card')!.text
    expect(text.indexOf('color:red')).toBeLessThan(text.indexOf('color:future(red)'))
    expect(text).toContain('.card p{display:block}')
    expect(text).toContain('.card:hover{color:blue}')
    expect(text.indexOf('@media')).toBeLessThan(text.indexOf('@supports'))
    expect(text.lastIndexOf('display:flex')).toBeGreaterThan(text.indexOf('display:grid'))
    css.dispose()
  })

  test('substitutes parameter tokens once and preserves strings and ordinary functions', () => {
    const { manifest } = compile(`
      @mixin --pair(--value) {
        width: var(--value); height: calc(var(--value) * 2);
        --literal: "var(--value)"; --ordinary: --value(); --fragment: prefixvar(--value);
      }
    `)
    const css = createTestCSS(manifest)
    const text = css.createRule('pair(24px)')!.text
    expect(text).toContain('width:24px')
    expect(text).toContain('calc(24px * 2)')
    expect(text).toContain('"var(--value)"')
    expect(text).toContain('--ordinary:--value()')
    expect(text).toContain('prefixvar(--value)')
    expect(css.createRule('pair(var(--value))')).toBeUndefined()
    css.dispose()
  })

  test('preserves CSS variable cycles and ignores quoted references', () => {
    const { manifest } = compile(`
      @theme {
  --a: var(--b); --b: var(--a); --quoted: "var(--missing)";
}
      @mixin --card { --value: var(--a); content: var(--quoted); }
    `)
    const variables = flattenMasterCSSManifestVariables(manifest.variables)
    expect(variables.find(variable => variable.name === 'quoted')?.dependencies).toEqual([])
    const css = createTestCSS(manifest).ensureClassRules('card')
    expect(css.themeLayer.text).toContain('--a:var(--b);--b:var(--a)')
    expect(css.themeLayer.text).toContain('--quoted:"var(--missing)"')
    css.dispose()
  })
})

test('preserves arbitrary native function arguments and custom-property data', () => {
  const result = compile('.native { --money: $100; --pipe: a|b; --data:{"color":"red"}; color:--alpha(red / foo); --ordinary:--value(); }')
  for (const value of ['$100', 'a|b', '--alpha(red / foo)', '--value()']) expect(result.nativeCSS).toContain(value)
  for (const value of [
    '$color-blue-60', '--alpha(var(--color-blue-60) / 50)',
    '--alpha(var(--color-blue-60) / foo)', '--alpha(var(--color-blue-60) / 50% / 20%)',
    '--alpha(var(--color-blue-60))'
  ]) {
    const compiled = compile(`@theme { --color-brand: ${value}; } @mixin --paint { color: var(--color-brand); }`)
    const css = createTestCSS(compiled.manifest).ensureClassRules('paint')
    expect(css.themeLayer.text).toContain(`--color-brand:${value}`)
    css.dispose()
  }
  expect(compile('.native { color: $color-blue-60; }').nativeCSS).toContain('color: $color-blue-60;')
})
