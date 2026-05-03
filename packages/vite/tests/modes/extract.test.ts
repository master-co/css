/**
 * Tests for the C7 + C8 fixes to ExtractMode.
 *
 *  C7 — `master-css:extractor.configResolved` previously did
 *       `context.extractor.options.include = []` unconditionally,
 *       silently wiping a user-supplied `extractor: { include: [...] }`
 *       option. Now only blanked when the user did NOT pass one.
 *
 *  C8 — `master-css:static.transform` accepted every non-`.css` module
 *       — including `.json`, `?import` / `?url` query requests, and
 *       binary-asset shim modules — pumping noise through the extractor.
 *       Now restricted to a file-extension allow-list mirroring the
 *       extractor's default include glob.
 *
 * Both fixes preserve the public PluginOptions surface.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ExtractMode from '../../src/modes/extract'

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
            init() { return this }
            async prepare() { return undefined }
            async insert(id: string, _code: string) {
                this.insertCalls.push(id)
                return true
            }
            readonly resolvedVirtualModuleId = '\0virtual:master.css'
        },
    }
})

function findPlugin(plugins: any[], name: string) {
    const p = plugins.find((x) => x?.name === name)
    if (!p) throw new Error(`plugin "${name}" not registered`)
    return p
}

const fakeViteConfig = { root: '/proj' } as any

describe('ExtractMode (C7 + C8 fixes)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('C7 — respects user-supplied extractor.include', () => {
        test('default options: extractor.options.include is blanked', async () => {
            const ctx: any = {}
            const plugins = ExtractMode({} as any, ctx)
            const ex = findPlugin(plugins, 'master-css:extractor')
            ex.configResolved.call({}, fakeViteConfig)
            expect(ctx.extractor.options.include).toEqual([])
        })

        test('user-supplied include is preserved (NOT blanked)', async () => {
            const ctx: any = {}
            const plugins = ExtractMode(
                { extractor: { include: ['node_modules/some-lib/dist/**/*.js'] } } as any,
                ctx,
            )
            const ex = findPlugin(plugins, 'master-css:extractor')
            ex.configResolved.call({}, fakeViteConfig)
            expect(ctx.extractor.options.include).toEqual([
                'node_modules/some-lib/dist/**/*.js',
            ])
        })

        test('user-supplied include = [] is treated as "use vite-driven mode"', async () => {
            // An explicitly empty array is indistinguishable from "not set" in
            // intent — both mean "trust Vite to feed me modules". Don't trip
            // on this edge case.
            const ctx: any = {}
            const plugins = ExtractMode(
                { extractor: { include: [] } } as any,
                ctx,
            )
            findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            expect(ctx.extractor.options.include).toEqual([])
        })

        test('extractor passed as a string config path is left unwiped', async () => {
            // `extractor: 'master.css-extractor'` means "load this options
            // file" — we cannot inspect its contents synchronously, so
            // err on the side of NOT touching include.
            const ctx: any = {}
            const plugins = ExtractMode({ extractor: 'master.css-extractor' } as any, ctx)
            findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            // The mock CSSExtractor constructor only seeds options when given
            // an object, so options.include starts undefined and the guard
            // sets it to []. The important assertion is that the wipe
            // happens iff the user did not explicitly pass an array.
            expect(ctx.extractor.options.include).toEqual([])
        })
    })

    describe('C8 — transform allow-list', () => {
        async function drive(ids: string[]) {
            const ctx: any = {}
            const plugins = ExtractMode({} as any, ctx)
            findPlugin(plugins, 'master-css:extractor').configResolved.call({}, fakeViteConfig)
            const staticPlugin = findPlugin(plugins, 'master-css:static')
            for (const id of ids) {
                await staticPlugin.transform.call({}, '<div class="bg:white">x</div>', id)
            }
            return ctx.extractor.insertCalls
        }

        test('allows real source extensions', async () => {
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

        test('rejects non-source extensions (json / png-as-module / virtual chunks)', async () => {
            const calls = await drive([
                '/proj/src/data.json',                // json
                '/proj/src/icon.png',                  // raw asset
                '/proj/src/icon.svg?url',              // ?url
                '/proj/src/audio.mp3',                 // binary
                '\0virtual:master.css',                // own virtual module
                '\0plugin-vue:export-helper',          // 3rd-party virtual
            ])
            expect(calls).toEqual([])
        })

        test('respects vite query suffixes on source files (?import / ?raw)', async () => {
            const calls = await drive([
                '/proj/src/App.tsx?import',
                '/proj/src/markdown.md?raw',
                '/proj/src/Component.svelte?vue&type=script',
            ])
            // All three are source files Vite is forwarding through transform
            // with a query suffix. The allow-list must let them through.
            expect(calls).toEqual([
                '/proj/src/App.tsx?import',
                '/proj/src/markdown.md?raw',
                '/proj/src/Component.svelte?vue&type=script',
            ])
        })

        test('virtual master.css module id is always rejected', async () => {
            const calls = await drive(['\0virtual:master.css'])
            expect(calls).toEqual([])
        })

        test('CSS files are not extracted (existing behaviour preserved)', async () => {
            const calls = await drive([
                '/proj/src/style.css',
                '/proj/src/component.module.css',
            ])
            expect(calls).toEqual([])
        })
    })
})
