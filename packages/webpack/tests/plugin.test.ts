/**
 * Regression tests for the C1 race in MasterCSSPlugin.
 *
 * The previous implementation attached an `async` callback to
 * `compilation.hooks.succeedModule` via `.tap()`. `succeedModule` is a
 * tapable `SyncHook` — it does NOT await promises. Webpack therefore
 * proceeded to `emit` while `scanner.scanModule()` was still running,
 * producing CSS output that was missing classes from late-arriving
 * modules.
 *
 * The fix moves the `await`-bearing work to `finishModules` (an
 * `AsyncSeriesHook`) via `.tapPromise()`, so webpack blocks on every
 * pending scan before it processes assets / emits.
 *
 * These tests demonstrate the race using real tapable hooks (rather
 * than the full webpack runtime), and assert the new ordering.
 */
import { describe, test, expect, vi } from 'vitest'
import { SyncHook, AsyncSeriesHook } from 'tapable'
import MasterCSSPlugin from '../src'
import { VIRTUAL_MANIFEST_ID, MASTER_CSS_MANIFEST_QUERY } from '@master/css-integration/manifest-module'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-integration/emitted-globals-module'
import { createStylesheetDirectives } from '@master/css-stylesheet'
import { transformStyleSource } from '../src/utils/transform-style-source'
import masterCSSStyleCSSLoader from '../src/style-css-loader'
import { addFileDependency } from '../src/utils/file-dependencies'
import path from 'node:path'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

// Build a minimal compiler / compilation pair whose hooks behave the
// way webpack@5 declares them. Includes the hooks VirtualModulesPlugin
// needs (afterEnvironment / afterResolvers / watchRun) so its apply()
// call inside the plugin doesn't blow up.
function makeFakeCompiler(options: {
  context?: string
  modifiedFiles?: Set<string>
  mode?: 'development' | 'production' | 'none'
  assets?: Record<string, { source: () => string }>
  entryFiles?: string[]
  publicPath?: string
  outputModule?: boolean
} = {}) {
  const entryPluginCalls: unknown[][] = []
  const assets = options.assets || {}
  const compilation = {
    fileDependencies: new Set<string>(),
    entrypoints: new Map(options.entryFiles ? [[
      'master-css-runtime',
      {
        getFiles: () => options.entryFiles || []
      }
    ]] : []),
    outputOptions: {
      publicPath: options.publicPath,
      module: options.outputModule
    },
    emitAsset: vi.fn((fileName: string, source: { source: () => string }) => {
      assets[fileName] = source
    }),
    updateAsset: vi.fn((fileName: string, source: { source: () => string }) => {
      assets[fileName] = source
    }),
    hooks: {
      succeedModule: new SyncHook<[unknown]>(['module']),
      finishModules: new AsyncSeriesHook<[Iterable<unknown>]>(['modules']),
      processAssets: new SyncHook<[Record<string, { source: () => string }>]>(['assets']),
    },
  }
  const compiler = {
    hooks: {
      initialize: new SyncHook<[]>([]),
      beforeRun: new AsyncSeriesHook<[unknown]>(['compiler']),
      watchRun: new AsyncSeriesHook<[unknown]>(['compiler']),
      afterEnvironment: new SyncHook<[]>([]),
      afterResolvers: new SyncHook<[unknown]>(['compiler']),
      thisCompilation: new SyncHook<[typeof compilation]>(['compilation']),
      normalModuleFactory: new SyncHook<[unknown]>(['normalModuleFactory']),
    },
    context: options.context || process.cwd(),
    modifiedFiles: options.modifiedFiles,
    options: {
      mode: options.mode,
      module: {
        rules: []
      },
      output: {
        publicPath: options.publicPath,
        module: options.outputModule
      }
    },
    webpack: {
      EntryPlugin: class FakeEntryPlugin {
        constructor(...args: unknown[]) {
          entryPluginCalls.push(args)
        }

        apply() {}
      },
      Compilation: {
        PROCESS_ASSETS_STAGE_ADDITIONS: -100,
        PROCESS_ASSETS_STAGE_OPTIMIZE: 100
      },
      sources: {
        RawSource: class RawSource {
          constructor(private value: string) {}

          source() {
            return this.value
          }
        }
      }
    },
    inputFileSystem: {
      _writeVirtualFile: vi.fn()
    },
    resolverFactory: { hooks: { resolver: { for: () => ({ tap: () => {} }) } } },
  }
  return { compiler, compilation, assets, entryPluginCalls }
}

