import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RUNTIME_ASSET_BASE_URL = 'http://master-css-runtime.test'
const RUNTIME_SCRIPT_URL = `${RUNTIME_ASSET_BASE_URL}/css-runtime@rc`
const DEFAULT_MANIFEST_URL = `${RUNTIME_ASSET_BASE_URL}/css-runtime@rc/default-manifest.json`

async function routeRuntimeAssets(page: Page) {
    await page.route(RUNTIME_SCRIPT_URL, (route) => {
        route.fulfill({
            contentType: 'text/javascript',
            body: readFileSync(resolve(__dirname, '../dist/global.min.js'), 'utf8')
        })
    })
    await page.route(DEFAULT_MANIFEST_URL, (route) => {
        route.fulfill({
            contentType: 'application/json',
            headers: {
                'access-control-allow-origin': '*'
            },
            body: readFileSync(resolve(__dirname, '../dist/default-manifest.json'), 'utf8')
        })
    })
}

async function startGlobalRuntime(page: Page) {
    await routeRuntimeAssets(page)
    await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })
    await page.waitForFunction(() => !!globalThis.masterCSSRuntime?.observing)
}

test('uses split bundled preset manifest', async ({ page }) => {
    await startGlobalRuntime(page)

    expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('font-weight-bold'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('color-white'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
})

test('ignores global manifest override', async ({ page }) => {
    const manifest = {
        version: 1,
        variables: [
            { name: 'primary', key: 'primary', type: 'string', value: '#000000' }
        ]
    } as const
    await page.evaluate(({ manifest }) => {
        (globalThis as typeof globalThis & { masterCSSManifest?: unknown }).masterCSSManifest = manifest
    }, { manifest })
    await startGlobalRuntime(page)

    expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('primary'))).toBeUndefined()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.variables.get('font-weight-bold'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.manifest.version)).toBe(1)
})
