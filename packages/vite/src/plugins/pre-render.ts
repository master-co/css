import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { render } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css'
import { loadProjectManifest } from '@master/css-project/manifest'
import { PluginOptions } from '../options'
import { toHashedManifestAssetFileName } from '@master/css-integration/node'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
    MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
} from '@master/css-schema/hydration-manifest'

const HYDRATION_MANIFEST_ASSET_DIR = '_master-css/hydration'

export default function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
    let cssManifest: MasterCSSManifest | undefined = undefined
    let cssManifestDependencies: string[] = []
    let enabled = true
    const hydrationManifestAssets = new Map<string, string>()
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
    const toBuildHydrationManifestAssetFileName = (fileName: string) => {
        const assetsDir = context.config?.build.assetsDir || 'assets'
        return `${assetsDir.replace(/\/$/, '')}/${HYDRATION_MANIFEST_ASSET_DIR}/${fileName}`
    }
    const toBuildPublicURL = (fileName: string) => {
        const assetFileName = toBuildHydrationManifestAssetFileName(fileName)
        const base = context.config?.base ?? '/'
        if (!base || base === './') return `${base}${assetFileName}`
        return `${base.replace(/\/?$/, '/')}${assetFileName}`
    }
    const addHydrationManifestAsset = (json: string) => {
        const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
        hydrationManifestAssets.set(fileName, json)
        return context.config?.command === 'build'
            ? toBuildPublicURL(fileName)
            : `${MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE}${fileName}`
    }
    const renderHTML = (html: string) => render(html, cssManifest, {
        hydrationManifest: {
            type: 'external',
            src: addHydrationManifestAsset
        }
    })
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
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                const requestURL = request.url ? new URL(request.url, 'http://localhost') : undefined
                if (!requestURL?.pathname.startsWith(MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE)) {
                    next()
                    return
                }
                const fileName = decodeURIComponent(requestURL.pathname.slice(MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE.length))
                const source = hydrationManifestAssets.get(fileName)
                if (source === undefined) {
                    next()
                    return
                }
                response.statusCode = 200
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.end(source)
            })
        },
        transformIndexHtml(html) {
            if (!enabled) return
            if (!cssManifest) return
            const rendered = renderHTML(html)
            return {
                html: rendered.html,
                tags: [],
            }
        },
        transform(code, id) {
            if (!enabled) return
            if (id.endsWith('.html')) {
                if (!cssManifest) return null
                const rendered = renderHTML(code)
                return {
                    code: rendered.html,
                    map: null,
                }
            }
            return null
        },
        generateBundle() {
            if (!enabled) return
            for (const [fileName, source] of hydrationManifestAssets) {
                this.emitFile({
                    type: 'asset',
                    fileName: toBuildHydrationManifestAssetFileName(fileName),
                    source
                })
            }
        },
    }
}
