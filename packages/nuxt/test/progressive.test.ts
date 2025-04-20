import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/progressive/')

await setup({ rootDir })

it('matches generated CSS snapshot', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<style id="master">([\s\S]*?)<\/style>/)
    expect(match?.[1] ?? '').toBe('@layer base,theme,preset,components,general;@layer components{.box{display:flex;font-size:1em}}')
})