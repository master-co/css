import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'

const rootDir = fileURLToPath(new URL('./fixtures/progressive', import.meta.url))

await setup({ rootDir })

it('ensure style#master', async () => {
    const html = await $fetch('/') as string
    const match = html.match(/<style id="master"><\/style>/)
    expect(match?.[1] ?? '').toMatchSnapshot(rootDir)
})