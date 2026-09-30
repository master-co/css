import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import { compileCSSManifest, compileCSSManifestFile } from '../src/node-compiler'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'

const baseManifest = { version: 4 as const, languageVersion: 11 as const }
const source = `
@layer theme, base, defaults, components, utilities;
@theme {
  --color-base: red;
  --color-brand: white;
  [data-theme=dark] { --color-brand: black; }
}
@layer theme {
  :root, :host { --color-alias: var(--color-base); --spacing-card: 2rem; }
  [data-theme=ocean] { --color-brand: blue; }
}
`

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding}: native aliases retain managed dependencies without managed ownership`, async () => {
    const options = { baseManifest, classNames: ['bg-alias', 'bg-brand', 'p-card'] }
    const result = binding === 'native'
      ? await compileRenderedStylesheet('/theme.css', source, { baseManifest, classes: options.classNames })
      : await compileBrowserStylesheet(source, options)
    expect(result.generatedCSS).toContain('--color-base:red')
    expect(result.generatedCSS).toContain('[data-theme=dark]{--color-brand:black}')
    expect(result.generatedCSS).toContain('background-color:var(--color-alias)')
    expect(result.generatedCSS).toContain('padding:var(--spacing-card)')
    expect(result.generatedCSS).not.toContain('--color-alias:')
    expect(result.generatedCSS).not.toContain('--spacing-card:')
    expect(result.generatedCSS).not.toContain('[data-theme=ocean]')
    expect(result.nativeCSS).toContain('--color-alias:')
    expect(result.emittedGlobals.variables).toEqual({ 'color-base': expect.any(Number), 'color-brand': expect.any(Number) })
    const alias = result.manifest.variables?.color?.find(token => token.key === 'alias')
    expect(alias?.values).toEqual([{ path: ['@layer theme', ':root, :host'], value: 'var(--color-base)', delivery: 'native' }])

    using language = createLanguageSessionSync({ manifest: result.manifest })
    expect(language.inspectClassName('bg-alias')).toMatchObject({ matchStatus: 'matched' })
    expect(language.inspectClassName('p-card')).toMatchObject({ matchStatus: 'matched' })
    expect(language.inspectClassName('bg-missing')).toMatchObject({ matchStatus: 'syntax-error' })
    expect(JSON.stringify(language.completionIndex())).toContain('color-alias')
  })

  test(`${binding}: unused native tokens still ship and native declarations retain managed tokens`, async () => {
    const css = '@theme{--color-base:red;--color-unused:blue}:root{--color-alias:var(--color-base);--color-static:green}'
    const result = binding === 'native'
      ? await compileRenderedStylesheet('/theme.css', css, { baseManifest })
      : await compileBrowserStylesheet(css, { baseManifest })
    expect(result.generatedCSS).toContain('--color-base:red')
    expect(result.generatedCSS).not.toContain('--color-unused:')
    expect(result.nativeCSS).toContain('--color-static:')
    expect(result.emittedGlobals.variables).toEqual({ 'color-base': expect.any(Number) })
  })
}

test('base managed tokens and native overrides retain both deliveries', () => {
  const base = compileCSSManifest('@theme{--color-brand:white}', { baseManifest }).manifest
  const result = compileCSSManifest('[data-theme=ocean]{--color-brand:blue}', { baseManifest: base })
  expect(result.manifest.variables?.color?.[0].values).toEqual([
    { path: [':root,:host'], value: 'white' },
    { path: ['[data-theme=ocean]'], value: 'blue', delivery: 'native' }
  ])
  expect(result.manifest.theme).toEqual(base.theme)
})

test('non-ASCII defaults preserve following scopes and keyframes across bindings', async () => {
  const source = '@theme{--label:"😀夜";[data-theme=夜]{--color-brand:red}@keyframes turn{to{opacity:1}}}'
  const native = compileCSSManifest(source, { baseManifest })
  const wasm = await compileBrowserStylesheet(source, { baseManifest, classNames: ['bg-brand', 'animation-name:turn'] })
  expect(wasm.manifest).toEqual(native.manifest)
  expect(wasm.generatedCSS).toContain('[data-theme=夜]{--color-brand:red}')
  expect(wasm.generatedCSS).toContain('@keyframes turn{to{opacity:1}}')
})

test('qualified imports retain token scope paths and references only supply resolution context', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-native-theme-'))
  try {
    const tokens = join(root, 'tokens.css')
    const entry = join(root, 'entry.css')
    writeFileSync(tokens, ':root{--color-brand:red}')
    writeFileSync(entry, '@import "./tokens.css" layer(theme) supports(display: grid) screen;')
    const imported = compileCSSManifestFile(entry, { baseManifest })
    expect(imported.manifest.variables?.color?.[0].values[0]).toMatchObject({
      path: ['@supports (display: grid)', '@media screen', '@layer theme', ':root'], delivery: 'native'
    })
    expect(imported.css).toContain('--color-brand:')
    writeFileSync(entry, '@reference "./tokens.css";.local{color:var(--color-brand)}')
    const referenced = compileCSSManifestFile(entry, { baseManifest })
    expect(referenced.resolutionManifest?.variables?.color?.[0].values[0].delivery).toBe('native')
    expect(referenced.manifest.variables?.color).toBeUndefined()
    expect(referenced.css).not.toContain('--color-brand:')
    expect(referenced.css).toMatch(/color:\s*var\(--color-brand\)/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
