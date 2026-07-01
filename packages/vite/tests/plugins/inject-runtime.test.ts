import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'
import masterCSS from '../../src/core'
import {
    DEV_RUNTIME_ENTRY_ID,
    RUNTIME_ENTRY_ID
} from '../../src/common'
import InjectRuntimePlugin, { InjectRuntimeServePlugin } from '../../src/plugins/inject-runtime'

describe('InjectRuntimePlugin', () => {
    it('injects the runtime through a Vite build entry tag', () => {
        const plugin = InjectRuntimePlugin({})
        const result = (plugin.transformIndexHtml as any).handler('<html><head></head><body></body></html>', {})

        expect(plugin.apply).toBe('build')
        expect((plugin.transformIndexHtml as any).order).toBe('pre')
        expect(result.html).toBe('<html><head></head><body></body></html>')
        expect(result.tags).toHaveLength(1)
        expect(result.tags[0]).toMatchObject({
            tag: 'script',
            attrs: {
                type: 'module',
                src: RUNTIME_ENTRY_ID
            },
            injectTo: 'body'
        })
        expect(result.tags[0].children).toBeUndefined()
    })

    it('injects the runtime through a Vite dev id tag', () => {
        const plugin = InjectRuntimeServePlugin({})
        const result = (plugin.transformIndexHtml as any).handler(
            '<html><head></head><body></body></html>',
            { server: {} }
        )

        expect(plugin.apply).toBe('serve')
        expect((plugin.transformIndexHtml as any).order).toBe('post')
        expect(result.tags[0].attrs.src).toBe(DEV_RUNTIME_ENTRY_ID)
        expect(result.tags[0].injectTo).toBe('body')
    })

    it('does not inject twice when the runtime entry is already present', () => {
        const plugin = InjectRuntimePlugin({})
        const result = (plugin.transformIndexHtml as any).handler(
            `<script type="module" src="${RUNTIME_ENTRY_ID}"></script>`,
            {}
        )

        expect(result).toBeUndefined()
    })

    it('bundles the injected runtime module in production builds', async () => {
        const tmpRoot = join(process.cwd(), 'tmp')
        mkdirSync(tmpRoot, { recursive: true })
        const root = mkdtempSync(join(tmpRoot, 'master-css-vite-runtime-'))

        try {
            mkdirSync(join(root, 'src'), { recursive: true })
            writeFileSync(join(root, 'index.html'), [
                '<html>',
                '<head></head>',
                '<body>',
                '<main class="block"></main>',
                '<script type="module" src="/src/main.ts"></script>',
                '</body>',
                '</html>'
            ].join(''))
            writeFileSync(join(root, 'src/main.ts'), '')

            await build({
                root,
                logLevel: 'silent',
                resolve: {
                    alias: {
                        [RUNTIME_ENTRY_ID]: resolve(process.cwd(), 'src/runtime.ts')
                    }
                },
                plugins: [
                    masterCSS({ mode: 'runtime' })
                ],
                build: {
                    outDir: 'dist',
                    emptyOutDir: true
                }
            })

            const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
            const assetsDir = join(root, 'dist/assets')
            const jsFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.js'))
            const jsSources = jsFiles.map((file) => readFileSync(join(assetsDir, file), 'utf8')).join('\n')

            expect(html).toMatch(/<script\b[^>]*\bsrc="\/assets\/[^"]+\.js"/)
            expect(html).toMatch(/<link\b(?=[^>]*\brel="modulepreload")(?=[^>]*\bcrossorigin)(?![^>]*\bas="json")(?=[^>]*\bhref="\/assets\/[^"]+\.js")[^>]*>/)
            expect(html).not.toContain('@master/css-runtime')
            expect(html).not.toContain(RUNTIME_ENTRY_ID)
            expect(jsSources).not.toContain(`from '@master/css-runtime'`)
            expect(jsSources).not.toContain(`from "@master/css-runtime"`)
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
