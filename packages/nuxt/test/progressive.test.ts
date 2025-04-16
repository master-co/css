import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'

const rootDir = fileURLToPath(new URL('./fixtures/progressive', import.meta.url))

await setup({ rootDir })

it('matches generated CSS snapshot', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<style id="master">([\s\S]*?)<\/style>/)
    expect(match?.[1] ?? '').toMatchSnapshot(rootDir)
})