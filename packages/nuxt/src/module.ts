import { defineNuxtModule, addServerPlugin, createResolver, addPlugin } from '@nuxt/kit'
import { name } from '../package.json'
import masterCSS, { VIRTUAL_CONFIG_ID } from '@master/css.vite'
import { vueAdapter } from '@master/css.vue/adapter'
import { loadProjectConfigModule } from '@master/css-configer/load'
import type { Plugin } from 'vite'
import defaultOptions, { type ModuleOptions } from './options'

function withVueAdapter(options: ModuleOptions): ModuleOptions {
    return {
        ...options,
        extractor: {
            ...options.extractor,
            adapters: [
                ...(options.extractor?.adapters || []),
                vueAdapter()
            ]
        }
    }
}

function addNitroWatchDependencies(config: { devServer?: { watch?: string[] } }, dependencies: string[]) {
    if (!dependencies.length) return
    config.devServer ??= {}
    config.devServer.watch ??= []
    for (const dependency of dependencies) {
        if (!config.devServer.watch.includes(dependency)) {
            config.devServer.watch.push(dependency)
        }
    }
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name,
        configKey: 'mastercss'
    },
    setup(options: ModuleOptions, nuxt) {
        options = { ...defaultOptions, ...options }
        if (!nuxt.options.ssr || nuxt.options._prepare) return
        const { resolve } = createResolver(import.meta.url)
        const viteOptions = withVueAdapter(options)
        nuxt.hook('nitro:config', async (config) => {
            const result = await loadProjectConfigModule(nuxt.options.rootDir, {
                config: options.config
            })
            addNitroWatchDependencies(config, result.dependencies)
            config.virtual ??= {}
            config.virtual[VIRTUAL_CONFIG_ID] = result.code
        })
        const addCSSVitePlugin = (mode = options.mode) => {
            nuxt.hook('vite:extendConfig', (viteConfig) => {
                viteConfig.plugins = viteConfig.plugins || []
                viteConfig.plugins.push(masterCSS({ ...viteOptions, mode }) as unknown as Plugin)
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
                // Fix: [plugin ssr-styles] Cannot inline generated extraction CSS during SSR.
                if (nuxt.options.features?.inlineStyles)
                    nuxt.options.features.inlineStyles = false
                addCSSVitePlugin()
                break
        }

        switch (options.mode) {
            case 'pre-render':
            case 'progressive':
                // Fix: Package import specifier "virtual:master-css-config" is not defined in package
                nuxt.options.build.transpile.push(resolve('./runtime/css-server'))
                addServerPlugin(resolve('./runtime/css-server'))
                break
        }
    }
})
