import { beforeAll, describe, expect, it } from 'vitest'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '../src/default-manifest.json' with { type: 'json' }
import { createTestCSS } from './helpers/rust-engine'

const manifest = preset as unknown as MasterCSSManifest
const retired = [
  ['perspective', 'spacing-md'],
  ['perspective-origin', 'spacing-md'],
  ['transform-origin', 'spacing-md'],
  ['background-position', 'spacing-md'],
  ['mask-position', 'spacing-md'],
  ['object-position', 'spacing-md'],
  ['background-size', 'container-md'],
  ['mask-size', 'container-md'],
  ['cx', 'spacing-md'],
  ['cy', 'spacing-md'],
  ['stroke-dashoffset', 'spacing-md'],
  ['x', 'spacing-md'],
  ['y', 'spacing-md'],
  ['content', 'content-empty'],
  ['font-feature-settings', 'font-feature-tabular'],
  ['text-underline', 'spacing-md', 'text-underline-offset'],
  ['text-decoration', 'color-red', 'text-decoration-color'],
  ['text-stroke', 'color-red', '-webkit-text-stroke-color'],
  ['contain-intrinsic-block-size', 'container-md'],
  ['contain-intrinsic-inline-size', 'container-md']
] as const

describe('retired preset mixins', () => {
  let labels: readonly string[]
  beforeAll(() => {
    using language = createLanguageSessionSync({ manifest })
    labels = language.completionIndex().classEntries.map(entry => entry.label)
  })

  it.each(retired)('removes %s calls and completions while preserving native declarations', (prefix, token, nativeProperty?: string) => {
    const property = nativeProperty ?? prefix
    using language = createLanguageSessionSync({ manifest })
    using compiler = createCompilerBindingSessionSync()
    const key = token.slice(token.lastIndexOf('-') + 1)
    expect(language.tokenFamilies().families.some(family => family.prefix === prefix)).toBe(false)
    for (const name of [`${prefix}-${key}`, `${prefix}(var(--${token}))`]) {
      expect(language.inspectClassName(name).rules, name).toEqual([])
      expect(labels, name).not.toContain(name)
    }
    // Without a family, the colon follows the existing native-declaration grammar.
    // It must never reconstruct the retired property's token declaration.
    const suffixed = language.inspectClassName(`${prefix}-${key}:hover`)
    expect(suffixed.kind).toBe('declaration')
    expect(suffixed.declarations).toEqual(expect.arrayContaining([
      expect.objectContaining({ property: `${prefix}-${key}`, value: 'hover' })
    ]))
    expect(suffixed.variables).toEqual([])
    const value = prefix === 'content' ? '""' : prefix === 'font-feature-settings' ? '"tnum"' : `var(--${token})`
    const native = `${property}:${value}`
    const inspection = language.inspectClassName(native)
    expect(inspection.matchStatus).toBe('matched')
    expect(inspection.declarations).toEqual(expect.arrayContaining([
      expect.objectContaining({ property, value })
    ]))
    const css = createTestCSS(manifest)
    css.ensureClassRules(native)
    if (value.startsWith('var(')) expect(css.text).toContain(`--${token}:`)
    else expect(css.text).toContain(`${property}:${value}`)
    const parsed = compiler.compileCSSDirectives(`.example { @apply --${prefix}(var(--${token})); }`)
    expect(() => compiler.lowerCSSDirectives(parsed, { baseManifest: manifest })).toThrow(`Unknown mixin --${prefix}`)
  })

  it('does not publish content or font-feature preset tokens', () => {
    const variables = flattenMasterCSSManifestVariables(manifest.variables)
    expect(variables.filter(variable => ['content', 'font-feature'].includes(variable.namespace ?? ''))).toEqual([])
  })

  it('lets projects explicitly restore a removed family with a native mixin', () => {
    using compiler = createCompilerBindingSessionSync()
    const parsed = compiler.compileCSSDirectives(`
      @theme { --content-empty: ''; }
      @mixin --content(--content) { content: var(--content); }
      .example { @apply --content(var(--content-empty)); }
    `)
    const lowered = compiler.lowerCSSDirectives(parsed, { baseManifest: manifest })
    expect(lowered.css).toContain('.example{content:var(--content-empty)}')
    const css = createTestCSS(lowered.manifest)
    expect(css.createRule('content-empty')?.text).toBe('.content-empty{content:var(--content-empty)}')
  })

  it('allows project text recipes and families to use the same names', () => {
    using compiler = createCompilerBindingSessionSync()
    const parsed = compiler.compileCSSDirectives(`
      @theme { --color-accent: #123456; }
      @mixin --text-decoration(--color) { text-decoration-color: var(--color); }
      @mixin --text-gradient {
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .example { @apply --text-decoration(var(--color-accent)); @apply --text-gradient; }
    `)
    const lowered = compiler.lowerCSSDirectives(parsed, { baseManifest: manifest })
    expect(lowered.css).toContain('.example{text-decoration-color:var(--color-accent);-webkit-text-fill-color:transparent;background-clip:text}')
    using language = createLanguageSessionSync({ manifest: lowered.manifest })
    expect(language.tokenFamilies().families).toContainEqual({
      mixin: '--text-decoration', prefix: 'text-decoration', namespace: 'color', argument: 'value', properties: ['text-decoration-color']
    })
    const css = createTestCSS(lowered.manifest)
    expect(css.createRule('text-decoration-accent')?.text).toContain('{text-decoration-color:var(--color-accent)}')
    expect(css.createRule('text-gradient')?.text).toContain('{-webkit-text-fill-color:transparent;background-clip:text}')
  })

  it.each(['font-antialiased', 'font-smoothing-auto', 'font-subpixel-antialiased', 'text-gradient'])('%s has no preset definition or call syntax', (name) => {
    const css = createTestCSS(manifest)
    expect(manifest.mixins?.some(mixin => mixin.name === `--${name}`)).toBe(false)
    expect(css.createRule(name)).toBeUndefined()
    expect(css.createRule(`${name}()`)).toBeUndefined()
    expect(labels).not.toContain(name)
    expect(labels).not.toContain(`${name}()`)
    using compiler = createCompilerBindingSessionSync()
    const parsed = compiler.compileCSSDirectives(`.example { @apply --${name}; }`)
    expect(() => compiler.lowerCSSDirectives(parsed, { baseManifest: manifest })).toThrow(`Unknown mixin --${name}`)
  })

  it('preserves explicit native font smoothing declarations', () => {
    const css = createTestCSS(manifest)
    expect(css.createRule('-webkit-font-smoothing:antialiased')?.text).toContain('{-webkit-font-smoothing:antialiased}')
    expect(css.createRule('-moz-osx-font-smoothing:grayscale')?.text).toContain('{-moz-osx-font-smoothing:grayscale}')
  })

  it('supports native declarations for gradient text', () => {
    const css = createTestCSS(manifest)
    expect(css.createRule('background-clip:text')?.text).toBe('.background-clip\\:text{background-clip:text}')
    expect(css.createRule('-webkit-text-fill-color:transparent')?.text).toBe('.-webkit-text-fill-color\\:transparent{-webkit-text-fill-color:transparent}')
  })
})
