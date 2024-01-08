import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'

describe('ssr', async () => {
    await setup({
        rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url))
    })

    it('renders the index page', async () => {
        const html = await $fetch('/')
        expect(html).toContain('<style id="master">.flex,.box{display:flex}.font\\:1em,.box{font-size:1em}</style>')
    })
})
