import { defineNuxtModule, addServerPlugin, createResolver } from '@nuxt/kit'
import { name } from '../package.json'
import log from '@techor/log'
import { relative } from 'path'
import fg from 'fast-glob'

export default defineNuxtModule<{ config?: string }>({
    meta: {
        name,
        configKey: 'mastercss'
    },
    setup({ config }, nuxt) {
        if (!nuxt.options.ssr || nuxt.options._prepare) return
        const { resolve } = createResolver(import.meta.url)
        const configFilePattern = resolve(nuxt.options.srcDir, config ?? 'master.css.*')
        const foundConfigFile = fg.sync(configFilePattern)[0]
        nuxt.hook('nitro:config', (config) => {
            if (foundConfigFile) {
                log.ok`**${relative(nuxt.options.srcDir, foundConfigFile)}** config file found`
                config.alias ??= {}
                config.alias['#master-css-config'] = foundConfigFile
            } else {
                log.i`No **${relative(nuxt.options.srcDir, configFilePattern)}** config file found`
                // prevent nuxt from complaining about missing virtual module
                config.virtual ??= {}
                config.virtual['#master-css-config'] = `export default {}`
            }
        })
        addServerPlugin(resolve('./runtime/css-server'))
    }
})
