import { describe, expect, it } from 'vitest'
import path from 'node:path'
import masterCSS from '../../src'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/pre-render/master-css-entry')

async function resolveConfigHooks(plugins: any[], config: any) {
    for (const plugin of plugins) {
        if (typeof plugin.configResolved === 'function') {
            await plugin.configResolved.call({}, config)
        }
    }
}

describe('PreRenderPlugin', () => {
    it('renders HTML classes with the default master.css config entry', async () => {
        const plugins = masterCSS({
            mode: 'pre-render',
            injectNormalCSS: false,
        })
        const viteConfig = {
            root: FIXTURE_DIR,
            plugins,
            server: {
                fs: {
                    allow: [],
                },
            },
        }

        await resolveConfigHooks(plugins, viteConfig)

        const preRenderPlugin = plugins.find((plugin) => plugin.name === 'master-css:pre-render')
        expect(preRenderPlugin).toBeDefined()
        const result = await (preRenderPlugin as any).transformIndexHtml.call(
            {},
            '<html><head></head><body><section class="card p:2">Content</section></body></html>',
        )
        const html = typeof result === 'string' ? result : result.html

        expect(viteConfig.server.fs.allow).toContain(path.join(FIXTURE_DIR, 'master.css'))
        expect(html).toContain('<style id="master">')
        expect(html).toContain('@layer components{.card{background-color:rgb(17 34 51)}')
        expect(html).toContain('@media (width>=48rem){.card{font-size:1.125rem}}')
        expect(html).toContain('.card{border-color:#456}')
        expect(html).toContain('@layer utilities{.p\\:2{padding:0.125rem}}')
    })
})