function makeNormalModuleFactory(resolvedPath?: string) {
  return {
    hooks: {
      beforeResolve: new AsyncSeriesHook<[any]>(['resolveData']),
    },
    getResolver: () => ({
      resolve: (
        _contextInfo: unknown,
        _context: string,
        _request: string,
        _resolveContext: unknown,
        callback: (error: null | Error, result?: string | false) => void
      ) => {
        callback(null, resolvedPath)
      }
    })
  }
}

function resolveBefore(normalModuleFactory: ReturnType<typeof makeNormalModuleFactory>, resolveData: any) {
  return new Promise<void>((resolve, reject) => {
    normalModuleFactory.hooks.beforeResolve.callAsync(resolveData, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function makeModule(resourcePath: string, source: string) {
  return {
    resourceResolveData: { path: resourcePath },
    _source: { source: () => source },
  }
}

// Construct a plugin whose scanner side-effects are stubbed out — we
// only want to drive the webpack hook surface. We keep the real
// constructor + init() so `this.options` is populated correctly.
function makePlugin(options: Record<string, unknown> = {}, cwd = process.cwd()) {
  const plugin = new MasterCSSPlugin({
    ...options,
  } as any, cwd)
  // webpack-virtual-modules pokes at compiler.webpack internals; stub
  // its apply() so we don't have to spin a real webpack here.
  return plugin
}

function runStyleCSSLoader(root: string, resourcePath: string, source: string) {
  const dependencies: string[] = []
  return new Promise<string>((resolve, reject) => {
    masterCSSStyleCSSLoader.call({
      resourcePath,
      rootContext: root,
      addDependency: (dependency) => dependencies.push(dependency),
      getOptions: () => ({}),
      async: () => (error, content) => {
        if (error) {
          const loaderError = error as Error & { dependencies?: string[] }
          loaderError.dependencies = dependencies
          reject(loaderError)
        } else {
          resolve(content || '')
        }
      }
    }, source)
  }).then((content) => ({ content, dependencies }))
}

function makeRegisteredStyleSource(dependencies: string[]) {
  return {
    source: '',
    pruneNativeCSS: false,
    masterCSS: false,
    directives: createStylesheetDirectives(),
    dependencies,
    sourceDependencies: []
  }
}

describe('MasterCSSPlugin (C1 race fix)', () => {
  test('exports the plugin as the default export', () => {
    expect(MasterCSSPlugin.name).toBe('MasterCSSPlugin')
  })

  test('installs a pre style loader for managed CSS entries', () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)

    expect((compiler as any).options.module.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        test: expect.any(RegExp),
        enforce: 'pre',
        use: [
          expect.objectContaining({
            loader: expect.stringContaining('style-css-loader'),
            options: expect.objectContaining({
              virtualCSSImportModuleId: expect.stringContaining('master-utilities.css')
            })
          })
        ]
      })
    ]))
  })

  test('rewrites managed CSS entries to the generated CSS virtual import', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-style-'))
    const entryPath = path.join(root, 'app.css')
    const themePath = path.join(root, 'theme.css')
    try {
      writeFileSync(themePath, '@layer components { .card { display: grid; } }')
      writeFileSync(entryPath, [
        '@master entry;',
        '@import "./theme.css";',
        '',
        '.native { color: red; }'
      ].join('\n'))

      const result = await transformStyleSource(entryPath, readFileSync(entryPath, 'utf-8'), {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toBe('@import "../node_modules/.master-css/master-utilities.css";')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(themePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps imported native CSS and keyframes in the generated CSS virtual module', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-native-css-'))
    const entryPath = path.join(root, 'app.css')
    const homePath = path.join(root, 'home.css')
    const pagePath = path.join(root, 'page.tsx')
    try {
      writeFileSync(homePath, [
        '@theme { --color-active: #ff0000; }',
        '@components { active-card { animation: active-spin 1s infinite; } }',
        '@keyframes active-spin { to { opacity: .5; } }',
        '.native-card { color: var(--color-active); }'
      ].join('\n'))
      writeFileSync(entryPath, [
        '@master entry;',
        '@import "./home.css";'
      ].join('\n'))

      const transformed = await transformStyleSource(entryPath, readFileSync(entryPath, 'utf-8'), {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })
      expect(transformed.code).toBe('@import "../node_modules/.master-css/master-utilities.css";')

      const plugin = makePlugin({}, root)
      const { compiler, compilation } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)
      compiler.hooks.thisCompilation.call(compilation)

      compilation.hooks.succeedModule.call(makeModule(entryPath, readFileSync(entryPath, 'utf-8')))
      compilation.hooks.succeedModule.call(makeModule(pagePath, '<div className="active-card native-card"></div>'))
      await compilation.hooks.finishModules.promise([])
      await compiler.hooks.beforeRun.promise(compiler)

      const virtualCSS = (compiler.inputFileSystem._writeVirtualFile as any).mock.calls
        .map((call: unknown[]) => String(call[2]))
        .reverse()
        .find((content: string) => content.includes('.active-card'))
      expect(virtualCSS).toContain('@keyframes active-spin')
      expect(virtualCSS).toContain('.native-card')
      expect(virtualCSS).toContain('--color-active:red')
      expect(virtualCSS).toContain('.active-card')
      expect(virtualCSS).not.toContain('@components')
      expect(virtualCSS).not.toContain('@import "./home.css"')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('scans modules that expose source through originalSource()', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-rspack-source-'))
    try {
      const plugin = await new MasterCSSPlugin({ verbose: 0 }, root).init()
      const { compiler, compilation } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      compiler.hooks.thisCompilation.call(compilation)
      compilation.hooks.succeedModule.call({
        resource: path.join(root, 'src/main.js'),
        originalSource: () => ({
          source: () => 'document.body.className = "block"'
        })
      })
      await compilation.hooks.finishModules.promise([])

      expect([...plugin.validClasses]).toContain('block')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('locally lowers @compose in CSS Modules without rewriting to the virtual CSS import', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-local-compose-'))
    const entryPath = path.join(root, 'app.css')
    const modulePath = path.join(root, 'Button.module.css')
    try {
      writeFileSync(entryPath, [
        '@master entry;',
        '@components {',
        '  brand { background-color: #123456; }',
        '}'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '.button { @compose inline-flex brand; color: white; }', {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toContain('.button{')
      expect(result.code).toContain('display:inline-flex')
      expect(result.code).toContain('background-color:#123456')
      expect(result.code).toContain('color:#fff')
      expect(result.code).not.toContain('@compose')
      expect(result.code).not.toContain('master-utilities.css')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('dedupes local theme variables already emitted by global style entries', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-local-dedupe-'))
    const entryPath = path.join(root, 'app.css')
    const modulePath = path.join(root, 'Home.module.css')
    try {
      writeFileSync(entryPath, [
        '@import "@master/css";',
        '.global-section { padding-block: var(--spacing-5xl); }'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '.home { @compose py:5xl; }', {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toContain('.home{padding-block:var(--spacing-5xl)}')
      expect(result.code).not.toContain('--spacing-5xl:')
      expect(result.code).not.toContain('master-utilities.css')
      expect(result.dependencies).toContain(entryPath)
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('style loader keeps local style dependencies registered after invalid @compose', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-loader-invalid-'))
    const modulePath = path.join(root, 'Button.module.css')
    try {
      let error: Error & { dependencies?: string[] } | undefined
      try {
        await runStyleCSSLoader(root, modulePath, '.button { @compose bg:neutral-120; }')
      } catch (caught) {
        error = caught as Error & { dependencies?: string[] }
      }

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toContain('Invalid @compose class')
      expect(error?.dependencies).toContain(modulePath)

      const result = await runStyleCSSLoader(root, modulePath, '.button { @compose block; }')
      expect(result.content).toContain('.button{display:block}')
      expect(result.dependencies).toContain(modulePath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('locally lowers explicit @reference CSS Modules and reports reference dependencies', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-reference-'))
    const modulePath = path.join(root, 'Button.module.css')
    const tokenPath = path.join(root, 'tokens.css')
    try {
      writeFileSync(tokenPath, [
        '@theme {',
        '  --spacing-card: 2rem;',
        '',
        '  @keyframes pop {',
        '    to { opacity: 1; }',
        '  }',
        '}',
        '@components {',
        '  brand {',
        '    padding: var(--spacing-card);',
        '    animation: pop 1s;',
        '  }',
        '}',
        '.referenced-native { color: red; }'
      ].join('\n'))

      const result = await transformStyleSource(modulePath, '@reference "./tokens.css"; .button { @compose brand; }', {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toContain('.button{padding:var(--spacing-card);animation:1s pop}')
      expect(result.code).toContain('--spacing-card:2rem')
      expect(result.code).toContain('@keyframes pop')
      expect(result.code).not.toContain('@reference')
      expect(result.code).not.toContain('referenced-native')
      expect(result.code).not.toContain('master-utilities.css')
      expect(result.dependencies).toContain(modulePath)
      expect(result.dependencies).toContain(tokenPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('leaves ordinary CSS unchanged in the style loader helper', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-local-compose-'))
    const modulePath = path.join(root, 'Button.module.css')
    try {
      const source = '.button { color: red; }'
      const result = await transformStyleSource(modulePath, source, {
        projectDir: root,
        masterImport: '../node_modules/.master-css/master-utilities.css'
      })

      expect(result.code).toBe(source)
      expect(result.dependencies).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('strips Master directives from package CSS files before css-loader sees them', async () => {
    const themePath = path.resolve(__dirname, '../../core/src/theme.css')
    const result = await transformStyleSource(
      themePath,
      '@theme { --color-primary: red; }\n:root { color: red; }',
      {
        projectDir: path.resolve(__dirname, '../../../examples/webpack')
      }
    )

    expect(result.code).not.toContain('@master')
    expect(result.code).toContain(':root')
  })

  test('resolves virtual:master-css-manifest to a JS facade and external JSON asset', async () => {
    const plugin = new MasterCSSPlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_MANIFEST_ID,
      context: process.cwd(),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-css-manifest.js'))
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain(`await loadMasterCSSManifestModule(typeof masterCSSManifestURL === 'string' ? masterCSSManifestURL : masterCSSManifestURL.href)`)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('font-weight-bold')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('"version":1')
  })

  test('adds resolve file dependencies to Set and array-like containers', () => {
    const dependency = path.join(process.cwd(), 'master.css')
    const setDependencies = new Set<string>()
    const arrayDependencies: string[] = []

    addFileDependency(setDependencies, dependency)
    addFileDependency(arrayDependencies, dependency)
    addFileDependency(arrayDependencies, dependency)

    expect(setDependencies.has(dependency)).toBe(true)
    expect(arrayDependencies).toEqual([dependency])
  })

  test('resolves virtual:master-css-manifest to an inline module in development', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const plugin = makePlugin({}, root)
    const { compiler } = makeFakeCompiler({ context: root, mode: 'development' })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_MANIFEST_ID,
      context: root,
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toMatch(/^export default \{"version":1/)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('loadMasterCSSManifestModule')
    expect([...(plugin as any).manifestJSONAssets.values()]).toEqual([])
  })

  test('keeps virtual manifest file dependencies after invalid CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-invalid-manifest-'))
    const entryPath = path.join(root, 'app.css')
    try {
      writeFileSync(entryPath, [
        '@master entry;',
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)

      const normalModuleFactory = makeNormalModuleFactory()
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: VIRTUAL_MANIFEST_ID,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await expect(resolveBefore(normalModuleFactory, resolveData)).rejects.toThrow('Invalid @compose class')
      expect(resolveData.fileDependencies.has(entryPath)).toBe(true)

      writeFileSync(entryPath, [
        '@master entry;',
        '@components {',
        '  card { @compose block; }',
        '}'
      ].join('\n'))

      await resolveBefore(normalModuleFactory, resolveData)
      expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
        .toContain('masterCSSManifestURL')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves virtual:master-css-emitted-globals to a JS virtual module', async () => {
    const plugin = new MasterCSSPlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_EMITTED_GLOBALS_ID,
      context: process.cwd(),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-css-emitted-globals.js'))
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toBe('export default {"variables":{},"animations":{}};')
  })

  test('resolves ?master-css-manifest imports to per-file JS facades and external JSON assets', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory(fixturePath)
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: './theme.css' + MASTER_CSS_MANIFEST_QUERY,
      context: path.dirname(fixturePath),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css'))
    expect(resolveData.request).toContain('.manifest.js')
    expect(resolveData.fileDependencies.has(fixturePath)).toBe(true)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain(`await loadMasterCSSManifestModule(typeof masterCSSManifestURL === 'string' ? masterCSSManifestURL : masterCSSManifestURL.href)`)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .not.toContain('#456')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('accent')
    expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
      .toContain('#456')
  })

  test('resolves ?master-css-manifest imports to inline modules in development', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/manifest-virtual-module/theme.css')
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler({ mode: 'development' })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory(fixturePath)
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: './theme.css' + MASTER_CSS_MANIFEST_QUERY,
      context: path.dirname(fixturePath),
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toMatch(/^export default \{"version":1/)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('#456')
    expect([...(plugin as any).manifestJSONAssets.values()]).toEqual([])
  })

  test('keeps ?master-css-manifest file dependencies after invalid CSS', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-invalid-query-manifest-'))
    const manifestPath = path.join(root, 'theme.css')
    try {
      writeFileSync(manifestPath, [
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n'))
      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
      plugin.apply(compiler as any)

      const normalModuleFactory = makeNormalModuleFactory(manifestPath)
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: './theme.css' + MASTER_CSS_MANIFEST_QUERY,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await expect(resolveBefore(normalModuleFactory, resolveData)).rejects.toThrow('Invalid @compose class')
      expect(resolveData.fileDependencies.has(manifestPath)).toBe(true)

      writeFileSync(manifestPath, [
        '@components {',
        '  card { @compose block; }',
        '}'
      ].join('\n'))

      await resolveBefore(normalModuleFactory, resolveData)
      expect(resolveData.request).toContain('.manifest.js')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resolves virtual CSS module imports to the generated CSS virtual module', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_CSS_ID,
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/main.ts')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-utilities.css'))
  })

  test('resolves CSS @import virtual utilities to the generated CSS virtual module', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_CSS_ID,
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/styles.css')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-utilities.css'))
  })

  test('leaves unrelated CSS @import unresolved', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: 'theme.css',
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/styles.css')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toBe('theme.css')
  })

  test('leaves CSS @import @master/css package imports unchanged', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: '@master/css',
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/styles.css')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toBe('@master/css')
  })

  test('leaves non-CSS @master/css imports unchanged', async () => {
    const plugin = makePlugin()
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)

    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: '@master/css',
      context: process.cwd(),
      contextInfo: {
        issuer: path.join(process.cwd(), 'src/main.ts')
      },
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.request).toBe('@master/css')
  })

  test('adds managed CSS entry files as virtual manifest dependencies', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const plugin = makePlugin({}, root)
    const { compiler } = makeFakeCompiler({ context: root })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    const normalModuleFactory = makeNormalModuleFactory()
    compiler.hooks.normalModuleFactory.call(normalModuleFactory)
    const resolveData = {
      request: VIRTUAL_MANIFEST_ID,
      context: root,
      contextInfo: {},
      fileDependencies: new Set<string>()
    }

    await resolveBefore(normalModuleFactory, resolveData)

    expect(resolveData.fileDependencies.has(path.join(root, 'app.css'))).toBe(true)
  })

  test('adds managed CSS import graph as virtual manifest dependencies', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-config-'))
    const entryPath = path.join(root, 'app.css')
    const themePath = path.join(root, 'theme.css')
    try {
      writeFileSync(themePath, '@components { card { color: #123456; } }')
      writeFileSync(entryPath, [
        '@master entry;',
        '@import "./theme.css";'
      ].join('\n'))

      const plugin = makePlugin({}, root)
      const { compiler } = makeFakeCompiler({ context: root })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      const normalModuleFactory = makeNormalModuleFactory()
      compiler.hooks.normalModuleFactory.call(normalModuleFactory)
      const resolveData = {
        request: VIRTUAL_MANIFEST_ID,
        context: root,
        contextInfo: {},
        fileDependencies: new Set<string>()
      }

      await resolveBefore(normalModuleFactory, resolveData)

      expect(resolveData.fileDependencies.has(entryPath)).toBe(true)
      expect(resolveData.fileDependencies.has(themePath)).toBe(true)
      expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
        .not.toContain('"color":"#123456"')
      expect([...(plugin as any).manifestJSONAssets.values()].at(-1))
        .toContain('"color":"#123456"')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('prunes managed CSS entry native CSS and uses its config', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-'))
    try {
      mkdirSync(path.join(root, 'src'), { recursive: true })
      const entryPath = path.join(root, 'app.css')
      const source = [
        '@master entry;',
        '',
        '.root-native {',
        '    color: #789;',
        '}',
        '',
        '.root-unused {',
        '    color: #abc;',
        '}',
        '',
        '.native-used {',
        '    color: var(--color-primary);',
        '}',
        '',
        '@theme {',
        '    --color-primary: #123456;',
        '}',
        '',
        '@components {',
        '    btn {',
        '        display: grid;',
        '    }',
        '}'
      ].join('\n')
      writeFileSync(entryPath, source)

      const plugin = await new MasterCSSPlugin({
        verbose: 0
      }, root).init()

      plugin.latentClasses.add('btn')
      plugin.latentClasses.add('native-used')
      plugin.latentClasses.add('root-native')

      await (plugin as any).processModuleContents([[entryPath, source]], () => false)
      const css = await (plugin as any).createExtractedCSS()

      expect(css).toContain('.native-used')
      expect(css).not.toContain('.native-unused')
      expect(css).toContain('.root-native')
      expect(css).not.toContain('.root-unused')
      expect(css).toMatch(/--color-primary:(rgb\(18 52 86\)|#123456)/)
      expect(css).toMatch(/\.btn\s*\{\s*display:\s*grid;?\s*\}/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('includes package base CSS for managed package imports', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-package-'))
    const entryPath = path.join(root, 'app.css')
    try {
      writeFileSync(entryPath, '@import "@master/css";')

      const plugin = await new MasterCSSPlugin({
        verbose: 0
      }, root).init()

      await (plugin as any).processModuleContents([[entryPath, '@import "@master/css";']], () => false)
      const css = await (plugin as any).createExtractedCSS()

      expect(css).toContain('@layer base')
      expect(css).toContain('text-rendering: geometricprecision')
      expect(css).not.toContain('@master/css')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('keeps managed CSS fallback reset dependencies after failed style registration', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-style-invalid-'))
    const entryPath = path.join(root, 'app.css')
    try {
      const source = [
        '@master entry;',
        '@components {',
        '  card { @compose bg:neutral-120; }',
        '}'
      ].join('\n')
      writeFileSync(entryPath, source)
      const plugin = await new MasterCSSPlugin({ verbose: 0 }, root).init()

      await expect((plugin as any).processModuleContents([[entryPath, source]], () => false))
        .rejects.toThrow('Invalid @compose class')

      expect((plugin as any).getResetDependencyPaths()).toContain(entryPath)

      const validSource = [
        '@master entry;',
        '@components {',
        '  card { display: block; }',
        '}'
      ].join('\n')
      writeFileSync(entryPath, validSource)
      await (plugin as any).processModuleContents([[entryPath, validSource]], () => false)
      expect((plugin as any).styleCSSSources.get(entryPath)?.dependencies).toContain(entryPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resets scanner when the default CSS manifest changes in watch mode', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const configPath = path.join(root, 'app.css')
    const plugin = makePlugin({}, root)
    ;(plugin as any).defaultManifestDependencies = [configPath]
    const reset = vi.fn(async function (this: MasterCSSPlugin) {
      this.emit('reset')
      return this
    })
    ;(plugin as any).reset = reset
    const { compiler } = makeFakeCompiler({
      context: root,
      modifiedFiles: new Set([configPath])
    })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    await new Promise<void>((resolve, reject) => {
      compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
    })

    expect(reset).toHaveBeenCalledWith(plugin.options)
  })

  test('resets scanner when a managed CSS import dependency changes in watch mode', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-watch-'))
    const configPath = path.join(root, 'app.css')
    const tokenPath = path.join(root, 'theme.css')
    try {
      writeFileSync(tokenPath, '@components { card { color: #123456; } }')
      writeFileSync(configPath, '@master entry;\n@import "./theme.css";')

      const plugin = makePlugin({}, root)
      ;(plugin as any).styleCSSSources = new Map([
        [configPath, makeRegisteredStyleSource([configPath, tokenPath])]
      ])
      const reset = vi.fn(async function (this: MasterCSSPlugin) {
        this.emit('reset')
        return this
      })
      ;(plugin as any).reset = reset
      const { compiler } = makeFakeCompiler({
        context: root,
        modifiedFiles: new Set([tokenPath])
      })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      await new Promise<void>((resolve, reject) => {
        compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
      })

      expect(reset).toHaveBeenCalledWith(plugin.options)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('registers reset dependencies with the active compilation', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-deps-'))
    const configPath = path.join(root, 'app.css')
    const tokenPath = path.join(root, 'theme.css')
    try {
      const plugin = makePlugin({}, root)
      ;(plugin as any).defaultManifestDependencies = [configPath]
      ;(plugin as any).styleCSSSources = new Map([
        [configPath, makeRegisteredStyleSource([configPath, tokenPath])]
      ])
      const { compiler, compilation } = makeFakeCompiler({
        context: root
      })
      ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

      plugin.apply(compiler as any)
      compiler.hooks.thisCompilation.call(compilation as any)

      expect(compilation.fileDependencies).toContain(configPath)
      expect(compilation.fileDependencies).toContain(tokenPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('does not reset scanner when a non-manifest file changes in watch mode', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const plugin = makePlugin({}, root)
    ;(plugin as any).defaultManifestDependencies = [path.join(root, 'app.css')]
    const reset = vi.fn(async function (this: MasterCSSPlugin) {
      this.emit('reset')
      return this
    })
    ;(plugin as any).reset = reset
    const { compiler } = makeFakeCompiler({
      context: root,
      modifiedFiles: new Set([path.join(root, 'entry.js')])
    })
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    await new Promise<void>((resolve, reject) => {
      compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
    })

    expect(reset).not.toHaveBeenCalled()
  })

  test('finishModules.tapPromise awaits all scanner.scanModule() calls before resolving', async () => {
    const plugin = makePlugin()

    const scanOrder: string[] = []
    ;(plugin as any).scanModule = async (id: string) => {
      // Simulate the async work in a real scanner (regex + validator).
      await new Promise((r) => setTimeout(r, 10))
      scanOrder.push(`scan:${id}`)
      return true
    }

    const { compiler, compilation } = makeFakeCompiler()
    // Stub VirtualModulesPlugin.apply by intercepting the only compiler
    // hook it would touch (it's not under test here).
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(compilation as any)

    // Two modules succeed, then finishModules fires.
    compilation.hooks.succeedModule.call(makeModule('/a.tsx', '<div class="bg:white">a</div>'))
    compilation.hooks.succeedModule.call(makeModule('/b.tsx', '<div class="fg:black">b</div>'))

    const finishStart = Date.now()
    await new Promise<void>((resolve, reject) => {
      compilation.hooks.finishModules.callAsync([], (err) => err ? reject(err) : resolve())
    })
    const finishDuration = Date.now() - finishStart

    // If the fix is in place, finishModules' promise must have awaited
    // both scans. With the old `succeedModule.tap(async)` code,
    // scanOrder would be empty here (the async callbacks would still
    // be pending — webpack's SyncHook discarded their promises).
    expect(scanOrder.sort()).toEqual(['scan:/a.tsx', 'scan:/b.tsx'])
    // And finishModules must have actually waited (>= the simulated 10ms,
    // running in parallel via Promise.all).
    expect(finishDuration).toBeGreaterThanOrEqual(8)
  })

  test('regression: SyncHook + tap(async) DOES NOT await — proves the original bug', async () => {
    // This test does not use the plugin at all. It pins down the
    // tapable behaviour the fix relies on: a SyncHook silently
    // ignores promises returned by `.tap()`-attached callbacks. If
    // tapable ever changes this (it never has), this test will
    // catch it before our fix's premise rots.
    const hook = new SyncHook<[]>([])
    let resolved = false
    hook.tap('test', async () => {
      await new Promise((r) => setTimeout(r, 20))
      resolved = true
    })
    hook.call()
    // Synchronously after .call() the async callback is still pending.
    expect(resolved).toBe(false)
  })

  test('per-compilation pendingByPath is isolated across watch rebuilds', async () => {
    // Watch-mode rebuilds re-run thisCompilation. The pending map is
    // closure-scoped per-compilation, so it must not carry state
    // across passes (otherwise rebuilds would re-scan every old
    // module on every save).
    const plugin = makePlugin()
    const scannedIds: string[] = []
    ;(plugin as any).scanModule = async (id: string) => {
      scannedIds.push(id)
      return true
    }

    const { compiler, compilation: c1 } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(c1 as any)
    c1.hooks.succeedModule.call(makeModule('/a.tsx', 'a'))
    await new Promise<void>((res, rej) => c1.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res()))

    // Second compilation pass — only /b.tsx succeeds. /a.tsx must not
    // be re-scanned in this pass (the closure-scoped map was cleared
    // after pass 1's finishModules resolved, and a fresh map exists
    // in pass 2's closure).
    const { compilation: c2 } = makeFakeCompiler()
    compiler.hooks.thisCompilation.call(c2 as any)
    c2.hooks.succeedModule.call(makeModule('/b.tsx', 'b'))
    await new Promise<void>((res, rej) => c2.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res()))

    expect(scannedIds).toEqual(['/a.tsx', '/b.tsx'])
  })

  test('modules without a resource path are skipped without throwing', async () => {
    // Defensive: virtual modules and runtime helpers can pass through
    // succeedModule without resourceResolveData / _source. The plugin
    // must tolerate them rather than crash mid-build.
    const plugin = makePlugin()
    const scannedIds: string[] = []
    ;(plugin as any).scanModule = async (id: string) => {
      scannedIds.push(id)
      return true
    }

    const { compiler, compilation } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(compilation as any)

    compilation.hooks.succeedModule.call({} as unknown)
    compilation.hooks.succeedModule.call({ resourceResolveData: {}, _source: undefined } as unknown)
    compilation.hooks.succeedModule.call(makeModule('/real.tsx', 'real'))

    await new Promise<void>((res, rej) =>
      compilation.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res())
    )

    expect(scannedIds).toEqual(['/real.tsx'])
  })

  test('internal config virtual modules are not re-scanned', async () => {
    const plugin = makePlugin()
    const scannedIds: string[] = []
    ;(plugin as any).scanModule = async (id: string) => {
      scannedIds.push(id)
      return true
    }

    const { compiler, compilation } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(compilation as any)

    compilation.hooks.succeedModule.call(makeModule('node_modules/.master-css/master-css-manifest.js', '{}'))
    compilation.hooks.succeedModule.call(makeModule('/real.tsx', 'real'))

    await new Promise<void>((res, rej) =>
      compilation.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res())
    )

    expect(scannedIds).toEqual(['/real.tsx'])
  })

  test('registers a runtime entry only when runtime injection is enabled', () => {
    const runtimePlugin = makePlugin({ mode: 'runtime' })
    const runtimeCompiler = makeFakeCompiler()
    runtimePlugin.apply(runtimeCompiler.compiler as any)

    expect(runtimeCompiler.entryPluginCalls[0]).toEqual(expect.arrayContaining([
      expect.any(String),
      expect.stringContaining('runtime.js'),
      { name: 'master-css-runtime' }
    ]))

    const staticPlugin = makePlugin({ mode: 'static' })
    const staticCompiler = makeFakeCompiler()
    staticPlugin.apply(staticCompiler.compiler as any)

    expect(staticCompiler.entryPluginCalls).toEqual([])
  })

  test('injects classic runtime script and pure-runtime preloads into emitted HTML assets', () => {
    const plugin = makePlugin({ mode: 'runtime' })
    ;(plugin as any).manifestJSONAssets.set('assets/master-css-manifest.12345678.json', '{}')
    const assets = {
      'index.html': {
        source: () => '<html><head></head><body><main class="box block"></main></body></html>'
      },
      'assets/mastercss_wasm_runtime_bg.12345678.wasm': {
        source: () => 'wasm'
      }
    }
    const { compiler, compilation } = makeFakeCompiler({
      assets,
      entryFiles: ['assets/master-css-runtime.js'],
      publicPath: '/static/'
    })

    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(compilation as any)
    compilation.hooks.processAssets.call(assets)

    const html = assets['index.html'].source()
    expect(html).toContain('<link rel="preload" as="script" href="/static/assets/master-css-runtime.js">')
    expect(html).toContain('<link rel="modulepreload" as="json" crossorigin href="/static/assets/master-css-manifest.12345678.json">')
    expect(html).toContain('<link rel="preload" as="fetch" type="application/wasm" crossorigin href="/static/assets/mastercss_wasm_runtime_bg.12345678.wasm">')
    expect(html).toContain('<script defer src="/static/assets/master-css-runtime.js"></script></body>')
  })

  test('injects module runtime preloads for module output', () => {
    const plugin = makePlugin({ mode: 'runtime' })
    const assets = {
      'index.html': {
        source: () => '<html><head></head><body></body></html>'
      }
    }
    const { compiler, compilation } = makeFakeCompiler({
      assets,
      entryFiles: ['runtime.mjs'],
      outputModule: true
    })

    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(compilation as any)
    compilation.hooks.processAssets.call(assets)

    const html = assets['index.html'].source()
    expect(html).toContain('<link rel="modulepreload" crossorigin href="runtime.mjs">')
    expect(html).toContain('<script type="module" src="runtime.mjs"></script></body>')
  })

  test('does not duplicate runtime script or preload tags', () => {
    const plugin = makePlugin({ mode: 'runtime' })
    ;(plugin as any).manifestJSONAssets.set('master-css-manifest.12345678.json', '{}')
    const source = [
      '<html><head>',
      '<link rel="preload" as="script" href="runtime.js">',
      '<link rel="modulepreload" as="json" crossorigin href="master-css-manifest.12345678.json">',
      '</head><body>',
      '<script defer src="runtime.js"></script>',
      '</body></html>'
    ].join('')
    const assets = {
      'index.html': {
        source: () => source
      }
    }
    const { compiler, compilation } = makeFakeCompiler({
      assets,
      entryFiles: ['runtime.js']
    })

    plugin.apply(compiler as any)
    compiler.hooks.thisCompilation.call(compilation as any)
    compilation.hooks.processAssets.call(assets)

    const html = assets['index.html'].source()
    expect(html.match(/href="runtime\.js"/g)).toHaveLength(1)
    expect(html.match(/href="master-css-manifest\.12345678\.json"/g)).toHaveLength(1)
    expect(html.match(/src="runtime\.js"/g)).toHaveLength(1)
  })
})
