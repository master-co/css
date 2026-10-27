import { beforeAll, describe, expect, it } from 'vitest'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '../src/default-manifest.json' with { type: 'json' }
import { createTestCSS } from './helpers/rust-engine'

const manifest = preset as unknown as MasterCSSManifest
describe('preset mixins', () => {
  let labels: readonly string[]
  beforeAll(() => {
    using language = createLanguageSessionSync({ manifest })
    labels = language.completionIndex().classEntries.map(entry => entry.label)
  })

  it('allows project text recipes and families to use the same names', () => {
    using compiler = createCompilerBindingSessionSync()
    const parsed = compiler.compileCSSDirectives(`
      @theme { --color-accent: #123456; }
      @mixin --text-decoration(--color) { text-decoration-color: var(--color); }
      @utility text-decoration-(--color) { text-decoration-color: var(--color); }
      @mixin --text-gradient {
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      @utility text-gradient { @apply --text-gradient; }
      .example { @apply --text-decoration(var(--color-accent)); @apply --text-gradient; }
    `)
    const lowered = compiler.lowerCSSDirectives(parsed, { baseManifest: manifest })
    expect(lowered.css).toContain('.example{text-decoration-color:var(--color-accent);-webkit-text-fill-color:transparent;background-clip:text}')
    using language = createLanguageSessionSync({ manifest: lowered.manifest })
    expect(language.tokenFamilies().families).toContainEqual({
      utility: 'text-decoration', prefix: 'text-decoration', namespace: 'color', argument: 'value', properties: ['text-decoration-color']
    })
    const css = createTestCSS(lowered.manifest)
    expect(css.createRule('text-decoration-accent')?.text).toContain('{text-decoration-color:var(--color-accent)}')
    expect(css.createRule('text-gradient')?.text).toContain('{-webkit-text-fill-color:transparent;background-clip:text}')
  })

  it.each(['font-antialiased', 'font-smoothing-auto', 'font-subpixel-antialiased', 'text-gradient'])('%s has no preset definition or call syntax', (name) => {
    const css = createTestCSS(manifest)
    expect(manifest.utilities?.some(utility => utility.name === name)).toBe(false)
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
