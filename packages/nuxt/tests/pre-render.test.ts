import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { dirname, join, resolve } from 'node:path'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import { setupNuxtTest } from './setup-test'
import { externalizeNitroPrerenderHydrationManifest } from '../src/module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/pre-render/')

setupNuxtTest({ rootDir })

it('matches generated CSS', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/)
    expect(match).toBeTruthy()
    if (!match) throw new Error('Expected a stylesheet link in Nuxt pre-render HTML.')
    const href = match[1]
    if (!href) throw new Error('Expected Nuxt pre-render stylesheet link to include an href.')
    expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
    const css = await $fetch(href) as string
    expect(css).toContain('.box')
    expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
    expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
})

it('externalizes Nitro prerender hydration manifests', () => {
    const dir = mkdtempSync(join(tmpdir(), 'master-css-nuxt-'))
    const route = {
        contentType: 'text/html',
        fileName: 'index.html',
        contents: [
            '<html><head>',
            '<style id="master-css">@layer utilities{.block{display:block}}</style>',
            `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">{"version":1,"rules":[{"className":"block"}]}</script>`,
            '</head></html>'
        ].join('')
    }
    try {
        externalizeNitroPrerenderHydrationManifest(route, {
            options: {
                baseURL: '/',
                output: {
                    publicDir: dir
                }
            }
        })

        const source = route.contents.match(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`))?.[1]
        expect(source).toMatch(/^\/_master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
        expect(route.contents).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        if (!source) throw new Error('Expected a Nuxt hydration manifest source.')
        const file = join(dir, source.replace(/^\//, ''))
        expect(existsSync(file)).toBe(true)
        expect(readFileSync(file, 'utf-8')).toContain('"className":"block"')
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})
