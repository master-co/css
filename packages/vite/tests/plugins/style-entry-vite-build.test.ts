import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import { describe, expect, test } from 'vitest'
import masterCSS from '../../src/core'

describe('StyleEntryPlugin Vite build integration', () => {
    test('keeps package imports legal when @master/css appears first in the import block', async () => {
        const tmpRoot = join(process.cwd(), 'tmp')
        mkdirSync(tmpRoot, { recursive: true })
        const root = mkdtempSync(join(tmpRoot, 'master-css-vite-import-order-'))

        try {
            mkdirSync(join(root, 'src'), { recursive: true })
            mkdirSync(join(root, 'node_modules/fake-font'), { recursive: true })
            writeFileSync(join(root, 'index.html'), [
                '<main class="block"></main>',
                '<script type="module" src="/src/main.ts"></script>'
            ].join('\n'))
            writeFileSync(join(root, 'src/main.ts'), 'import "./style.css"\n')
            writeFileSync(join(root, 'src/style.css'), [
                '@import "@master/css";',
                '@import "fake-font/index.css";',
                '',
                ':root { --native-color: red; }'
            ].join('\n'))
            writeFileSync(join(root, 'node_modules/fake-font/package.json'), JSON.stringify({
                name: 'fake-font',
                version: '1.0.0'
            }))
            writeFileSync(join(root, 'node_modules/fake-font/index.css'), '.fake-font{font-family:Fake;}')

            await build({
                root,
                logLevel: 'silent',
                plugins: [
                    masterCSS({ mode: 'static' })
                ],
                build: {
                    outDir: 'dist',
                    emptyOutDir: true
                }
            })

            const assetsDir = join(root, 'dist/assets')
            const cssFile = readdirSync(assetsDir).find((file) => file.endsWith('.css'))
            expect(cssFile).toBeTruthy()

            const css = readFileSync(join(assetsDir, cssFile!), 'utf8')
            expect(css).toContain('.fake-font')
            expect(css).toContain('.block{display:block}')
            expect(css.indexOf('.fake-font')).toBeLessThan(css.indexOf('.block{display:block}'))
            expect(css).not.toContain('#master-css-slot')
            expect(css).not.toContain('@master/css')
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
