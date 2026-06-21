import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { render } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css'
import { loadProjectManifest } from '@master/css-manifest/load'
import { PluginOptions } from '../options'

export default function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
    let cssManifest: MasterCSSManifest | undefined = undefined
    let cssManifestDependencies: string[] = []
    let enabled = true
    const addServerAllow = (paths: string[]) => {
        const allow = context.config?.server.fs.allow
        if (!allow) return
        for (const path of paths) {
            if (!allow.includes(path)) allow.push(path)
        }
    }
    const loadCSSManifest = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
        const result = await loadProjectManifest(context.config?.root)
        cssManifest = result.manifest
        cssManifestDependencies = result.dependencies
        addServerAllow(cssManifestDependencies)
        for (const dependency of cssManifestDependencies) {
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
            await loadCSSManifest()
        },
        async buildStart() {
            if (!enabled) return
            await loadCSSManifest(this)
        },
        async handleHotUpdate({ file }) {
            if (!enabled || !cssManifestDependencies.includes(file)) return
            await loadCSSManifest()
        },
        transformIndexHtml(html) {
            if (!enabled) return
            if (!cssManifest) return
            const rendered = render(html, cssManifest, { hydrationManifest: 'inject' })
            return {
                html: rendered.html,
                tags: [],
            }
        },
        transform(code, id) {
            if (!enabled) return
            if (id.endsWith('.html')) {
                if (!cssManifest) return null
                const rendered = render(code, cssManifest, { hydrationManifest: 'inject' })
                return {
                    code: rendered.html,
                    map: null,
                }
            }
            return null
        },
    }
}
