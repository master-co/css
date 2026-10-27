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
        await page.waitForFunction(() => {
            const probe = document.querySelector('#probe')
            return probe && getComputedStyle(probe).display === 'block'
                && getComputedStyle(probe).color === 'rgb(18, 52, 86)'
                && getComputedStyle(document.documentElement).getPropertyValue('--color-host').trim() === '#123456'
        })
        const state = await page.evaluate(() => {
            const probe = document.querySelector('#probe')!
            return {
                color: getComputedStyle(probe).color,
                token: getComputedStyle(document.documentElement).getPropertyValue('--color-host').trim()
            }
        })
        expect(state).toEqual({ color: 'rgb(18, 52, 86)', token: '#123456' })
    } finally {
        await page.close()
    }
})
