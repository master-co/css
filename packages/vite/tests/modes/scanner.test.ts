/**
 * Tests for the C7 + C8 fixes to Vite's shared scanner lifecycle.
 *
 *  C7 — `master-css:scanner.configResolved` previously did
 *       `context.scanner.options.include = []` unconditionally,
 *       silently wiping a user-supplied
 *       `scanner: { include: [...] }` option. Now only
 *       blanked when the user did NOT pass one.
 *
 *  C8 — Vite virtual modules must not be sent through the scanner, while
 *       real Vite module ids are delegated to the scanner's own source
 *       matcher.
 *
 * Both fixes preserve the current PluginOptions surface.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ScannerPlugin from '../../src/plugins/scanner'
import UsageGraphPlugin from '../../src/plugins/usage-graph'

vi.mock('@master/css-scanner', () => {
    // Lightweight stand-in for CSSScanner that records calls without
    // touching the filesystem.
    return {
        default: class {
            options: any = {}
            scanCalls: string[] = []
            constructor(opts: any, _root?: string) {
                if (typeof opts === 'object' && opts !== null) {
                    this.options = { ...opts }
                }
            }
            async init() { return this }
            async prepare() { return undefined }
            async scan(id: string, _code: string) {
                this.scanCalls.push(id)
                return true
            }
        },
    }
})

function findPlugin(plugins: any[], name: string) {
    const p = plugins.find((x) => x?.name === name)
    if (!p) throw new Error(`plugin "${name}" not registered`)
    return p
}

const fakeViteConfig = { root: '/proj' } as any

describe('shared scanner plugins (C7 + C8 fixes)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('C7 — respects user-supplied scanner.include', () => {
        test('default options: scanner.options.include is blanked', async () => {
            const ctx: any = {}
            const plugins = [
                ScannerPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            const ex = findPlugin(plugins, 'master-css:scanner')
            await ex.configResolved.call({}, fakeViteConfig)
            expect(ctx.scanner.options.include).toEqual([])
        })

        test('user-supplied include is preserved (NOT blanked)', async () => {
            const ctx: any = {}
            const pluginOptions = { scanner: { include: ['node_modules/some-lib/dist/**/*.js'] } } as any
            const plugins = [
                ScannerPlugin(pluginOptions, ctx),
                UsageGraphPlugin(pluginOptions, ctx)
            ]
            const ex = findPlugin(plugins, 'master-css:scanner')
            await ex.configResolved.call({}, fakeViteConfig)
            expect(ctx.scanner.options.include).toEqual([
                'node_modules/some-lib/dist/**/*.js',
            ])
        })

        test('user-supplied include = [] is treated as "use vite-driven mode"', async () => {
            // An explicitly empty array is indistinguishable from "not set" in
            // intent — both mean "trust Vite to feed me modules". Don't trip
            // on this edge case.
            const ctx: any = {}
            const pluginOptions = { scanner: { include: [] } } as any
            const plugins = [
                ScannerPlugin(pluginOptions, ctx),
                UsageGraphPlugin(pluginOptions, ctx)
            ]
            await findPlugin(plugins, 'master-css:scanner').configResolved.call({}, fakeViteConfig)
            expect(ctx.scanner.options.include).toEqual([])
        })
    })

    describe('C8 — usage graph delegation', () => {
        async function drive(ids: string[]) {
            const ctx: any = {}
            const plugins = [
                ScannerPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            await findPlugin(plugins, 'master-css:scanner').configResolved.call({}, fakeViteConfig)
            const usageGraphPlugin = findPlugin(plugins, 'master-css:usage-graph')
            for (const id of ids) {
                await usageGraphPlugin.transform.call({}, '<div class="bg:white">x</div>', id)
            }
            return ctx.scanner.scanCalls
        }

        test('delegates real source modules to the scanner', async () => {
            const calls = await drive([
                '/proj/src/App.tsx',
                '/proj/src/main.ts',
                '/proj/src/page.svelte',
                '/proj/src/page.vue',
                '/proj/src/page.astro',
                '/proj/index.html',
                '/proj/docs/intro.mdx',
            ])
            expect(calls).toEqual([
                '/proj/src/App.tsx',
                '/proj/src/main.ts',
                '/proj/src/page.svelte',
                '/proj/src/page.vue',
                '/proj/src/page.astro',
                '/proj/index.html',
                '/proj/docs/intro.mdx',
            ])
        })

        test('delegates non-virtual module ids to the scanner source matcher', async () => {
            const calls = await drive([
                '/proj/src/data.json',                // json
                '/proj/src/icon.png',                  // raw asset
                '/proj/src/icon.svg?url',              // ?url
                '/proj/src/audio.mp3',                 // binary
            ])
            expect(calls).toEqual([
                '/proj/src/data.json',
                '/proj/src/icon.png',
                '/proj/src/icon.svg?url',
                '/proj/src/audio.mp3',
            ])
        })

        test('respects vite query suffixes on source files (?import / ?raw)', async () => {
            const calls = await drive([
                '/proj/src/App.tsx?import',
                '/proj/src/markdown.md?raw',
                '/proj/src/Component.svelte?vue&type=script',
            ])
            // All three are source files Vite is forwarding through transform
            // with a query suffix. The scanner source matcher owns whether
            // they are usable.
            expect(calls).toEqual([
                '/proj/src/App.tsx?import',
                '/proj/src/markdown.md?raw',
                '/proj/src/Component.svelte?vue&type=script',
            ])
        })

        test('virtual module ids are always rejected', async () => {
            const calls = await drive([
                '\0plugin-virtual',
                '\0plugin-vue:export-helper',
                '\0vite/modulepreload-polyfill.js',
            ])
            expect(calls).toEqual([])
        })

        test('CSS files are delegated to the scanner source matcher', async () => {
            const calls = await drive([
                '/proj/src/style.css',
                '/proj/src/component.module.css',
            ])
            expect(calls).toEqual([
                '/proj/src/style.css',
                '/proj/src/component.module.css',
            ])
        })

        test('framework style subrequests are delegated to the scanner source matcher', async () => {
            const calls = await drive([
                '/proj/src/App.svelte?svelte&type=style&lang.css',
                '/proj/src/App.vue?vue&type=style&index=0&lang.css',
            ])
            expect(calls).toEqual([
                '/proj/src/App.svelte?svelte&type=style&lang.css',
                '/proj/src/App.vue?vue&type=style&index=0&lang.css',
            ])
        })

        test('build transformIndexHtml feeds HTML to the scanner', async () => {
            const ctx: any = {}
            const plugins = [
                ScannerPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            await findPlugin(plugins, 'master-css:scanner').configResolved.call({}, fakeViteConfig)
            const usageGraphPlugin = findPlugin(plugins, 'master-css:usage-graph')

            await usageGraphPlugin.transformIndexHtml.handler.call(
                {},
                '<div class="page"></div>',
                { filename: '/proj/index.html' }
            )

            expect(ctx.scanner.scanCalls).toEqual(['/proj/index.html'])
        })

        test('serve transformIndexHtml is left to the HMR plugin', async () => {
            const ctx: any = {}
            const plugins = [
                ScannerPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            await findPlugin(plugins, 'master-css:scanner').configResolved.call({}, fakeViteConfig)
            const usageGraphPlugin = findPlugin(plugins, 'master-css:usage-graph')

            await usageGraphPlugin.transformIndexHtml.handler.call(
                {},
                '<div class="page"></div>',
                { filename: '/proj/index.html', server: {} }
            )

            expect(ctx.scanner.scanCalls).toEqual([])
        })
    })
})
