/**
 * Tests for the D1 fix in VirtualCSSModulePlugin (the build-mode plugin
 * that swaps the slot CSS placeholder for the real extracted CSS).
 *
 * D1 — `generateBundle` previously did a literal `String.replace()` on
 * every `*.css` asset and silently no-op'd if the placeholder was not
 * found. A downstream PostCSS plugin or minifier rewriting the placeholder
 * (e.g. unescaping `\:` in the ID selector, dropping the empty
 * `--slot:0` declaration, normalising whitespace) made the build ship
 * an empty stylesheet without warning.
 *
 * The fix:
 *   - Track whether the virtual module was ever emitted (`load` was hit).
 *   - In `generateBundle`, count how many CSS assets had a successful
 *     replacement.
 *   - If the placeholder was emitted but no asset matched, call
 *     `this.warn(...)` so the user finds out at build time, not at
 *     runtime against a blank page.
 */
import { describe, test, expect, vi } from 'vitest'
import VirtualCSSModulePlugin from '../../src/plugins/virtual-css-module'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

function makeContext(slot: string, css: string) {
    return {
        extractor: {
            resolvedVirtualModuleId: '\0virtual:master.css',
            slotCSSRule: slot,
            css: { text: css },
            config: {},
            latentClasses: new Set(),
            validClasses: new Set(),
            nativeClassNames: new Set(),
            usedNativeClasses: new Set(),
            options: { includeClasses: [], module: 'virtual:master.css' },
        },
    } as any
}

function makeBundle(entries: Record<string, string>) {
    const bundle: Record<string, any> = {}
    for (const [name, source] of Object.entries(entries)) {
        bundle[name] = { type: 'asset', source }
    }
    return bundle
}

const SLOT = '#virtual\\:master\\.css{--slot:0}'
const REAL_CSS = '.bg\\:white{background-color:white}.fg\\:black{color:black}'

