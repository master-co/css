/**
 * Tests for the D1 fix in StyleEntryBuildPlugin (the build-mode plugin
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
 *   - Track whether a managed CSS import emitted the placeholder.
 *   - In `generateBundle`, count how many CSS assets had a successful
 *     replacement.
 *   - If the placeholder was emitted but no asset matched, call
 *     `this.warn(...)` so the user finds out at build time, not at
 *     runtime against a blank page.
 */
import { describe, test, expect, vi } from 'vitest'
import StyleEntryBuildPlugin from '../../src/plugins/style-entry-build'
import StyleEntryPlugin from '../../src/plugins/style-entry'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

function makeContext(slot: string, css: string) {
    return {
        extractor: {
            slotCSSRule: slot,
            css: { text: css },
            config: {},
            latentClasses: new Set(),
            validClasses: new Set(),
            nativeClassNames: new Set(),
            usedNativeClasses: new Set(),
            options: { includeClasses: [] },
            emit: vi.fn(),
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

const SLOT = '#master-css-slot{--slot:0}'
const REAL_CSS = '.bg\\:white{background-color:white}.fg\\:black{color:black}'

describe('StyleEntryBuildPlugin (D1 placeholder-leak warn)', () => {
    test('replaces placeholder when present and does NOT warn', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()

        ctx.virtualCSSPlaceholderEmitted = true

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
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()

        ctx.virtualCSSPlaceholderEmitted = true

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
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()

        ctx.virtualCSSPlaceholderEmitted = true

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
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()

        ctx.virtualCSSPlaceholderEmitted = true

        // Simulate a downstream PostCSS plugin / minifier having mutated
        // the placeholder rule beyond recognition.
        const bundle = makeBundle({
            'assets/index-abc.css': 'body{margin:0}#master_css_slot{--slot:0}',
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(warn).toHaveBeenCalledTimes(1)
        const msg = warn.mock.calls[0][0] as string
        expect(msg).toContain('Could not splice managed style CSS')
        expect(msg).toContain(SLOT)
    })

    test('does NOT warn if no managed CSS import emitted the placeholder', async () => {
        // No extracted CSS to splice in, no placeholder ever emitted →
        // generateBundle must be a quiet no-op.
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()

        const bundle = makeBundle({
            'assets/index-abc.css': 'body{margin:0}',
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(warn).not.toHaveBeenCalled()
    })

    test('does NOT warn when extracted CSS is empty (no classes found at all)', async () => {
        // Edge case: a managed CSS import exists but no Master CSS class
        // was extracted (e.g. config-only project). Warning here would be
        // noise — there's nothing to splice anyway.
        const ctx = makeContext(SLOT, '')
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()

        ctx.virtualCSSPlaceholderEmitted = true

        const bundle = makeBundle({
            'assets/index-abc.css': 'body{margin:0}', // placeholder absent
        })
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(warn).not.toHaveBeenCalled()
    })

    test('only treats `type: asset` chunks (skips `chunk` entries)', async () => {
        const ctx = makeContext(SLOT, REAL_CSS)
        const plugin = StyleEntryBuildPlugin({} as any, ctx)
        const warn = vi.fn()
        ctx.virtualCSSPlaceholderEmitted = true

        const bundle: Record<string, any> = {
            'assets/index-abc.css': { type: 'asset', source: `body{margin:0}${SLOT}` },
            'assets/index-abc.js': { type: 'chunk', code: 'console.log(1)' }, // must not be touched
        }
        await (plugin as any).generateBundle.call({ warn }, {}, bundle)

        expect(bundle['assets/index-abc.css'].source).toContain(REAL_CSS)
        expect(bundle['assets/index-abc.js'].code).toBe('console.log(1)')
        expect(warn).not.toHaveBeenCalled()
    })

    test('compiles managed CSS entry config rules and preserves used native CSS', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-'))
        try {
            const entryPath = path.join(root, 'app.css')
            const source = `
                @master;

                body {
                    margin: 0;
                }

                .native-card,
                .unused-card {
                    color: red;
                }

                @layer components {
                    .btn {
                        display: inline-flex;
                    }
                }
            `
            writeFileSync(entryPath, source)
            const ctx = makeContext(SLOT, '')
            ctx.config = {
                command: 'build',
                root,
                server: {
                    fs: {
                        allow: []
                    }
                }
            }
            ctx.extractor.validClasses = new Set(['btn'])
            ctx.extractor.usedNativeClasses = new Set(['native-card'])
            ctx.extractor.options.includeClasses = []
            const styleEntryPlugin = StyleEntryPlugin({ mode: 'static' } as any, ctx)
            const plugin = StyleEntryBuildPlugin({} as any, ctx)
            const warn = vi.fn()

            await (styleEntryPlugin as any).transform.call({ addWatchFile: vi.fn() }, source, entryPath)

            const bundle = makeBundle({
                'assets/index-abc.css': SLOT,
            })
            await (plugin as any).generateBundle.call({ warn }, {}, bundle)

            const css = String(bundle['assets/index-abc.css'].source)
            expect(css).toContain('body')
            expect(css).toContain('.native-card')
            expect(css).not.toContain('.unused-card')
            expect(css).toContain('.btn{display:inline-flex}')
            expect(warn).not.toHaveBeenCalled()
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    test('uses the managed CSS entry for config and native CSS shaking', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-'))
        try {
            const entryPath = path.join(root, 'app.css')
            const source = `
                @master;

                .native-used,
                .native-unused {
                    color: var(--color-primary);
                }

                @master {
                    --color-primary: #123456;
                }

                @layer components {
                    .btn {
                        display: grid;
                    }
                }
            `
            writeFileSync(entryPath, source)
            const ctx = makeContext(SLOT, '')
            ctx.config = {
                command: 'build',
                root,
                server: {
                    fs: {
                        allow: []
                    }
                }
            }
            ctx.extractor.latentClasses = new Set(['btn', 'native-used'])

            const styleEntryPlugin = StyleEntryPlugin({ mode: 'static' } as any, ctx)
            const plugin = StyleEntryBuildPlugin({} as any, ctx)
            const warn = vi.fn()

            await (styleEntryPlugin as any).transform.call({ addWatchFile: vi.fn() }, source, entryPath)

            const bundle = makeBundle({
                'assets/index-abc.css': SLOT,
            })
            await (plugin as any).generateBundle.call({ warn }, {}, bundle)

            const css = String(bundle['assets/index-abc.css'].source)
            expect(css).toContain('.native-used')
            expect(css).not.toContain('.native-unused')
            expect(css).toMatch(/--color-primary:(rgb\(18 52 86\)|#123456)/)
            expect(css).toContain('.btn{display:grid}')
            expect(warn).not.toHaveBeenCalled()
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
