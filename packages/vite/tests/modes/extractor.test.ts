/**
 * Tests for the C7 + C8 fixes to Vite's shared extractor lifecycle.
 *
 *  C7 — `master-css:extractor.configResolved` previously did
 *       `context.extractor.options.include = []` unconditionally,
 *       silently wiping a user-supplied
 *       `extractor: { include: [...] }` option. Now only
 *       blanked when the user did NOT pass one.
 *
 *  C8 — Vite virtual modules must not be sent through the extractor, while
 *       real Vite module ids are delegated to the extractor's own source
 *       matcher.
 *
 * Both fixes preserve the current PluginOptions surface.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ExtractorPlugin from '../../src/plugins/extractor'
import UsageGraphPlugin from '../../src/plugins/usage-graph'

vi.mock('@master/css-extractor', () => {
    // Lightweight stand-in for CSSExtractor that records calls without
    // touching the filesystem.
    return {
        default: class {
            options: any = {}
            insertCalls: string[] = []
            constructor(opts: any, _root?: string) {
                if (typeof opts === 'object' && opts !== null) {
                    this.options = { ...opts }
                }
            }
            async init() { return this }
            async prepare() { return undefined }
            async insert(id: string, _code: string) {
                this.insertCalls.push(id)
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

describe('shared extractor plugins (C7 + C8 fixes)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('C7 — respects user-supplied extractor.include', () => {
        test('default options: extractor.options.include is blanked', async () => {
            const ctx: any = {}
            const plugins = [
                ExtractorPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            const ex = findPlugin(plugins, 'master-css:extractor')
            await ex.configResolved.call({}, fakeViteConfig)
            expect(ctx.extractor.options.include).toEqual([])
        })

        test('user-supplied include is preserved (NOT blanked)', async () => {
            const ctx: any = {}
            const pluginOptions = { extractor: { include: ['node_modules/some-lib/dist/**/*.js'] } } as any
            const plugins = [
                ExtractorPlugin(pluginOptions, ctx),
                UsageGraphPlugin(pluginOptions, ctx)
            ]
            const ex = findPlugin(plugins, 'master-css:extractor')
            await ex.configResolved.call({}, fakeViteConfig)
            expect(ctx.extractor.options.include).toEqual([
                'node_modules/some-lib/dist/**/*.js',
            ])
        })

        test('user-supplied include = [] is treated as "use vite-driven mode"', async () => {
            // An explicitly empty array is indistinguishable from "not set" in
            // intent — both mean "trust Vite to feed me modules". Don't trip
            // on this edge case.
            const ctx: any = {}
            const pluginOptions = { extractor: { include: [] } } as any
            const plugins = [
                ExtractorPlugin(pluginOptions, ctx),
                UsageGraphPlugin(pluginOptions, ctx)
            ]
            await findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            expect(ctx.extractor.options.include).toEqual([])
        })
    })

    describe('C8 — usage graph delegation', () => {
        async function drive(ids: string[]) {
            const ctx: any = {}
            const plugins = [
                ExtractorPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            await findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            const usageGraphPlugin = findPlugin(plugins, 'master-css:usage-graph')
            for (const id of ids) {
                await usageGraphPlugin.transform.call({}, '<div class="bg:white">x</div>', id)
            }
            return ctx.extractor.insertCalls
        }

        test('delegates real source modules to the extractor', async () => {
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

        test('delegates non-virtual module ids to the extractor source matcher', async () => {
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
            // with a query suffix. The extractor source matcher owns whether
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

        test('CSS files are delegated to the extractor source matcher', async () => {
            const calls = await drive([
                '/proj/src/style.css',
                '/proj/src/component.module.css',
            ])
            expect(calls).toEqual([
                '/proj/src/style.css',
                '/proj/src/component.module.css',
            ])
        })

        test('framework style subrequests are delegated to the extractor source matcher', async () => {
            const calls = await drive([
                '/proj/src/App.svelte?svelte&type=style&lang.css',
                '/proj/src/App.vue?vue&type=style&index=0&lang.css',
            ])
            expect(calls).toEqual([
                '/proj/src/App.svelte?svelte&type=style&lang.css',
                '/proj/src/App.vue?vue&type=style&index=0&lang.css',
            ])
        })

        test('build transformIndexHtml feeds HTML to the extractor', async () => {
            const ctx: any = {}
            const plugins = [
                ExtractorPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            await findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            const usageGraphPlugin = findPlugin(plugins, 'master-css:usage-graph')

            await usageGraphPlugin.transformIndexHtml.handler.call(
                {},
                '<div class="page"></div>',
                { filename: '/proj/index.html' }
            )

            expect(ctx.extractor.insertCalls).toEqual(['/proj/index.html'])
        })

        test('serve transformIndexHtml is left to the HMR plugin', async () => {
            const ctx: any = {}
            const plugins = [
                ExtractorPlugin({} as any, ctx),
                UsageGraphPlugin({} as any, ctx)
            ]
            await findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            const usageGraphPlugin = findPlugin(plugins, 'master-css:usage-graph')

            await usageGraphPlugin.transformIndexHtml.handler.call(
                {},
                '<div class="page"></div>',
                { filename: '/proj/index.html', server: {} }
            )

            expect(ctx.extractor.insertCalls).toEqual([])
        })
    })
})
