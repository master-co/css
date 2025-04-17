import { defineNuxtModule, addServerPlugin, createResolver, addPlugin } from '@nuxt/kit'
import { name } from '../package.json'
import masterCSS, { defaultPluginOptions, VIRTUAL_CONFIG_ID, type PluginOptions } from '@master/css.vite'
import ensureCSSConfigPath from '../../../shared/utils/ensure-css-config-path'

declare type ModuleOptions = {

} & PluginOptions

const defaultModuleOptions: ModuleOptions = {
    ...defaultPluginOptions,
    mode: 'progressive'
}

export default defineNuxtModule<{ config?: string }>({
    meta: {
        name,
        configKey: 'mastercss'
    },
    setup(options: ModuleOptions, nuxt) {
        options = { ...defaultModuleOptions, ...options }
        if (!nuxt.options.ssr || nuxt.options._prepare) return
        const { resolve } = createResolver(import.meta.url)
        const configPath = ensureCSSConfigPath(options.config, nuxt.options.rootDir)
        nuxt.hook('nitro:config', (config) => {
            if (configPath) {
                config.alias ??= {}
                config.alias[VIRTUAL_CONFIG_ID] = configPath
            } else {
                config.virtual ??= {}
                config.virtual[VIRTUAL_CONFIG_ID] = `export default {}`
            }
        })
        const addCSSVitePlugin = (mode = options.mode) => {
            nuxt.hook('vite:extendConfig', (viteConfig) => {
                viteConfig.plugins = viteConfig.plugins || []
                viteConfig.plugins.push(masterCSS({ ...options, mode }))
            })
        }
        switch (options.mode) {
            case 'progressive':
            case 'runtime':
                addCSSVitePlugin(null)
                addPlugin({
                    mode: 'client',
                    src: resolve('./runtime/css-runtime')
                })
                break
            case 'extract':
                // Fix: [plugin ssr-styles] Cannot extract styles for virtual:master.css. Its styles will not be inlined when server-rendering.
                if (nuxt.options.features?.inlineStyles)
                    nuxt.options.features.inlineStyles = false
                addCSSVitePlugin()
                break
        }

        switch (options.mode) {
            case 'progressive':
                // Fix: Package import specifier "virtual:master-css-config" is not defined in package
                nuxt.options.build.transpile.push(resolve('./runtime/css-server'))
                addServerPlugin(resolve('./runtime/css-server'))
                break
        }
    }
})
