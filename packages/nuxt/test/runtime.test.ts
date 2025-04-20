import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/runtime/')

await setup({ rootDir })

it('ensure style#master', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<style id="master"><\/style>/)
    expect(match?.[1] ?? '').toMatchSnapshot(rootDir)
})