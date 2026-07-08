import { beforeEach, describe, expect, test, vi } from 'vitest'
import ScannerPlugin from '../../src/plugins/scanner'
import UsageGraphPlugin from '../../src/plugins/usage-graph'

vi.mock('@master/css-scanner', () => {
    return {
        default: class {
            options: any = {}
            scanModuleCalls: string[] = []
            constructor(opts: any, _root?: string) {
                if (typeof opts === 'object' && opts !== null) {
                    this.options = { ...opts }
                }
            }
            async init() { return this }
            async scanModule(id: string, _code: string) {
                this.scanModuleCalls.push(id)
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

describe('shared scanner plugins', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('does not mutate source discovery options', async () => {
        const ctx: any = {}
        const pluginOptions = { scanner: { exclude: ['src/generated/**'] } } as any
        const plugins = [
            ScannerPlugin(pluginOptions, ctx),
            UsageGraphPlugin(pluginOptions, ctx)
        ]

        await findPlugin(plugins, 'master-css:scanner').configResolved.call({}, fakeViteConfig)

        expect(ctx.scanner.options).toEqual({
            exclude: ['src/generated/**'],
            verbose: 0
        })
    })

    describe('usage graph delegation', () => {
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
            return ctx.scanner.scanModuleCalls
        }

        test('delegates real source modules to scanModule', async () => {
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

        test('delegates non-virtual module ids to scanner module eligibility', async () => {
            const calls = await drive([
                '/proj/src/data.json',
                '/proj/src/icon.png',
                '/proj/src/icon.svg?url',
                '/proj/src/audio.mp3',
                '/proj/src/style.css',
                '/proj/src/App.vue?vue&type=style&index=0&lang.css',
            ])
            expect(calls).toEqual([
                '/proj/src/data.json',
                '/proj/src/icon.png',
                '/proj/src/icon.svg?url',
                '/proj/src/audio.mp3',
                '/proj/src/style.css',
                '/proj/src/App.vue?vue&type=style&index=0&lang.css',
            ])
        })

        test('virtual module ids are rejected before scanModule', async () => {
            const calls = await drive([
                '\0plugin-virtual',
                '\0plugin-vue:export-helper',
                '\0vite/modulepreload-polyfill.js',
            ])
            expect(calls).toEqual([])
        })

        test('does not wait for Vite request idle during dev server setup', () => {
            const usageGraphPlugin = UsageGraphPlugin({} as any, {} as any)

            expect(usageGraphPlugin).not.toHaveProperty('configureServer')
        })

        test('build transformIndexHtml feeds HTML to scanModule', async () => {
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

            expect(ctx.scanner.scanModuleCalls).toEqual(['/proj/index.html'])
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

            expect(ctx.scanner.scanModuleCalls).toEqual([])
        })
    })
})
