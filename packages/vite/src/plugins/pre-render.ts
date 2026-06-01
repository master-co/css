import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { render } from '@master/css-server'
import type { Config } from 'shared/css-config'
import { loadConfig } from '@master/css-configer/load'
import { PluginOptions } from '../options'

export default function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
    let cssConfig: Config | undefined = undefined
    let cssConfigDependencies: string[] = []
    let enabled = true
    const loadCSSConfig = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
        if (!context.configPath) {
            cssConfig = undefined
            cssConfigDependencies = []
            return
        }
        const result = await loadConfig(context.configPath)
        cssConfig = result.config
        cssConfigDependencies = result.dependencies
        for (const dependency of cssConfigDependencies) {
            pluginContext?.addWatchFile?.(dependency)
        }
    }
    return {
        name: 'master-css:pre-render',
        enforce: 'pre',
        async configResolved(config) {
            const isSvelte = config.plugins.some(p => p.name?.startsWith('vite-plugin-svelte'))
            if (isSvelte) {
                enabled = false
                if (process.env.DEBUG) {
                    console.log('[@master/css.vite] SvelteKit detected, skipping pre-render plugin')
                }
                return
            }
            await loadCSSConfig()
        },
        async buildStart() {
            if (!enabled) return
            await loadCSSConfig(this)
        },
        async handleHotUpdate({ file }) {
            if (!enabled || !cssConfigDependencies.includes(file)) return
            await loadCSSConfig()
        },
        transformIndexHtml(html) {
            if (!enabled) return
            return {
                html: render(html, cssConfig).html,
                tags: [],
            }
        },
        transform(code, id) {
            if (!enabled) return
            if (id.endsWith('.html')) {
                const { html } = render(code, cssConfig)
                return {
                    code: html,
                    map: null,
                }
            }
            return null
        },
    }
}
