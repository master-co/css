import { defineNuxtModule, addServerPlugin, createResolver, addPlugin } from '@nuxt/kit'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { pathToFileURL } from 'node:url'
import { name } from '../package.json'
import masterCSS from '@master/css.vue/vite'
import { VIRTUAL_PLAN_ID } from '@master/css-integration/plan-module'
import { toNodePlanFacadeModule } from '@master/css-integration/plan-facade'
import { toHashedPlanAssetFileName } from '@master/css-integration/node'
import { loadProjectPlanJSON } from '@master/css-plan/load'
import type { Plugin } from 'vite'
import defaultOptions, { type ModuleOptions } from './options'

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
        nuxt.hook('nitro:config', async (config) => {
            const result = await loadProjectPlanJSON(nuxt.options.rootDir)
            addNitroWatchDependencies(config, result.dependencies)
            const planAssetPath = resolvePath(
                nuxt.options.rootDir,
                'node_modules/.master-css',
                toHashedPlanAssetFileName(result.json)
            )
            mkdirSync(dirname(planAssetPath), { recursive: true })
            writeFileSync(planAssetPath, result.json)
            config.virtual ??= {}
            config.virtual[VIRTUAL_PLAN_ID] = toNodePlanFacadeModule(
                `new URL(${JSON.stringify(pathToFileURL(planAssetPath).href)})`
            )
        })
        const addCSSVitePlugin = (mode = options.mode) => {
            nuxt.hook('vite:extendConfig', (viteConfig) => {
                viteConfig.plugins = viteConfig.plugins || []
                viteConfig.plugins.push(masterCSS({ ...options, mode }) as unknown as Plugin)
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
            case 'static':
                // Fix: [plugin ssr-styles] Cannot inline generated static CSS during SSR.
                if (nuxt.options.features?.inlineStyles)
                    nuxt.options.features.inlineStyles = false
                addCSSVitePlugin()
                break
        }

        switch (options.mode) {
            case 'pre-render':
            case 'progressive':
                // Fix: Package import specifier "virtual:master-css-plan" is not defined in package
                nuxt.options.build.transpile.push(resolve('./runtime/css-server'))
                addServerPlugin(resolve('./runtime/css-server'))
                break
        }
    }
})