describe('VirtualCSSModulePlugin (D1 placeholder-leak warn)', () => {
    test('replaces placeholder when present and does NOT warn', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()

        // Simulate the user importing virtual:master.css → load() runs.
        const loaded = (plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)
        expect(loaded).toBe(SLOT)

        const bundle = makeBundle({
            'assets/index-abc.css': `body{margin:0}${SLOT}`,
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(bundle['assets/index-abc.css'].source).toContain(REAL_CSS)
        expect(bundle['assets/index-abc.css'].source).not.toContain(SLOT)
        expect(warn).not.toHaveBeenCalled()
    })

    test('deduplicates duplicate placeholder occurrences in the same CSS asset', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()

        ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

        const bundle = makeBundle({
            'assets/index-abc.css': `${SLOT}body{margin:0}${SLOT}`,
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        const css = String(bundle['assets/index-abc.css'].source)
        expect(css).not.toContain(SLOT)
        expect(css.match(new RegExp(REAL_CSS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toHaveLength(1)
        expect(css).toBe(`${REAL_CSS}body{margin:0}`)
        expect(warn).not.toHaveBeenCalled()
    })

    test('keeps one extracted CSS copy per CSS asset', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()

        ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

        const bundle = makeBundle({
            'assets/index-abc.css': SLOT,
            'assets/admin-abc.css': `${SLOT}${SLOT}`,
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(bundle['assets/index-abc.css'].source).toBe(REAL_CSS)
        expect(bundle['assets/admin-abc.css'].source).toBe(REAL_CSS)
        expect(warn).not.toHaveBeenCalled()
    })

    test('warns when placeholder was emitted but no CSS asset still contains it', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()

        ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

        // Simulate a downstream PostCSS plugin / minifier having mutated
        // the placeholder rule beyond recognition.
        const bundle = makeBundle({
            'assets/index-abc.css': 'body{margin:0}#virtual_master_css{--slot:0}',
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(warn).toHaveBeenCalledTimes(1)
        const msg = warn.mock.calls[0][0] as string
        expect(msg).toContain('Could not splice extracted CSS')
        expect(msg).toContain(SLOT)
    })

    test('does NOT warn if the user never imported the virtual module', async () => {
        // No extracted CSS to splice in, no placeholder ever emitted →
        // generateBundle must be a quiet no-op.
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()

        const bundle = makeBundle({
            'assets/index-abc.css': 'body{margin:0}',
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(warn).not.toHaveBeenCalled()
    })

    test('does NOT warn when extracted CSS is empty (no classes found at all)', async () => {
        // Edge case: user wired the virtual module but no Master CSS class
        // was extracted (e.g. config-only project). Warning here would be
        // noise — there's nothing to splice anyway.
        const ctx = makeContext(SLOT, '')
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()

        ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

        const bundle = makeBundle({
            'assets/index-abc.css': 'body{margin:0}', // placeholder absent
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(warn).not.toHaveBeenCalled()
    })

    test('only treats `type: asset` chunks (skips `chunk` entries)', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = VirtualCSSModulePlugin({} as any, ctx)
        const warn = vi.fn()
        ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

        const bundle: Record<string, any> = {
            'assets/index-abc.css': { type: 'asset', source: `body{margin:0}${SLOT}` },
            'assets/index-abc.js': { type: 'chunk', code: 'console.log(1)' }, // must not be touched
        }
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(bundle['assets/index-abc.css'].source).toContain(REAL_CSS)
        expect(bundle['assets/index-abc.js'].code).toBe('console.log(1)')
        expect(warn).not.toHaveBeenCalled()
    })

    test('compiles root master.css config rules and ignores native CSS', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-'))
        try {
            const configPath = path.join(root, 'master.css')
            writeFileSync(configPath, `
                body {
                    margin: 0;
                }

                .native-card,
                .unused-card {
                    color: red;
                }

                @master {
                    .btn {
                        display: inline-flex;
                    }
                }
            `)
            const ctx = makeContext(SLOT, '@layer base,theme,preset,main,general;')
            ctx.extractor.resolvedConfigPath = configPath
            ctx.extractor.validClasses = new Set(['btn'])
            ctx.extractor.usedNativeClasses = new Set(['native-card'])
            ctx.extractor.options.includeClasses = []
            const plugin = VirtualCSSModulePlugin({} as any, ctx)
            const warn = vi.fn()
            ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

            const bundle = makeBundle({
                'assets/index-abc.css': SLOT,
            })
            await (plugin as any).generateBundle.call({ warn }, {}, bundle)

            const css = String(bundle['assets/index-abc.css'].source)
            expect(css).not.toContain('body')
            expect(css).not.toContain('.native-card')
            expect(css).not.toContain('.unused-card')
            expect(css).toContain('.btn{display:inline-flex}')
            expect(warn).not.toHaveBeenCalled()
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    test('ignores source stylesheet CSS configs and uses root master.css only', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-'))
        try {
            const configPath = path.join(root, 'master.css')
            writeFileSync(configPath, `
                @master {
                    --color-primary: #123456;

                    .btn {
                        display: grid;
                    }
                }
            `)
            const ctx = makeContext(SLOT, '@layer base,theme,preset,main,general;')
            ctx.extractor.resolvedConfigPath = configPath
            ctx.extractor.latentClasses = new Set(['btn', 'native-used'])
            ctx.styleCSSSources = new Map([[
                path.join(root, 'src/styles.scss'),
                `
                    $accent: red;

                    .native-used,
                    .native-unused {
                        color: var(--color-primary);
                    }

                    @master {
                        .btn {
                            display: inline-flex;
                        }
                    }
                `
            ]])

            const plugin = VirtualCSSModulePlugin({} as any, ctx)
            const warn = vi.fn()
            ;(plugin as any).load.call({ warn }, ctx.extractor.resolvedVirtualModuleId)

            const bundle = makeBundle({
                'assets/index-abc.css': SLOT,
            })
            await (plugin as any).generateBundle.call({ warn }, {}, bundle)

            const css = String(bundle['assets/index-abc.css'].source)
            expect(css).toContain('.native-used')
            expect(css).not.toContain('.native-unused')
            expect(css).toContain('--color-primary:rgb(18 52 86)')
            expect(css).toContain('.btn{display:grid}')
            expect(css).not.toContain('.btn{display:inline-flex}')
            expect(warn).not.toHaveBeenCalled()
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
