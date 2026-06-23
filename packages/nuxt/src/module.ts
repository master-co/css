import { defineNuxtModule, addServerPlugin, createResolver, addPlugin, setGlobalHead } from '@nuxt/kit'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { pathToFileURL } from 'node:url'
import { name } from '../package.json'
import masterCSS from '@master/css.vue/vite'
import { VIRTUAL_MANIFEST_ID } from '@master/css-integration/manifest-module'
import {
    toBrowserManifestFacadeModule,
    toNodeManifestFacadeModule
} from '@master/css-integration/manifest-facade'
import { toHashedManifestAssetFileName } from '@master/css-integration/node'
import { loadProjectManifestJSON } from '@master/css-project/manifest'
import type { Plugin } from 'vite'
import defaultOptions, { type ModuleOptions } from './options'

const MASTER_CSS_RUNTIME_STYLE_ID = 'master-css'
const MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE = '/_master-css/hydration/'
const MASTER_CSS_HYDRATION_MANIFEST_ATTR = 'data-master-css-hydration-manifest'
const MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME = 'master-css-hydration'
const MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID = 'master-css-hydration-manifest'
const MASTER_CSS_MANIFEST_ASSET_BASE = '/_master-css/manifest/'

interface NitroPrerenderRoute {
    contents?: string
    contentType?: string
    fileName?: string
}

