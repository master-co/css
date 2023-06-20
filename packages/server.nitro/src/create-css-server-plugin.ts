import { Config, renderHTML } from '@master/css'
import type { NitroAppPlugin, RenderResponse } from 'nitropack'

export function createCSSServerPlugin(options?: { config: Config }) {
    return <NitroAppPlugin>async function (nitro) {
        nitro.hooks.hook('render:response', async (response: RenderResponse) => {
            if (typeof response.body === 'string' && (response.headers['Content-Type'] || response.headers['content-type'])?.includes('html')) {
                response.body = renderHTML(response.body, options?.config)
            }
        })
    }
}