/**
 * Regression tests for the C1 race in MasterCSSExtractorPlugin.
 *
 * The previous implementation attached an `async` callback to
 * `compilation.hooks.succeedModule` via `.tap()`. `succeedModule` is a
 * tapable `SyncHook` — it does NOT await promises. Webpack therefore
 * proceeded to `emit` while `extractor.insert()` was still running,
 * producing CSS output that was missing classes from late-arriving
 * modules.
 *
 * The fix moves the `await`-bearing work to `finishModules` (an
 * `AsyncSeriesHook`) via `.tapPromise()`, so webpack blocks on every
 * pending insert before it processes assets / emits.
 *
 * These tests demonstrate the race using real tapable hooks (rather
 * than the full webpack runtime), and assert the new ordering.
 */
import { describe, test, expect, vi } from 'vitest'
import { SyncHook, AsyncSeriesHook } from 'tapable'
import { MasterCSSExtractorPlugin } from '../src'
import { VIRTUAL_CONFIG_ID, MASTER_CSS_CONFIG_QUERY } from '../src/common'
import path from 'node:path'

// Build a minimal compiler / compilation pair whose hooks behave the
// way webpack@5 declares them. Includes the hooks VirtualModulesPlugin
// needs (afterEnvironment / afterResolvers / watchRun) so its apply()
// call inside the plugin doesn't blow up.
function makeFakeCompiler(options: {
    context?: string
    modifiedFiles?: Set<string>
} = {}) {
    const compilation = {
        fileDependencies: new Set<string>(),
        hooks: {
            succeedModule: new SyncHook<[unknown]>(['module']),
            finishModules: new AsyncSeriesHook<[Iterable<unknown>]>(['modules']),
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
        inputFileSystem: {
            _writeVirtualFile: vi.fn()
        },
        resolverFactory: { hooks: { resolver: { for: () => ({ tap: () => {} }) } } },
    }
    return { compiler, compilation }
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

// Construct a plugin whose extractor side-effects are stubbed out — we
// only want to drive the webpack hook surface. We keep the real
// constructor + init() so `this.options` is populated correctly.
function makePlugin(options: Record<string, unknown> = {}, cwd = process.cwd()) {
    const plugin = new MasterCSSExtractorPlugin({
        config: {} as any,
        include: [],
        sources: [],
        module: 'virtual:master.css',
        ...options,
    } as any, cwd)
    // Block prepare() / startWatch() — they would try to read the cwd.
    ;(plugin as any).prepare = async () => undefined
    ;(plugin as any).startWatch = async () => undefined
    // webpack-virtual-modules pokes at compiler.webpack internals; stub
    // its apply() so we don't have to spin a real webpack here.
    return plugin
}

describe('MasterCSSExtractorPlugin (C1 race fix)', () => {
    test('resolves virtual:master-css-config to a JS virtual module', async () => {
        const plugin = new MasterCSSExtractorPlugin({
            config: {
                variables: {
                    color: {
                        primary: '#123'
                    }
                }
            } as any,
            include: [],
            sources: [],
            module: 'virtual:master.css',
        } as any)
        const { compiler } = makeFakeCompiler()
        ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
        plugin.apply(compiler as any)

        const normalModuleFactory = makeNormalModuleFactory()
        compiler.hooks.normalModuleFactory.call(normalModuleFactory)
        const resolveData = {
            request: VIRTUAL_CONFIG_ID,
            context: process.cwd(),
            contextInfo: {},
            fileDependencies: new Set<string>()
        }

        await resolveBefore(normalModuleFactory, resolveData)

        expect(resolveData.request).toContain(path.join('node_modules', '.master-css', 'master-css-config.js'))
        expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
            .toContain('"primary":"#123"')
    })

    test('resolves ?master-css-config imports to per-file JS virtual modules', async () => {
        const fixturePath = path.resolve(__dirname, 'fixtures/config-virtual-module/theme.css')
        const plugin = makePlugin()
        const { compiler } = makeFakeCompiler()
        ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
        plugin.apply(compiler as any)

        const normalModuleFactory = makeNormalModuleFactory(fixturePath)
        compiler.hooks.normalModuleFactory.call(normalModuleFactory)
        const resolveData = {
            request: './theme.css' + MASTER_CSS_CONFIG_QUERY,
            context: path.dirname(fixturePath),
            contextInfo: {},
            fileDependencies: new Set<string>()
        }

        await resolveBefore(normalModuleFactory, resolveData)

        expect(resolveData.request).toContain(path.join('node_modules', '.master-css'))
        expect(resolveData.request).toContain('.js')
        expect(resolveData.fileDependencies.has(fixturePath)).toBe(true)
        expect((compiler.inputFileSystem._writeVirtualFile as any).mock.calls.at(-1)?.[2])
            .toContain('"accent":"#456"')
    })

    test('adds default CSS config as a compilation dependency', () => {
        const root = path.resolve(__dirname, 'fixtures/config-virtual-module/css-only')
        const plugin = makePlugin({ config: 'master.css' }, root)
        const { compiler, compilation } = makeFakeCompiler({ context: root })
        ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }

        plugin.apply(compiler as any)
        compiler.hooks.thisCompilation.call(compilation as any)

        expect(compilation.fileDependencies.has(path.join(root, 'master.css'))).toBe(true)
    })

    test('resets extractor when the default CSS config changes in watch mode', async () => {
        const root = path.resolve(__dirname, 'fixtures/config-virtual-module/css-only')
        const configPath = path.join(root, 'master.css')
        const plugin = makePlugin({ config: 'master.css' }, root)
        const reset = vi.fn(async function (this: MasterCSSExtractorPlugin) {
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

    test('does not reset extractor when a non-config file changes in watch mode', async () => {
        const root = path.resolve(__dirname, 'fixtures/config-virtual-module/css-only')
        const plugin = makePlugin({ config: 'master.css' }, root)
        const reset = vi.fn(async function (this: MasterCSSExtractorPlugin) {
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

    test('finishModules.tapPromise awaits all extractor.insert() calls before resolving', async () => {
        const plugin = makePlugin()

        const insertOrder: string[] = []
        ;(plugin as any).insert = async (id: string) => {
            // Simulate the async work in a real extractor (regex + validator).
            await new Promise((r) => setTimeout(r, 10))
            insertOrder.push(`insert:${id}`)
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
        // both inserts. With the old `succeedModule.tap(async)` code,
        // insertOrder would be empty here (the async callbacks would still
        // be pending — webpack's SyncHook discarded their promises).
        expect(insertOrder.sort()).toEqual(['insert:/a.tsx', 'insert:/b.tsx'])
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
        // across passes (otherwise rebuilds would re-insert every old
        // module on every save).
        const plugin = makePlugin()
        const insertedIds: string[] = []
        ;(plugin as any).insert = async (id: string) => {
            insertedIds.push(id)
            return true
        }

        const { compiler, compilation: c1 } = makeFakeCompiler()
        ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
        plugin.apply(compiler as any)
        compiler.hooks.thisCompilation.call(c1 as any)
        c1.hooks.succeedModule.call(makeModule('/a.tsx', 'a'))
        await new Promise<void>((res, rej) => c1.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res()))

        // Second compilation pass — only /b.tsx succeeds. /a.tsx must not
        // be re-inserted in this pass (the closure-scoped map was cleared
        // after pass 1's finishModules resolved, and a fresh map exists
        // in pass 2's closure).
        const { compilation: c2 } = makeFakeCompiler()
        compiler.hooks.thisCompilation.call(c2 as any)
        c2.hooks.succeedModule.call(makeModule('/b.tsx', 'b'))
        await new Promise<void>((res, rej) => c2.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res()))

        expect(insertedIds).toEqual(['/a.tsx', '/b.tsx'])
    })

    test('modules without a resource path are skipped without throwing', async () => {
        // Defensive: virtual modules and runtime helpers can pass through
        // succeedModule without resourceResolveData / _source. The plugin
        // must tolerate them rather than crash mid-build.
        const plugin = makePlugin()
        const insertedIds: string[] = []
        ;(plugin as any).insert = async (id: string) => {
            insertedIds.push(id)
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

        expect(insertedIds).toEqual(['/real.tsx'])
    })

    test('internal config virtual modules are not re-extracted', async () => {
        const plugin = makePlugin()
        const insertedIds: string[] = []
        ;(plugin as any).insert = async (id: string) => {
            insertedIds.push(id)
            return true
        }

        const { compiler, compilation } = makeFakeCompiler()
        ;(compiler as any).webpack = { sources: { RawSource: function NoopSource(this: object) { /* stub */ } } }
        plugin.apply(compiler as any)
        compiler.hooks.thisCompilation.call(compilation as any)

        compilation.hooks.succeedModule.call(makeModule('node_modules/.master-css/master-css-config.js', 'export default {}'))
        compilation.hooks.succeedModule.call(makeModule('/real.tsx', 'real'))

        await new Promise<void>((res, rej) =>
            compilation.hooks.finishModules.callAsync([], (e) => e ? rej(e) : res())
        )

        expect(insertedIds).toEqual(['/real.tsx'])
    })
})
