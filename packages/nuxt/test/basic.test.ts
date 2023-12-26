import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'

describe('ssr', async () => {
    await setup({
        rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url))
    })

    it('renders the index page', async () => {
        const html = await $fetch('/')
        expect(html).toContain('<style id="master">.center-content,.box{justify-content:center;align-items:center}.flex,.box{display:flex}.b\\:1\\|solid\\|slate-90,.box{border:0.0625rem solid rgb(236 237 241)}.r\\:6,.box,.box-perspective-pink{border-radius:0.375rem}.p\\:15\\|20,.box{padding:0.9375rem 1.25rem}.bg\\:white,.box{background-color:rgb(255 255 255)}.fg\\:major,.box{color:major}.font\\:14,.box{font-size:0.875rem}.text\\:center,.box{text-align:center}.dark .b\\:white\\/\\.05\\@dark,.dark .box{border-color:rgb(255 255 255/.05)}.dark .bg\\:gray-30\\@dark,.dark .box{background-color:rgb(62 61 64)}</style>')
    })
})