interface NitroPrerenderContext {
    options: {
        baseURL?: string
        output: {
            publicDir: string
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

function addNitroPublicAsset(config: { publicAssets?: { dir: string, baseURL: string }[] }, dir: string, baseURL: string) {
    config.publicAssets ??= []
    if (config.publicAssets.some((asset) => asset.dir === dir && asset.baseURL === baseURL)) return
    config.publicAssets.push({ dir, baseURL })
}

function isHTMLPrerenderRoute(route: NitroPrerenderRoute) {
    return route.contentType?.includes('html') || route.fileName?.endsWith('.html')
}

function isMasterCSSRenderedHTML(html: string) {
    return new RegExp(String.raw`<style\b(?=[^>]*\bid=(["'])${MASTER_CSS_RUNTIME_STYLE_ID}\1)`, 'i').test(html)
}

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeAttributeValue(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
}

function createHydrationManifestScriptPattern(flags: string) {
    return new RegExp(
        String.raw`<script\b(?=[^>]*\bid=(["'])${escapeRegExp(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)}\1)[^>]*>([\s\S]*?)<\/script>`,
        flags
    )
}

function getInlineMasterCSSHydrationManifestJSON(html: string) {
    return html.match(createHydrationManifestScriptPattern('i'))?.[2]?.trim()
}

function externalizeMasterCSSHydrationManifest(html: string, source: string) {
    const stylePattern = new RegExp(
        String.raw`<style\b(?=[^>]*\bid=(["'])${escapeRegExp(MASTER_CSS_RUNTIME_STYLE_ID)}\1)[^>]*>`,
        'i'
    )
    const attributePattern = new RegExp(String.raw`\s${escapeRegExp(MASTER_CSS_HYDRATION_MANIFEST_ATTR)}(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?`, 'i')
    return html
        .replace(createHydrationManifestScriptPattern('gi'), '')
        .replace(stylePattern, (openingTag) => openingTag
            .replace(attributePattern, '')
            .replace(/>$/, ` ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${escapeAttributeValue(source)}">`))
}

function toPublicAssetBase(baseURL = '/') {
    return `${baseURL.replace(/\/?$/, '/')}_master-css/hydration/`
}

function toManifestPublicAssetBase(baseURL = '/') {
    return `${baseURL.replace(/\/?$/, '/')}_master-css/manifest/`
}

function toHydrationManifestAssetURL(fileName: string, base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE) {
    return `${base.replace(/\/?$/, '/')}${fileName}`
}

function toManifestAssetURL(fileName: string, base = MASTER_CSS_MANIFEST_ASSET_BASE) {
    return `${base.replace(/\/?$/, '/')}${fileName}`
}

function toManifestPreloadHeadLink(href: string) {
    return {
        rel: 'preload',
        as: 'fetch',
        type: 'application/json',
        crossorigin: '',
        href
    }
}

function RuntimeManifestVirtualModulePlugin(publicManifestHref: string): Plugin {
    const resolvedManifestId = `\0${VIRTUAL_MANIFEST_ID}`
    return {
        name: 'master-css:nuxt-runtime-manifest',
        enforce: 'pre',
        resolveId(id) {
            if (id === VIRTUAL_MANIFEST_ID) return resolvedManifestId
        },
        load(id) {
            if (id === resolvedManifestId) {
                return toBrowserManifestFacadeModule(JSON.stringify(publicManifestHref))
            }
        }
    }
}

export function externalizeNitroPrerenderHydrationManifest(route: NitroPrerenderRoute, nitro: NitroPrerenderContext) {
    if (!route.contents || !isHTMLPrerenderRoute(route) || !isMasterCSSRenderedHTML(route.contents)) return
    const json = getInlineMasterCSSHydrationManifestJSON(route.contents)
    if (!json) return
    try {
        JSON.parse(json)
    } catch {
        return
    }
    const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
    const filePath = resolvePath(nitro.options.output.publicDir, '_master-css', 'hydration', fileName)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, json)
    route.contents = externalizeMasterCSSHydrationManifest(
        route.contents,
        toHydrationManifestAssetURL(fileName, toPublicAssetBase(nitro.options.baseURL))
    )
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name,
        configKey: 'mastercss'
    },
    async setup(options: ModuleOptions, nuxt) {
        options = { ...defaultOptions, ...options }
        if (!nuxt.options.ssr || nuxt.options._prepare) return
        const { resolve } = createResolver(import.meta.url)
        const manifestResult = await loadProjectManifestJSON(nuxt.options.rootDir)
        const manifestFileName = toHashedManifestAssetFileName(manifestResult.json)
        const manifestDir = resolvePath(nuxt.options.rootDir, 'node_modules', '.master-css', 'manifest')
        const manifestAssetPath = resolvePath(manifestDir, manifestFileName)
        const publicManifestHref = toManifestAssetURL(
            manifestFileName,
            toManifestPublicAssetBase(nuxt.options.app.baseURL)
        )
        const ensureManifestAsset = () => {
            mkdirSync(dirname(manifestAssetPath), { recursive: true })
            writeFileSync(manifestAssetPath, manifestResult.json)
        }
        ensureManifestAsset()
        if (options.mode === 'runtime' && options.injectRuntime) {
            setGlobalHead({
                link: [
                    toManifestPreloadHeadLink(publicManifestHref)
                ]
            })
        }
        nuxt.hook('nitro:config', async (config) => {
            addNitroWatchDependencies(config, manifestResult.dependencies)
            ensureManifestAsset()
            config.virtual ??= {}
            config.virtual[VIRTUAL_MANIFEST_ID] = toNodeManifestFacadeModule(
                `new URL(${JSON.stringify(pathToFileURL(manifestAssetPath).href)})`
            )
            if (options.mode === 'runtime' && options.injectRuntime) {
                addNitroPublicAsset(config, manifestDir, MASTER_CSS_MANIFEST_ASSET_BASE)
            }
        })
        const addCSSVitePlugin = (mode = options.mode) => {
            nuxt.hook('vite:extendConfig', (viteConfig) => {
                viteConfig.plugins = viteConfig.plugins || []
                if (options.mode === 'runtime' && options.injectRuntime && mode === null) {
                    viteConfig.plugins.push(RuntimeManifestVirtualModulePlugin(publicManifestHref))
                }
                viteConfig.plugins.push(masterCSS({ ...options, mode }) as unknown as Plugin)
            })
        }
        switch (options.mode) {
            case 'progressive':
            case 'runtime':
                addCSSVitePlugin(null)
                if (options.injectRuntime) {
                    addPlugin({
                        mode: 'client',
                        src: resolve('./runtime/css-runtime')
                    })
                }
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
                // Fix: Package import specifier "virtual:master-css-manifest" is not defined in package
                nuxt.options.build.transpile.push(resolve('./runtime/css-server'))
                addServerPlugin(resolve('./runtime/css-server'))
                nuxt.hook('nitro:init', (nitro) => {
                    nitro.hooks.hook('prerender:generate', (route) => {
                        externalizeNitroPrerenderHydrationManifest(route, nitro)
                    })
                })
                break
        }
    }
})
