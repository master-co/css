import { render } from '@master/css-server'
import type { NitroApp } from 'nitropack'
import exploreConfig from 'explore-config'
// @ts-ignore
import pluginOptions from '#master-css-nuxt-plugin-options'
// @ts-ignore
import nuxtOptions from '#nuxt-options'

export default ((nitro: NitroApp) => {
    // @ts-ignore
    const config = exploreConfig['default'](pluginOptions.config ?? 'master.css.*', { cwd: nuxtOptions.srcDir })
    nitro.hooks.hook('render:response', async (response) => {
        if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
            const { html } = render(response.body, config)
            response.body = html
        }
    })
})

