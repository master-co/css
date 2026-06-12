import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { render } from '@master/css-server'
import type { MasterCSSPlan } from '@master/css'
import { loadProjectPlan } from '@master/css-configer/load'
import { PluginOptions } from '../options'

export default function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
    let cssPlan: MasterCSSPlan | undefined = undefined
    let cssPlanDependencies: string[] = []
    let enabled = true
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const loadCSSPlan = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
        const result = await loadProjectPlan(context.config?.root)
        cssPlan = result.plan
        cssPlanDependencies = result.dependencies
        addServerAllow(cssPlanDependencies)
        for (const dependency of cssPlanDependencies) {
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
            await loadCSSPlan()
        },
        async buildStart() {
            if (!enabled) return
            await loadCSSPlan(this)
        },
        async handleHotUpdate({ file }) {
            if (!enabled || !cssPlanDependencies.includes(file)) return
            await loadCSSPlan()
        },
        transformIndexHtml(html) {
            if (!enabled) return
            return {
                html: render(html, cssPlan!).html,
                tags: [],
            }
        },
        transform(code, id) {
            if (!enabled) return
            if (id.endsWith('.html')) {
                const { html } = render(code, cssPlan!)
                return {
                    code: html,
                    map: null,
                }
            }
            return null
        },
    }
}
