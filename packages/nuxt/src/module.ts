import { defineNuxtModule, addServerPlugin, createResolver } from '@nuxt/kit'
import exploreConfig from 'explore-config'
import { name } from '../package.json'

export default defineNuxtModule<{ config?: string }>({
    meta: {
        name,
        configKey: 'mastercss'
    },
    setup(options, nuxt) {
        const { resolve } = createResolver(import.meta.url)

        nuxt.hook('nitro:config', (config) => {
            config.virtual = config.virtual || {}
            config.virtual['#master-css-config'] = `export default ${JSON.stringify(exploreConfig(options.config ?? 'master.css.*', { cwd: nuxt.options.srcDir }))}`
        })

        addServerPlugin(resolve('./runtime/plugin'))
    }
})
