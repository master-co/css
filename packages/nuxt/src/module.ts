import { defineNuxtModule, addServerPlugin, createResolver } from '@nuxt/kit'
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
            config.virtual['#master-css-nuxt-plugin-options'] = `export default ${JSON.stringify(options)}`
            config.virtual['#nuxt-options'] = `export default { srcDir: '${nuxt.options.srcDir}' }`
        })

        addServerPlugin(resolve('./runtime/plugin'))
    }
})
