import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import { compileCSSManifest, compileCSSManifestFile } from '../src/node-compiler'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

const baseManifest = { version: 4 as const, languageVersion: 13 as const }
const source = `
@mixin --bg(--color){background-color:var(--color)}
@mixin --p(--spacing){padding:var(--spacing)}
@theme { --color-base: red; --color-brand: white; }
@theme inline { --color-alias: var(--color-base); --spacing-card: 2rem; }
@theme static { --color-integration: green; }
:root { --color-native: blue; }
[data-theme=ocean] { --color-brand: blue; }
`

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding}: only theme tokens register and inline values share dependencies`, async () => {
    const classes = ['bg-alias', 'bg-brand', 'p-card']
    const result = binding === 'native'
      ? await compileRenderedStylesheet('/theme.css', source, { baseManifest, classes })
      : await compileBrowserStylesheet(source, { baseManifest, classNames: classes })
    expect(result.generatedCSS).toContain('--color-base:red')
    expect(result.generatedCSS).toContain('--color-integration:green')
    expect(result.generatedCSS).toContain('background-color:var(--color-base)')
    expect(result.generatedCSS).toContain('padding:2rem')
    expect(result.generatedCSS).not.toContain('--color-alias:')
    expect(result.generatedCSS).not.toContain('--spacing-card:')
    expect(result.generatedCSS).not.toContain('[data-theme=ocean]')
    expect(result.nativeCSS).toContain('--color-native:')
    using language = createLanguageSessionSync({ manifest: result.manifest })
    expect(language.inspectClassName('bg-alias')).toMatchObject({ matchStatus: 'matched' })
    expect(language.inspectClassName('bg-native')).toMatchObject({ matchStatus: 'syntax-error' })
    expect(JSON.stringify(language.completionIndex())).not.toContain('color-native')
  })

  test(`${binding}: static emits without classes and native var references retain inline tokens`, async () => {
    const css = '@theme static{--color-fixed:green}@theme inline{--color-alias:var(--app-color)}.card{color:var(--color-alias)}'
    const result = binding === 'native'
      ? await compileRenderedStylesheet('/theme.css', css, { baseManifest })
      : await compileBrowserStylesheet(css, { baseManifest })
    expect(result.generatedCSS).toContain('--color-fixed:green')
    expect(result.generatedCSS).toContain('--color-alias:var(--app-color)')
    expect(result.nativeCSS).toContain('var(--color-alias)')
  })
}

test('native overrides do not alter token definitions', () => {
  const base = compileCSSManifest('@theme{--color-brand:white}', { baseManifest }).manifest
  const result = compileCSSManifest('[data-theme=ocean]{--color-brand:blue}', { baseManifest: base })
  expect(result.manifest.variables).toEqual(base.variables)
  expect(result.manifest.theme).toEqual(base.theme)
})

test('references supply theme definitions without static roots or native registration', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-theme-'))
  try {
    const tokens = join(root, 'tokens.css')
    const entry = join(root, 'entry.css')
    writeFileSync(tokens, '@theme static{--color-brand:red;--color-unused:blue}:root{--color-native:green}')
    writeFileSync(entry, '@reference "./tokens.css";.local{color:var(--color-brand)}')
    const referenced = compileCSSManifestFile(entry, { baseManifest })
    expect(referenced.manifest.variables?.color).toBeUndefined()
    expect(referenced.resolutionManifest?.variables?.color?.find(token => token.key === 'native')).toBeUndefined()
    const result = await compileRenderedStylesheet(entry, '@reference "./tokens.css";.local{color:var(--color-brand)}', { baseManifest })
    expect(result.generatedCSS).toContain('--color-brand:red')
    expect(result.generatedCSS).not.toContain('--color-unused:')
    expect(result.css).not.toContain('--color-native:')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding}: theme diagnostics keep exact UTF-16 modifier and property ranges`, async () => {
    for (const [css, token] of [
      ['/*😀*/@theme{--label:夜;color:red}', 'color'],
      ['/*😀*/@theme unknown{--label:夜}', 'unknown'],
      ['/*😀*/@theme static static{--label:夜}', 'static'],
      ['/*😀*/@theme{--label:夜;@media all{--x:red}}', '@media']
    ]) {
      const start = css.lastIndexOf(token)
      const compile = binding === 'native'
        ? compileRenderedStylesheet('/theme.css', css, { baseManifest })
        : compileBrowserStylesheet(css, { baseManifest, from: '/theme.css' })
      await expect(compile).rejects.toMatchObject({
        diagnostics: [expect.objectContaining({ range: {
          start: { line: 0, character: start }, end: { line: 0, character: start + token.length }
        } })]
      })
    }
  })
}

test('imported static resources emit once across native and generated consumers', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-static-import-'))
  try {
    writeFileSync(join(root, 'tokens.css'), '@mixin --animate(--animate){animation:var(--animate)}@theme static inline{--animate-reveal:reveal 1s;@keyframes reveal{to{opacity:1}}@keyframes unused{to{opacity:0}}}')
    const entry = join(root, 'entry.css')
    const css = '@import "./tokens.css";.native{animation:var(--animate-reveal)}'
    writeFileSync(entry, css)
    const result = await compileRenderedStylesheet(entry, css, { baseManifest, classes: ['animate-reveal'] })
    expect(result.css.match(/--animate-reveal:/g)).toHaveLength(1)
    expect(result.css.match(/@keyframes reveal/g)).toHaveLength(1)
    expect(result.css).not.toContain('@keyframes unused')
    expect(result.nativeCSS).toContain('var(--animate-reveal)')
    expect(result.generatedCSS).toContain('animation:reveal 1s')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
