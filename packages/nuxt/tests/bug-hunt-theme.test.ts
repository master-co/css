import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPage } from '@nuxt/test-utils/e2e'
import { expect, it } from 'vitest'
import { setupNuxtTest } from './setup-test'

setupNuxtTest({
    rootDir: resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/runtime')
})

it('BH-0036 compiles theme variables before runtime uses emitted globals', async () => {
    const page = await createPage('/')
    try {
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'block')
        expect(await page.locator('#probe').evaluate(element => getComputedStyle(element).color))
            .toBe('rgb(18, 52, 86)')
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-host').trim()))
            .toBe('#123456')
    } finally {
        await page.close()
    }
})
