import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  compileCSSManifest,
  createManifestFromCSSResult,
  resolveMasterCSSPackageImportGraph
} from '../../src/node-compiler'
import { MasterCSSScanner } from '../helpers/scanner'
import {
  compileStylesheet,
  compileRenderedStylesheet,
  createStyleEntryEmittedGlobals,
  createStylesheetHostSource,
  createMasterCSSPackageHostSource,
  createExtractedCSS,
  createExtractedCSSResult,
  collectStylesheetDependencies,
  cleanStyleRequest,
  getNativeCSS,
  hasPreserveNativeDirective,
  hasMasterStyleEntrypoint,
  hasLocalStyleDirectives,
  isMasterStyleSource,
  isStylesheetRequest,
  removeMasterStyleDirectives,
  removeStylesheetImports,
  registerStylesheetSource,
  resolveMasterStyleSource,
  resolveStylesheetImportGraph,
  replaceStylesheetImports,
  transformLocalStylesheet
} from '../../src/stylesheet'
import { renderCompiledManifestCSS } from '../../src/stylesheet/render'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-stylesheet-'))
  mkdirSync(join(root, 'app'), { recursive: true })
  return root
}

describe('style CSS extraction helpers', () => {
  it('normalizes native CSS line endings while rendering managed CSS', () => {
    const result = renderCompiledManifestCSS({
      manifest: defaultManifest,
      nativeCSS: [
        '.card {\r\n    color: red;\r\n}',
        '.button {\r    color: blue;\r}'
      ],
      includeGeneratedCSS: false
    })

    expect(result.nativeCSS).toBe([
      '.card {\n    color: red;\n}',
      '.button {\n    color: blue;\n}'
    ].join('\n\n'))
    expect(result.css).toBe(result.nativeCSS)
  })

  it('ignores native CSS variable references inside comments and strings while emitting real references', () => {
    const result = renderCompiledManifestCSS({
      manifest: defaultManifest,
      nativeCSS: [
        '.quoted { content: "var(--color-blue-60)"; }',
        '/* var(--color-red-60) */',
        '.real { color: var(--color-green-60); }'
      ],
      includeGeneratedCSS: false
    })

    expect(result.generatedCSS).toContain('--color-green-60')
    expect(result.generatedCSS).not.toContain('--color-blue-60')
    expect(result.generatedCSS).not.toContain('--color-red-60')
  })

  it('preserves existing emitted resource counts and increments native keyframes', () => {
    const result = renderCompiledManifestCSS({
      manifest: defaultManifest,
      nativeCSS: [
        '.native { color: var(--color-green-60); }',
        '@keyframes fade { to { opacity: .5; } }'
      ],
      emittedGlobals: {
        variables: { 'color-green-60': 2 },
        animations: { fade: 2 }
      }
    })

    expect(result.emittedGlobals.variables['color-green-60']).toBe(2)
    expect(result.emittedGlobals.animations.fade).toBe(3)
    expect(result.generatedCSS).not.toContain('--color-green-60')
    expect(result.generatedCSS).not.toContain('@keyframes fade')
  })

  it('emits theme variables referenced by compiled stylesheet --alpha() values', () => {
    const compiled = compileCSSManifest(`
      @theme {
        --color-primary: #ff0000;
      }

      .native {
        color: --alpha(var(--color-primary) / 50%);
      }
    `, { baseManifest: defaultManifest })
    const result = renderCompiledManifestCSS({
      manifest: compiled.manifest,
      nativeCSS: compiled.nativeCSS,
      includeGeneratedCSS: false
    })

    expect(result.nativeCSS).toContain('color-mix(in oklab,var(--color-primary) 50%,transparent)')
    expect(result.generatedCSS).toContain('--color-primary:red')
  })

  it('replaces @master/css imports with CSS import modifiers', () => {
    const result = replaceStylesheetImports([
      '@import "@master/css" layer(master);',
      '@import url(\'master.css\') layer(master);',
      '@import "./other.css";'
    ].join('\n'), '/* master */')

    expect(result.replaced).toBe(true)
    expect(result.code).toContain('/* master */')
    expect(result.code).not.toContain('@master/css')
    expect(result.code).toContain('@import url(\'master.css\') layer(master);')
    expect(result.code).toContain('@import "./other.css";')
  })

  it('renders native CSS and keyframes from expanded Master CSS entry graphs', async () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const homePath = join(root, 'app/home.css')
    writeFileSync(homePath, [
      '@theme { --color-active: #ff0000; }',
      '@components { active-card { animation: active-spin 1s infinite; } }',
      '@keyframes active-spin { to { opacity: .5; } }',
      '.native-card { color: var(--color-active); }'
    ].join('\n'))
    const source = [
      '@import "@master/css";',
      '@import "./home.css";'
    ].join('\n')
    const resolvedSource = resolveMasterStyleSource(entryPath, source, root)
    expect(resolvedSource?.source).toContain('@keyframes active-spin')

    const result = await compileRenderedStylesheet(entryPath, resolvedSource?.source || source, {
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.css).toContain('@keyframes active-spin')
    expect(result.css).toContain('.native-card')
    expect(result.css).toContain('--color-active:red')
    expect(result.css).not.toContain('@components')
    expect(result.css).not.toContain('@import "./home.css"')
    expect(result.generatedCSS).toContain('--color-active:red')
    expect(result.emittedGlobals.variables).toMatchObject({
      'color-active': 1
    })
    expect(result.emittedGlobals.animations).toMatchObject({
      'active-spin': 1
    })
  })

  it('detects Master CSS entrypoints and preservation directives separately', () => {
    expect(hasMasterStyleEntrypoint('@import "@master/css";')).toBe(true)
    expect(hasMasterStyleEntrypoint('@master entry;')).toBe(true)
    expect(hasMasterStyleEntrypoint('@master;')).toBe(false)
    expect(hasMasterStyleEntrypoint('@master global;')).toBe(false)
    expect(hasMasterStyleEntrypoint('@master shake;')).toBe(false)
    expect(hasMasterStyleEntrypoint('@preserve native;')).toBe(false)
    expect(hasMasterStyleEntrypoint('@theme { --color-primary: red; }')).toBe(false)
    expect(hasMasterStyleEntrypoint('@import "./other.css";')).toBe(false)
    expect(isMasterStyleSource('@theme { --color-primary: red; }')).toBe(false)
    expect(isMasterStyleSource('@import "@master/css";')).toBe(true)
    expect(isMasterStyleSource(resolveStylesheetImportGraph(
      join(createFixture(), 'app/globals.css'),
      '@import "@master/css";',
      undefined,
      { expandMasterCSSPackage: false }
    ).source)).toBe(true)
    expect(isMasterStyleSource('@import "virtual:master-utilities.css";')).toBe(false)
    expect(isMasterStyleSource('@import "master.css";')).toBe(false)
    expect(isMasterStyleSource('@master entry;')).toBe(true)
    expect(isMasterStyleSource('@master;')).toBe(false)
    expect(isMasterStyleSource('@master global;')).toBe(false)
    expect(isMasterStyleSource('@master shake;')).toBe(false)
    expect(isMasterStyleSource('@master no-shake;')).toBe(false)
    expect(isMasterStyleSource('@preserve native;')).toBe(false)
    expect(isMasterStyleSource('@import "./other.css";')).toBe(false)
    expect(hasPreserveNativeDirective('@preserve native;\n.card { color: red; }')).toBe(true)
    expect(hasPreserveNativeDirective('@master no-shake;\n.card { color: red; }')).toBe(false)
  })

  it('detects local compose styles without treating them as Master entries', () => {
    expect(hasLocalStyleDirectives('.card { @compose block; }')).toBe(true)
    expect(hasLocalStyleDirectives('.card { @variant print { color: red; } }')).toBe(true)
    expect(hasLocalStyleDirectives('.card { @dark { color: red; } }')).toBe(true)
    expect(hasLocalStyleDirectives('.card { @slot; }')).toBe(false)
    expect(hasLocalStyleDirectives('.card { color: red; }')).toBe(false)
    expect(isStylesheetRequest('/project/src/Button.module.css')).toBe(true)
    expect(isStylesheetRequest('/project/src/Button.vue?vue&type=style&index=0&lang.css')).toBe(true)
    expect(isMasterStyleSource('.card { @compose block; }')).toBe(false)
  })

  it('preserves Windows extended-length path prefixes while cleaning style requests', () => {
    const paths = [
      '//?/C:/workspace/index.css',
      '\\\\?\\C:\\workspace\\index.css',
      '//?/UNC/server/share/index.css',
      '\\\\?\\UNC\\server\\share\\index.css'
    ]

    for (const path of paths) {
      expect(cleanStyleRequest(path)).toBe(path)
      expect(cleanStyleRequest(`${path}?inline`)).toBe(path)
      expect(cleanStyleRequest(`${path}#fragment`)).toBe(path)
      expect(isStylesheetRequest(`${path}?inline`)).toBe(true)
    }
  })

  it('collects best-effort style dependencies from local import graphs', () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')
    const tokenPath = join(root, 'app/tokens.css')
    writeFileSync(tokenPath, '@components { card { display: block; } }')
    writeFileSync(entryPath, '@master entry;\n@import "./tokens.css";')

    expect(collectStylesheetDependencies(entryPath, undefined, root)).toEqual([
      entryPath,
      tokenPath
    ])
  })

  it('keeps direct style dependencies when dependency graph resolution fails', () => {
    const root = createFixture()
    const entryPath = join(root, 'app/globals.css')

    expect(collectStylesheetDependencies(entryPath, '@master entry;\n@import "./missing.css";', root)).toEqual([
      entryPath
    ])
    expect(collectStylesheetDependencies(join(root, 'app/missing.css'), undefined, root)).toEqual([
      join(root, 'app/missing.css')
    ])
  })

  it('locally lowers @compose using the provided project context', async () => {
    const { manifest } = compileCSSManifest('@utilities { brand { color: #fff; } }', {
      baseManifest: defaultManifest
    })
    const result = await transformLocalStylesheet('/project/src/Button.module.css', `
      .button {
        @compose inline-flex brand;
        color: white;
      }
    `, {
      baseManifest: manifest
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.button{')
    expect(result.code).toContain('display:inline-flex')
    expect(result.code).toContain('color:#fff')
    expect(result.code).not.toContain('@compose')
  })

  it('locally lowers explicit @reference styles without emitting referenced CSS', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, [
      '@components {',
      '  brand { background-color: #123456; }',
      '}',
      '.referenced-native { color: red; }'
    ].join('\n'))

    const result = await transformLocalStylesheet(modulePath, `
      @reference "./tokens.css";

      .button {
        @compose brand;
      }
    `, {
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.button{background-color:#123456}')
    expect(result.code).not.toContain('@reference')
    expect(result.code).not.toContain('referenced-native')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('emits referenced theme variables and keyframes used by local styles', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, [
      '@theme {',
      '  --spacing-card: 2rem;',
      '',
      '  @keyframes pop {',
      '    to { opacity: 1; }',
      '  }',
      '}',
      '@components {',
      '  panel {',
      '    padding: var(--spacing-card);',
      '    animation: pop 1s;',
      '  }',
      '}',
      '.referenced-native { color: red; }'
    ].join('\n'))

    const result = await transformLocalStylesheet(modulePath, `
      @reference "./tokens.css";

      .page-panel {
        @compose panel;
      }
    `, {
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.page-panel{padding:var(--spacing-card);animation:1s pop}')
    expect(result.code).toContain('--spacing-card:2rem')
    expect(result.code).toContain('@keyframes pop')
    expect(result.code).not.toContain('@reference')
    expect(result.code).not.toContain('referenced-native')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('skips referenced theme variables and keyframes already emitted by global CSS', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Button.module.css')
    writeFileSync(tokenPath, [
      '@theme {',
      '  --spacing-card: 2rem;',
      '',
      '  @keyframes pop {',
      '    to { opacity: 1; }',
      '  }',
      '}',
      '@components {',
      '  panel {',
      '    padding: var(--spacing-card);',
      '    animation: pop 1s;',
      '  }',
      '}'
    ].join('\n'))

    const result = await transformLocalStylesheet(modulePath, `
      @reference "./tokens.css";

      .page-panel {
        @compose panel;
      }
    `, {
      baseManifest: defaultManifest,
      projectDir: root,
      emittedGlobals: {
        variables: { 'spacing-card': 1 },
        animations: { pop: 1 }
      }
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.page-panel{padding:var(--spacing-card);animation:1s pop}')
    expect(result.code).not.toContain('--spacing-card:2rem')
    expect(result.code).not.toContain('@keyframes pop')
    expect(result.code).not.toContain('@reference')
  })

  it('emits default preset variables used by local styles referencing a globals entry', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, '@import "@master/css";')

    const result = await transformLocalStylesheet(pagePath, `
      @reference "./globals.css";

      .home-section {
        @compose py:5xl;
      }
    `, {
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.home-section{padding-block:var(--spacing-5xl)}')
    expect(result.code).toContain('--spacing-5xl:')
    expect(result.code).not.toContain('@reference')
    expect(result.code).not.toContain('@master/css')
    expect(result.dependencies).toContain(pagePath)
    expect(result.dependencies).toContain(globalsPath)
  })

  it('dedupes default preset variables already emitted by a globals entry snapshot', async () => {
    const root = createFixture()
    const globalsPath = join(root, 'app/globals.css')
    const pagePath = join(root, 'app/page.css')
    writeFileSync(globalsPath, [
      '@import "@master/css";',
      '.global-section { padding-block: var(--spacing-5xl); }'
    ].join('\n'))

    const globalResult = await createStyleEntryEmittedGlobals([globalsPath], {
      baseManifest: defaultManifest,
      projectDir: root
    })
    const result = await transformLocalStylesheet(pagePath, `
      @reference "./globals.css";

      .home-section {
        @compose py:5xl;
      }
    `, {
      baseManifest: defaultManifest,
      projectDir: root,
      emittedGlobals: globalResult.emittedGlobals
    })

    expect(globalResult.emittedGlobals.variables).toHaveProperty('spacing-5xl')
    expect(globalResult.dependencies).toContain(globalsPath)
    expect(result.transformed).toBe(true)
    expect(result.code).toContain('.home-section{padding-block:var(--spacing-5xl)}')
    expect(result.code).not.toContain('--spacing-5xl:')
    expect(result.code).not.toContain('@reference')
  })

  it('strips reference-only local styles and still reports dependencies', async () => {
    const root = createFixture()
    const tokenPath = join(root, 'app/tokens.css')
    const modulePath = join(root, 'app/Empty.module.css')
    writeFileSync(tokenPath, '@components { brand { display: block; } }')

    const result = await transformLocalStylesheet(modulePath, '@reference "./tokens.css";', {
      baseManifest: defaultManifest,
      projectDir: root
    })

    expect(result.transformed).toBe(true)
    expect(result.code).toBe('')
    expect(result.dependencies).toContain(modulePath)
    expect(result.dependencies).toContain(tokenPath)
  })

  it('leaves ordinary local CSS unchanged', async () => {
    const source = '.button { color: red; }'
    const result = await transformLocalStylesheet('/project/src/Button.module.css', source, {
      baseManifest: defaultManifest
    })

    expect(result.transformed).toBe(false)
    expect(result.code).toBe(source)
  })

  it('resolves Master style sources through the stylesheet import graph', () => {
    const root = createFixture()
    const result = resolveMasterStyleSource(
      join(root, 'app/globals.css'),
      '@import "@master/css";',
      root
    )

    expect(result?.source).toContain('@layer base')
    expect(result?.source).not.toContain('@master entry;')
    expect(result?.dependencies).toContain(join(root, 'app/globals.css'))
    expect(result?.dependencies.filter((dependency) => !dependency.startsWith(root)).length).toBeGreaterThan(0)
    expect(resolveMasterStyleSource(
      join(root, 'app/theme.css'),
      '@theme { --color-primary: red; }',
      root
    )).toBeUndefined()
    expect(resolveMasterStyleSource(
      join(root, 'app/main.ts'),
      '@import "@master/css";',
      root
    )).toBeUndefined()
    expect(resolveMasterStyleSource(
      join(root, 'app/regular.css'),
      '@import "./missing.css";',
      root
    )).toBeUndefined()
    expect(() => resolveMasterStyleSource(
      join(root, 'app/entry.css'),
      '@master entry;\n@import "./missing.css";',
      root
    )).toThrow('CSS file not found')
  })

  it('derives package host CSS from the package entry graph', async () => {
    const hostSource = await createMasterCSSPackageHostSource(process.cwd(), {
      baseManifest: defaultManifest,
      projectDir: process.cwd()
    })
    const graph = resolveMasterCSSPackageImportGraph(process.cwd())
    const compileSource = removeMasterStyleDirectives(removeStylesheetImports(graph.source).code).code
    const compiledResult = await compileStylesheet(graph.dependencies[0] || '@master/css', compileSource, {
      baseManifest: defaultManifest,
      projectDir: process.cwd(),
      preserveNativeCSS: true
    })
    const finalizedResult = createManifestFromCSSResult(compiledResult, {
      baseManifest: defaultManifest,
      root: process.cwd()
    })
    const expectedCSS = renderCompiledManifestCSS({
      manifest: finalizedResult.manifest,
      nativeCSS: getNativeCSS(finalizedResult)
    }).css

    expect(hostSource.dependencies.length).toBeGreaterThan(1)
    expect(hostSource.dependencies.some((dependency) => dependency.endsWith('default-manifest.json'))).toBe(false)
    expect(hostSource.dependencies.some((dependency) => dependency.endsWith('default-native.css'))).toBe(false)
    expect(hostSource.source).toBe(expectedCSS)
    expect(hostSource.source).toContain('@layer base')
    expect(hostSource.source).toContain('text-rendering: geometricprecision')
    expect(hostSource.source).toContain('--font-family-sans:var(--font-sans, ui-sans-serif)')
    expect(hostSource.source).toContain('--font-family-mono:var(--font-mono, ui-monospace)')
    expect(hostSource.source).not.toContain('@master/css/base.css')
    expect(hostSource.source).not.toContain('virtual:master-utilities.css')
    expect(hostSource.source).not.toContain('@master')
  })

  it('does not load preset artifacts implicitly while registering stylesheets', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    const result = await registerStylesheetSource(
      scanner,
      stylesheetSources,
      join(root, 'app/globals.css'),
      '@import "@master/css";',
      { baseManifest: defaultManifest }
    )

    expect(result.dependencies.some((dependency: string) => dependency.endsWith('default-manifest.json'))).toBe(false)
    expect(result.dependencies.some((dependency: string) => dependency.endsWith('default-native.css'))).toBe(false)
  })

  it('tracks default package artifacts as style dependencies', async () => {
    const root = createFixture()
    const scanner = new MasterCSSScanner({}, root)
    await scanner.init()

    const stylesheetSources = new Map()
    const result = await registerStylesheetSource(
      scanner,
      stylesheetSources,
      join(root, 'app/globals.css'),
      '@import "@master/css";',
      { baseManifest: defaultManifest }
    )

    expect(result.dependencies.some((dependency: string) => dependency.endsWith('default-manifest.json'))).toBe(false)
    expect(result.dependencies.some((dependency: string) => dependency.endsWith('default-native.css'))).toBe(false)
  })

})
