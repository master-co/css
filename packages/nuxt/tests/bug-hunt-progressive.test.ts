import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPage, url } from '@nuxt/test-utils/e2e'
import { expect, it } from 'vitest'
import { setupNuxtTest } from './setup-test'

// BH-0023: progressive mode must hydrate and style new classes after SSR.
setupNuxtTest({ rootDir: resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/progressive') })
it('loads its client manifest and handles new runtime classes', async () => {
    const page = await createPage()
    const failed: string[] = []
    const assets: { url: string, status: number, contentType: string | undefined }[] = []
    const errors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => { if (response.url().includes('/_master-css/manifest/')) assets.push({ url: response.url(), status: response.status(), contentType: response.headers()['content-type'] }) })
    page.on('response', (response) => { if (response.status() >= 400) failed.push(response.url()) })
    try {
        await page.goto(url('/'), { waitUntil: 'domcontentloaded' })
        await page.evaluate(() => {
            const probe = document.createElement('div')
            probe.id = 'bh-0023-probe'
            probe.className = 'hidden'
            document.body.append(probe)
        })
        const styled = await page.waitForFunction(() => getComputedStyle(document.getElementById('bh-0023-probe')!).display === 'none', undefined, { timeout: 5000 }).then(() => true, () => false)
        expect({ styled, failed }, JSON.stringify({ assets, errors })).toEqual({ styled: true, failed: [] })
    } finally {
        await page.close()
    }
})
