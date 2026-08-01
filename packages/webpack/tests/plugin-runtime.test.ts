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

      const plugin = await new MasterCSSWebpackPlugin({
        scanner: { verbose: 0 }
      }, root).init()

      const modulePath = path.join(root, 'src/page.tsx')
      const moduleSource = '<div className="btn native-used root-native" />'
      await (plugin as any).processModuleContents([
        [entryPath, source],
        [modulePath, moduleSource]
      ], () => false)
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

      const plugin = await new MasterCSSWebpackPlugin({
        scanner: { verbose: 0 }
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
      const plugin = await new MasterCSSWebpackPlugin({
        scanner: { verbose: 0 }
      }, root).init()

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
      expect((plugin as any).stylesheets.snapshot().dependencies).toContain(entryPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('resets scanner when the default CSS manifest changes in watch mode', async () => {
    const root = path.resolve(__dirname, 'fixtures/manifest-virtual-module/css-only')
    const configPath = path.join(root, 'app.css')
    const plugin = makePlugin({}, root)
    ;(plugin as any).defaultManifestDependencies = [configPath]
    const reset = vi.fn(async function (this: MasterCSSWebpackPlugin) {
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
      ;(plugin as any).stylesheets = makeStylesheetCollection([configPath, tokenPath])
      const reset = vi.fn(async function (this: MasterCSSWebpackPlugin) {
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

  test('fails a watch build on reset replay errors and recovers on the next reset', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-webpack-watch-failure-'))
    const configPath = path.join(root, 'app.css')
    const tokenPath = path.join(root, 'theme.css')
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const plugin = makePlugin({}, root)
      const stylesheets = makeStylesheetCollection([configPath, tokenPath])
      const replayError = new Error('Cannot compose reset CSS')
      stylesheets.compose
        .mockRejectedValueOnce(replayError)
        .mockResolvedValue({ css: '@layer utilities{}', emittedGlobals: {} })
      ;(plugin as any).stylesheets = stylesheets
      const reset = vi.fn(async function (this: MasterCSSWebpackPlugin) {
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
      const runWatch = () => new Promise<void>((resolve, reject) => {
        compiler.hooks.watchRun.callAsync(compiler, (error) => error ? reject(error) : resolve())
      })

      await expect(runWatch()).rejects.toBe(replayError)
      expect(errorLog).toHaveBeenCalledWith('[master-css.webpack] reset replay failed:', replayError)
      expect(stylesheets.compose).toHaveBeenCalledTimes(1)

      await expect(runWatch()).resolves.toBeUndefined()
      expect(stylesheets.compose).toHaveBeenCalledTimes(2)
      expect(reset).toHaveBeenCalledTimes(2)
    } finally {
      errorLog.mockRestore()
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
      ;(plugin as any).stylesheets = makeStylesheetCollection([configPath, tokenPath])
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
    const reset = vi.fn(async function (this: MasterCSSWebpackPlugin) {
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
      'assets/mastercss_binding_wasm_engine_bg.12345678.wasm': {
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
    expect(html).toContain('<link rel="preload" as="fetch" type="application/wasm" crossorigin href="/static/assets/mastercss_binding_wasm_engine_bg.12345678.wasm">')
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
