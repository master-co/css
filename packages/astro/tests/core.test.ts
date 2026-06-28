import { describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import masterCSS, {
    ASTRO_MIDDLEWARE_ENTRYPOINT,
    ASTRO_RUNTIME_INJECTION,
    ASTRO_SSR_EXTERNAL
} from '../src/core'
import defaultOptions from '../src/options'
import { externalizeAstroHydrationManifests } from '../src/external-hydration-manifest'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'

async function setup(options?: Parameters<typeof masterCSS>[0]) {
    const integration = masterCSS(options)
    const addMiddleware = vi.fn()
    const injectScript = vi.fn()
    const updateConfig = vi.fn()

    await integration.hooks['astro:config:setup']?.({
        addMiddleware,
        injectScript,
        updateConfig
    } as never)

    const config = updateConfig.mock.calls[0]?.[0] as {
        vite?: {
            plugins?: unknown[],
            ssr?: { external?: string[] },
            build?: { rollupOptions?: { external?: string[] } }
        }
    } | undefined
    const plugins = (config?.vite?.plugins || []).flat(Infinity) as { name?: string }[]

    return {
        addMiddleware,
        injectScript,
        pluginNames: plugins.map(({ name }) => name),
        viteConfig: config?.vite
    }
}

describe('@master/css.astro integration', () => {
    it('defaults to progressive mode', () => {
        expect(defaultOptions.mode).toBe('progressive')
    })

    it('adds Astro middleware and runtime script in progressive mode', async () => {
        const result = await setup()

        expect(result.addMiddleware).toHaveBeenCalledWith({
            order: 'pre',
            entrypoint: ASTRO_MIDDLEWARE_ENTRYPOINT
        })
        expect(result.injectScript).toHaveBeenCalledWith('page', ASTRO_RUNTIME_INJECTION)
        expect(result.pluginNames).not.toContain('master-css:pre-render')
        expect(result.pluginNames).not.toContain('master-css:inject-runtime')
        expect(result.viteConfig?.ssr?.external).toEqual(ASTRO_SSR_EXTERNAL)
        expect(result.viteConfig?.build?.rollupOptions?.external).toEqual(ASTRO_SSR_EXTERNAL)
    })

    it('uses Astro middleware without runtime script in pre-render mode', async () => {
        const result = await setup({ mode: 'pre-render' })

        expect(result.addMiddleware).toHaveBeenCalledWith({
            order: 'pre',
            entrypoint: ASTRO_MIDDLEWARE_ENTRYPOINT
        })
        expect(result.injectScript).not.toHaveBeenCalled()
        expect(result.pluginNames).not.toContain('master-css:pre-render')
    })

    it('injects runtime script without Astro middleware in runtime mode', async () => {
        const result = await setup({ mode: 'runtime' })

        expect(result.addMiddleware).not.toHaveBeenCalled()
        expect(result.injectScript).toHaveBeenCalledWith('page', ASTRO_RUNTIME_INJECTION)
        expect(result.pluginNames).toContain('master-css:avoid-fouc')
        expect(result.pluginNames).not.toContain('master-css:inject-runtime')
    })

    it('honors injectRuntime=false in progressive mode', async () => {
        const result = await setup({ mode: 'progressive', injectRuntime: false })

        expect(result.addMiddleware).toHaveBeenCalled()
        expect(result.injectScript).not.toHaveBeenCalled()
    })

    it('preloads the runtime manifest JSON in runtime static builds', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'master-css-astro-runtime-'))
        const assetsDir = join(dir, '_astro')
        const htmlFile = join(dir, 'index.html')
        try {
            mkdirSync(assetsDir, { recursive: true })
            writeFileSync(join(assetsDir, 'master-css-manifest.CzuVhIZV.json'), '{"version":1}')
            writeFileSync(join(assetsDir, 'page.C2zmEykZ.js'), 'const manifestURL = new URL("master-css-manifest.CzuVhIZV.json", import.meta.url).href;')
            writeFileSync(htmlFile, '<html><head></head><body></body></html>')
            const integration = masterCSS({ mode: 'runtime' })

            await integration.hooks['astro:config:done']?.({
                config: { base: '/docs' },
                buildOutput: 'static'
            } as never)
            await integration.hooks['astro:build:done']?.({ dir } as never)

            expect(readFileSync(htmlFile, 'utf-8')).toContain(
                '<link rel="modulepreload" as="json" crossorigin href="/docs/_astro/master-css-manifest.CzuVhIZV.json">'
            )
        } finally {
            rmSync(dir, { recursive: true, force: true })
        }
    })

    it('does not preload the runtime manifest outside runtime injection static builds', async () => {
        for (const scenario of [
            { integrationOptions: { mode: 'runtime', injectRuntime: false }, buildOutput: 'static' },
            { integrationOptions: { mode: 'progressive' }, buildOutput: 'static' },
            { integrationOptions: { mode: 'pre-render' }, buildOutput: 'static' },
            { integrationOptions: { mode: 'runtime' }, buildOutput: 'server' }
        ] as const) {
            const dir = mkdtempSync(join(tmpdir(), 'master-css-astro-no-runtime-'))
            const assetsDir = join(dir, '_astro')
            const htmlFile = join(dir, 'index.html')
            try {
                mkdirSync(assetsDir, { recursive: true })
                writeFileSync(join(assetsDir, 'master-css-manifest.CzuVhIZV.json'), '{"version":1}')
                writeFileSync(join(assetsDir, 'page.C2zmEykZ.js'), 'const manifestURL = new URL("master-css-manifest.CzuVhIZV.json", import.meta.url).href;')
                writeFileSync(htmlFile, '<html><head></head><body></body></html>')
                const integration = masterCSS(scenario.integrationOptions)

                await integration.hooks['astro:config:done']?.({
                    config: { base: '/' },
                    buildOutput: scenario.buildOutput
                } as never)
                await integration.hooks['astro:build:done']?.({ dir } as never)

                expect(readFileSync(htmlFile, 'utf-8')).not.toContain('rel="modulepreload" as="json"')
            } finally {
                rmSync(dir, { recursive: true, force: true })
            }
        }
    })

    it('externalizes static build hydration manifests', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'master-css-astro-'))
        const htmlFile = join(dir, 'index.html')
        try {
            writeFileSync(htmlFile, [
                '<html><head>',
                '<style id="master-css">@layer utilities{.block{display:block}}</style>',
                `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[{"className":"block"}]}</script>`,
                '</head><body><div class="block"></div></body></html>'
            ].join(''))

            const files = await externalizeAstroHydrationManifests(dir)
            const html = readFileSync(htmlFile, 'utf-8')

            expect(files).toHaveLength(1)
            expect(relative(dir, files[0]).split(/[\\/]/)).toEqual([
                '_master-css',
                'hydration',
                expect.stringMatching(/^master-css-hydration\.[0-9a-f]{8}\.json$/)
            ])
            expect(existsSync(files[0])).toBe(true)
            expect(readFileSync(files[0], 'utf-8')).toContain('"className":"block"')
            expect(html).toContain(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/_master-css/hydration/`)
            expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        } finally {
            rmSync(dir, { recursive: true, force: true })
        }
    })
})
