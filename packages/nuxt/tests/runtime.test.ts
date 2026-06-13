import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'
import { dirname, resolve } from 'node:path'
import { MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID } from 'shared/master-css-runtime-manifest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/runtime/')

await setup({ rootDir })

it('does not pre-render style#master in runtime mode', async () => {
    const html = await $fetch('/') as string
    expect(html).toContain('class="box"')
    expect(html).not.toContain('style id="master"')
    expect(html).not.toContain(MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID)
})
