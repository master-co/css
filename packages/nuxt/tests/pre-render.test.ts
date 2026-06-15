import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'
import { MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID } from 'shared/master-css-runtime-manifest'
import { setupNuxtTest } from './setup-test'

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
    expect(html).not.toContain(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`)
    const css = await $fetch(href) as string
    expect(css).toContain('.box')
    expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
    expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
})
