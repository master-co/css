import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'
import { setupNuxtTest } from './setup-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/static/')

setupNuxtTest({ rootDir })

it('should contain stylesheet link and CSS with specific class', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/)
    expect(match).toBeTruthy()
    if (!match) throw new Error('Expected a stylesheet link in Nuxt static HTML.')
    const href = match[1]
    if (!href) throw new Error('Expected Nuxt static stylesheet link to include an href.')
    expect(href).toMatch(/\/_nuxt\/.*\.css/)
    const css = await $fetch(href) as string
    expect(typeof css).toBe('string')
    expect(css).toContain('.box')
    expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
    expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
})
