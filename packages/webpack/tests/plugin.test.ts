/**
 * Regression tests for the C1 race in MasterCSSWebpackPlugin.
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
import MasterCSSWebpackPlugin from '../src'
import { VIRTUAL_MANIFEST_ID, MASTER_CSS_MANIFEST_QUERY } from '@master/css-internal/manifest-module'
import { VIRTUAL_CSS_ID } from '@master/css-internal/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-internal/emitted-globals-module'
import { transformStyleSource } from '../src/utils/transform-style-source'
import masterCSSStylesheetLoader from '../src/stylesheet-loader'
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
      shutdown: new AsyncSeriesHook<[]>([]),
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
  const plugin = new MasterCSSWebpackPlugin({
    ...options,
  } as any, cwd)
  // webpack-virtual-modules pokes at compiler.webpack internals; stub
  // its apply() so we don't have to spin a real webpack here.
  return plugin
}

function runStylesheetLoader(root: string, resourcePath: string, source: string) {
  const dependencies: string[] = []
  return new Promise<string>((resolve, reject) => {
    masterCSSStylesheetLoader.call({
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

function makeStylesheetCollection(dependencies: string[]) {
  return {
    compose: vi.fn(async () => ({ css: '', emittedGlobals: {} })),
    snapshot: () => ({
      dependencies,
      sources: []
    })
  }
}

describe('MasterCSSWebpackPlugin (C1 race fix)', () => {
  test('exports the plugin as the default export', () => {
    expect(MasterCSSWebpackPlugin.name).toBe('MasterCSSWebpackPlugin')
  })

  test('defers scanner initialization until Webpack starts a build', async () => {
    const plugin = makePlugin()
    const init = vi.spyOn(plugin, 'init')
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    await Promise.resolve()
    expect(init).not.toHaveBeenCalled()

    await compiler.hooks.beforeRun.promise(compiler)
    expect(init).toHaveBeenCalledOnce()
  })

  test('disposes scanner and stylesheet sessions when Webpack shuts down', async () => {
    const plugin = makePlugin()
    const scannerDispose = vi.spyOn(plugin.scanner, 'dispose')
    const stylesheetDispose = vi.spyOn((plugin as any).stylesheets, 'dispose')
    const { compiler } = makeFakeCompiler()
    ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

    plugin.apply(compiler as any)
    await compiler.hooks.shutdown.promise()

    expect(scannerDispose).toHaveBeenCalledOnce()
    expect(stylesheetDispose).toHaveBeenCalledOnce()
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
            loader: expect.stringContaining('stylesheet-loader'),
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
      const plugin = await new MasterCSSWebpackPlugin({
        scanner: { verbose: 0 }
      }, root).init()
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
        await runStylesheetLoader(root, modulePath, '.button { @compose bg:neutral-120; }')
      } catch (caught) {
        error = caught as Error & { dependencies?: string[] }
      }

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toContain('Invalid @compose class')
      expect(error?.dependencies).toContain(modulePath)

      const result = await runStylesheetLoader(root, modulePath, '.button { @compose block; }')
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
    const plugin = new MasterCSSWebpackPlugin()
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
      .toContain(`masterCSSManifest = (await loadMasterCSSManifestModule(masterCSSManifestSpecifier)).default;`)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('const response = await fetch(masterCSSManifestSpecifier)')
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
    const plugin = new MasterCSSWebpackPlugin()
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
      .toContain(`masterCSSManifest = (await loadMasterCSSManifestModule(masterCSSManifestSpecifier)).default;`)
    expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
      .toContain('const response = await fetch(masterCSSManifestSpecifier)')
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

})
