import type { Config } from '@master/css'
import { render } from '@master/css-server'
import type { NitroAppPlugin, RenderResponse } from 'nitropack'

export default function createCSSServerPlugin(options?: { config: Config }) {
    return <NitroAppPlugin>async function (nitro) {
        nitro.hooks.hook('render:response', async (response: RenderResponse) => {
            if (typeof response.body === 'string' && (response.headers['Content-Type'] || response.headers['content-type'])?.includes('html')) {
                const { html } = render(response.body, options?.config)
                response.body = html
            }
        })
    }
}