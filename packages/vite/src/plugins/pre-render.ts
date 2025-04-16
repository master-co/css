import type { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'
import { render } from '@master/css-server'
import { Config } from '@master/css'
import exploreConfig from '@master/css-explore-config'

export default function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
    let cssConfig: Config | undefined = undefined
    let enabled = true
    return {
        name: 'master-css:pre-render',
        enforce: 'pre',
        configResolved(config) {
            const isSvelte = config.plugins.some(p => p.name?.startsWith('vite-plugin-svelte'))
            if (isSvelte) {
                enabled = false
                if (process.env.DEBUG) {
                    console.log('[@master/css.vite] SvelteKit detected, skipping pre-render plugin')
                }
                return
            }
            if (context.configPath)
                cssConfig = exploreConfig({ name: context.configPath, cwd: config.root })
        },
        transformIndexHtml(html) {
            if (!enabled) return
            return {
                html: render(html, cssConfig).html,
                tags: [],
            }
        }
    }
}
