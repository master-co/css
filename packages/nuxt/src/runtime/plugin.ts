import { render } from '@master/css-server'
import type { NitroApp } from 'nitropack'
import exploreConfig from 'explore-config'
// @ts-expect-error virtual module
import pluginOptions from '#master-css-nuxt-plugin-options'
// @ts-expect-error virtual module
import nuxtOptions from '#nuxt-options'

export default ((nitro: NitroApp) => {
    const config = exploreConfig(pluginOptions.config ?? 'master.css.*', { cwd: nuxtOptions.srcDir })
    nitro.hooks.hook('render:response', async (response) => {
        if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
            const { html } = render(response.body, config)
            response.body = html
        }
    })
})

