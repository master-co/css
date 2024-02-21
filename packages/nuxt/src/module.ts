import { defineNuxtModule, addServerPlugin, createResolver } from '@nuxt/kit'
import { name } from '../package.json'
import log from '@techor/log'
import { relative } from 'path'
import { existsSync } from 'fs'

export default defineNuxtModule<{ config?: string }>({
    meta: {
        name,
        configKey: 'mastercss'
    },
    setup(options = {}, nuxt) {
        if (!options.config) options.config = 'master.css'
        if (!nuxt.options.ssr || nuxt.options._prepare) return
        const { resolve } = createResolver(import.meta.url)
        // try to find the config file with the given name and options.extensions
        let foundConfigPath: string | undefined
        for (const eachExtension of ['js', 'mjs', 'ts', 'cjs', 'cts', 'mts']) {
            const eachBasename = options.config + '.' + eachExtension
            const eachPath = resolve(nuxt.options.srcDir, eachBasename)
            if (existsSync(eachPath)) {
                foundConfigPath = eachPath
                break
            }
        }
        nuxt.hook('nitro:config', (config) => {
            if (foundConfigPath) {
                log.ok`**${relative(nuxt.options.srcDir, foundConfigPath)}** config file found`
                config.alias ??= {}
                config.alias['#master-css-config'] = foundConfigPath
            } else {
                log.i`No **${relative(nuxt.options.srcDir, options.config || '')}** config file found`
                // prevent nuxt from complaining about missing virtual module
                config.virtual ??= {}
                config.virtual['#master-css-config'] = `export default {}`
            }
        })
        // Fix: Package import specifier "#master-css-config" is not defined in package
        nuxt.options.build.transpile.push(resolve('./runtime/css-server'))
        addServerPlugin(resolve('./runtime/css-server'))
    }
})
