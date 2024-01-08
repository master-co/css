import { render } from '@master/css-server'
import type { NitroApp } from 'nitropack'
// @ts-ignore
import config from '#master-css-config'

export default ((nitro: NitroApp) => {
    nitro.hooks.hook('render:response', async (response) => {
        if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
            const { html } = render(response.body, config)
            response.body = html
        }
    })
})

