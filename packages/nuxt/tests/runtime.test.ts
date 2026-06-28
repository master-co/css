import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'
import { MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID } from '@master/css-schema/hydration-manifest'
import { setupNuxtTest } from './setup-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/runtime/')

setupNuxtTest({ rootDir })

function getManifestPreloadHref(html: string) {
    return html.match(/<link\b(?=[^>]*\brel="modulepreload")(?=[^>]*\bas="json")(?=[^>]*\bhref="([^"]*master-css-manifest[^"]*\.json)")/i)?.[1]
}

it('does not pre-render style#master-css in runtime mode', async () => {
    const html = await $fetch('/') as string
    expect(html).toContain('class="box"')
    expect(html).not.toContain('style id="master-css"')
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
})

it('preloads the runtime manifest JSON in runtime mode', async () => {
    const html = await $fetch('/') as string
    const href = getManifestPreloadHref(html)

    expect(href).toMatch(/^\/_master-css\/manifest\/master-css-manifest\.[0-9a-f]{8}\.json$/)
    const manifest = await $fetch(href || '') as { version?: number } | string
    const parsedManifest = typeof manifest === 'string' ? JSON.parse(manifest) : manifest
    expect(parsedManifest.version).toBe(1)
})
