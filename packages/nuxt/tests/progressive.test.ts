import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import { setupNuxtTest } from './setup-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/progressive/')

setupNuxtTest({ rootDir })

it('matches generated CSS snapshot', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/)
    expect(match).toBeTruthy()
    if (!match) throw new Error('Expected a stylesheet link in Nuxt progressive HTML.')
    const href = match[1]
    if (!href) throw new Error('Expected Nuxt progressive stylesheet link to include an href.')
    expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
    expect(html).not.toMatch(/<link\b(?=[^>]*\brel="modulepreload")(?=[^>]*\bas="json")(?=[^>]*master-css-manifest)/i)
    const css = await $fetch(href) as string
    expect(css).toContain('.box')
    expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
    expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
})
