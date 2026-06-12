import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import masterCSS from '../../src'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/pre-render/master-css-entry')

async function resolveConfigHooks(plugins: any[], config: any) {
    for (const plugin of plugins) {
        if (typeof plugin.configResolved === 'function') {
            await plugin.configResolved.call({}, config)
        }
    }
}

describe('PreRenderPlugin', () => {
    it('renders HTML classes with the managed CSS plan entry', async () => {
        const plugins = masterCSS({
            mode: 'pre-render',
        })
        const viteConfig = {
            root: FIXTURE_DIR,
            plugins,
            server: {
                fs: {
                    allow: [],
                },
            },
        }

        await resolveConfigHooks(plugins, viteConfig)

        const preRenderPlugin = plugins.find((plugin) => plugin.name === 'master-css:pre-render')
        expect(preRenderPlugin).toBeDefined()
        const result = await (preRenderPlugin as any).transformIndexHtml.call(
            {},
            '<html><head></head><body><section class="card p:2">Content</section></body></html>',
        )
        const html = typeof result === 'string' ? result : result.html

        expect(viteConfig.server.fs.allow).toContain(path.join(FIXTURE_DIR, 'app.css'))
        expect(html).toContain('<style id="master">')
        expect(html).toContain('@layer components{.card{background-color:var(--color-brand);border-color:#456}')
        expect(html).toContain('@media (width>=48rem){.card{font-size:1.125rem}}')
        expect(html).toContain('@layer utilities{.p\\:2{padding:0.125rem}}')
    })

    it('reloads CSS entry dependencies for pre-rendered HTML', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-pre-render-'))
        const entryPath = path.join(root, 'app.css')
        const themePath = path.join(root, 'theme.css')
        try {
            writeFileSync(themePath, [
                '@components {',
                '    card { color: #123456; }',
                '}'
            ].join('\n'))
            writeFileSync(entryPath, [
                '@master;',
                '@import "./theme.css";',
                '',
                '@theme {',
                '    --color-brand: #123;',
                '}'
            ].join('\n'))

            const plugins = masterCSS({
                mode: 'pre-render'
            })
            const viteConfig = {
                root,
                plugins,
                server: {
                    fs: {
                        allow: [],
                    },
                },
            }

            await resolveConfigHooks(plugins, viteConfig)

            const preRenderPlugin = plugins.find((plugin) => plugin.name === 'master-css:pre-render')
            expect(preRenderPlugin).toBeDefined()
            let result = await (preRenderPlugin as any).transformIndexHtml.call(
                {},
                '<html><head></head><body><section class="card">Content</section></body></html>',
            )
            let html = typeof result === 'string' ? result : result.html
            expect(html).toContain('.card{color:#123456}')

            writeFileSync(themePath, [
                '@components {',
                '    card { color: #abcdef; }',
                '}'
            ].join('\n'))
            await (preRenderPlugin as any).handleHotUpdate.call({}, { file: themePath })

            result = await (preRenderPlugin as any).transformIndexHtml.call(
                {},
                '<html><head></head><body><section class="card">Content</section></body></html>',
            )
            html = typeof result === 'string' ? result : result.html
            expect(html).toContain('.card{color:#abcdef}')
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
