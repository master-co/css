import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, type PluginOption } from 'vite'
import { describe, expect, test } from 'vitest'
import masterCSS from '../../src/core'

interface BuildCSSFixtureOptions {
    appClass?: string
    plugins?: PluginOption[]
    prefix?: string
    setup?: (root: string) => void
    styleCSS: string
}

async function buildCSSFixture({
    appClass = '',
    plugins = [masterCSS()],
    prefix = 'master-css-vite-style-entry-',
    setup,
    styleCSS
}: BuildCSSFixtureOptions) {
    const tmpRoot = join(process.cwd(), 'tmp')
    mkdirSync(tmpRoot, { recursive: true })
    const root = mkdtempSync(join(tmpRoot, prefix))

    try {
        mkdirSync(join(root, 'src'), { recursive: true })
        writeFileSync(join(root, 'index.html'), [
            `<main${appClass ? ` class="${appClass}"` : ''}></main>`,
            '<script type="module" src="/src/main.ts"></script>'
        ].join('\n'))
        writeFileSync(join(root, 'src/main.ts'), 'import "./style.css"\n')
        writeFileSync(join(root, 'src/style.css'), styleCSS)
        setup?.(root)

        await build({
            root,
            logLevel: 'silent',
            plugins,
            build: {
                outDir: 'dist',
                emptyOutDir: true
            }
        })

        const assetsDir = join(root, 'dist/assets')
        const cssFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.css'))
        expect(cssFiles.length).toBeGreaterThan(0)
        if (!cssFiles.length) throw new Error('Expected Vite build to emit a CSS asset.')

        return cssFiles
            .map((file) => readFileSync(join(assetsDir, file), 'utf8'))
            .join('\n')
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
}

function expectMasterBaseCSS(css: string) {
    expect(css).toContain('@layer base')
    expect(css).toMatch(/text-rendering:\s*geometricprecision/)
    expect(css).toMatch(/font-family:\s*var\(--font-family-sans\)/)
}

describe('StyleEntryPlugin Vite build integration', () => {
    test('keeps package imports legal when @master/css appears first in the import block', async () => {
        const css = await buildCSSFixture({
            appClass: 'block',
            plugins: [
                masterCSS({ mode: 'static' })
            ],
            prefix: 'master-css-vite-import-order-',
            styleCSS: [
                '@import "@master/css";',
                '@import "fake-font/index.css";',
                '',
                ':root { --native-color: red; }'
            ].join('\n'),
            setup(root) {
                mkdirSync(join(root, 'node_modules/fake-font'), { recursive: true })
                writeFileSync(join(root, 'node_modules/fake-font/package.json'), JSON.stringify({
                    name: 'fake-font',
                    version: '1.0.0'
                }))
                writeFileSync(join(root, 'node_modules/fake-font/index.css'), '.fake-font{font-family:Fake;}')
            }
        })

        expect(css).toContain('.fake-font')
        expect(css).toContain('.block{display:block}')
        expect(css.indexOf('.fake-font')).toBeLessThan(css.indexOf('.block{display:block}'))
        expect(css).not.toContain('#master-css-slot')
        expect(css).not.toContain('@master/css')
    })

    test('default runtime mode emits preset base CSS for the root Master CSS import', async () => {
        const css = await buildCSSFixture({
            appClass: 'block',
            styleCSS: [
                '@import "@master/css";',
                '',
                'body { margin: 0; }'
            ].join('\n')
        })

        expectMasterBaseCSS(css)
        expect(css).toMatch(/body\s*\{\s*margin:\s*0/)
        expect(css).not.toContain('.block{display:block}')
        expect(css).not.toContain('@master/css')
        expect(css).not.toContain('#master-css-slot')
    })

    test.each(['progressive', 'pre-render'] as const)('%s mode emits preset base CSS for the root Master CSS import', async (mode) => {
        const css = await buildCSSFixture({
            appClass: 'block',
            plugins: [
                masterCSS({ mode })
            ],
            styleCSS: [
                '@import "@master/css";',
                '',
                'body { margin: 0; }'
            ].join('\n')
        })

        expectMasterBaseCSS(css)
        expect(css).toMatch(/body\s*\{\s*margin:\s*0/)
        expect(css).not.toContain('.block{display:block}')
        expect(css).not.toContain('@master/css')
        expect(css).not.toContain('#master-css-slot')
    })

    test('static mode emits preset base CSS for the root Master CSS import', async () => {
        const css = await buildCSSFixture({
            appClass: 'block',
            plugins: [
                masterCSS({ mode: 'static' })
            ],
            styleCSS: [
                '@import "@master/css";',
                '',
                'body { margin: 0; }'
            ].join('\n')
        })

        expectMasterBaseCSS(css)
        expect(css).toContain('.block{display:block}')
        expect(css).not.toContain('@master/css')
        expect(css).not.toContain('#master-css-slot')
    })

    test('default runtime mode lets Vite expand the explicit base.css subpath import', async () => {
        const css = await buildCSSFixture({
            styleCSS: [
                '@import "@master/css/base.css";',
                '',
                'body { margin: 0; }'
            ].join('\n')
        })

        expectMasterBaseCSS(css)
        expect(css).toMatch(/body\s*\{\s*margin:\s*0/)
        expect(css).not.toContain('@master/css/base.css')
        expect(css).not.toContain('#master-css-slot')
    })
})
