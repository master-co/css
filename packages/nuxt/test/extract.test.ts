/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/extract/')

await setup({ rootDir })

it('should contain stylesheet link and CSS with specific class', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/)
    expect(match).toBeTruthy()
    const href = match?.[1]
    expect(href).toMatch(/\/_nuxt\/.*\.css/)
    const css = await $fetch(href!) as string
    expect(typeof css).toBe('string')
    expect(css).toContain('.box')
    expect(css).toContain(`@layer base,theme,preset,components,general;@layer components{.box{display:flex}.box{font-size:1em}}`)
})
