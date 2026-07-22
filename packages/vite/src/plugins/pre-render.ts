import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { createServerRenderer } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { loadProjectManifest } from '@master/css-project/manifest'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import { PluginOptions } from '../options'
import { toHashedManifestAssetFileName } from '@master/css-integration/node'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
} from '@master/css-schema/hydration-manifest'
import { collectStyleCSSDependencies } from '@master/css-stylesheet'
import { includesFile } from '../utils/path'

const HYDRATION_MANIFEST_ASSET_DIR = '_master-css/hydration'

export default function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
  let cssManifest: MasterCSSManifest | undefined = undefined
  let cssManifestDependencies: string[] = []
  let enabled = true
  let renderer: ReturnType<typeof createServerRenderer> | undefined
  const hydrationManifestAssets = new Map<string, string>()
  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }
  const loadCSSManifest = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
    const root = context.config?.root
    const entries = await findCSSManifestEntryFiles(root)
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStyleCSSDependencies(entry, undefined, root)) {
        dependencies.add(dependency)
      }
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(cssManifestDependencies)
    for (const dependency of cssManifestDependencies) {
      pluginContext?.addWatchFile?.(dependency)
    }
    const result = await loadProjectManifest(root, { entries })
    cssManifest = result.manifest
    const nextRenderer = createServerRenderer(cssManifest, {
      maxCachedClasses: context.config?.command === 'build' ? Infinity : undefined
    })
    renderer?.dispose()
    renderer = nextRenderer
    for (const dependency of result.dependencies) {
      if (dependencies.has(dependency)) continue
      dependencies.add(dependency)
      pluginContext?.addWatchFile?.(dependency)
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(cssManifestDependencies)
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
  const renderHTML = (html: string) => renderer?.render(html, {
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
      if (!enabled || !includesFile(cssManifestDependencies, file)) return
      await loadCSSManifest()
    },
    configureServer(server) {
      server.httpServer?.once('close', () => renderer?.dispose())
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
      if (!cssManifest || !renderer) return
      const rendered = renderHTML(html)
      if (!rendered) return
      try {
        return {
          html: rendered.html,
          tags: [],
        }
      } finally {
        rendered.css?.dispose()
      }
    },
    transform(code, id) {
      if (!enabled) return
      if (id.endsWith('.html')) {
        if (!cssManifest || !renderer) return null
        const rendered = renderHTML(code)
        if (!rendered) return null
        try {
          return {
            code: rendered.html,
            map: null,
          }
        } finally {
          rendered.css?.dispose()
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
    buildEnd(error) {
      if (error && context.config?.command === 'build') renderer?.dispose()
    },
    closeBundle() {
      if (context.config?.command === 'build') renderer?.dispose()
    }
  }
}
