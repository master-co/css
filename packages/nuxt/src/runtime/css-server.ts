import { render } from '@master/css-server'
import type { NitroApp } from 'nitropack'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'

export default ((nitro: NitroApp) => {
    nitro.hooks.hook('render:response', async (response) => {
        if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
            const { html } = render(response.body, manifest, { hydrationManifest: 'inject' })
            response.body = html
        }
    })
})
