import type { Plugin, ViteDevServer } from 'vite'
import { relative } from 'node:path'
import { MasterCSSVitePluginContext } from '../core'
import { createServerRenderer } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { ResolvedMasterCSSVitePluginOptions } from '../options'
import { toHashedManifestAssetFileName } from '@master/css-internal/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
} from '@master/css-schema/hydration-manifest'
import { collectStylesheetEmittedGlobals } from '@master/css-compiler/stylesheet'
import { includesFile } from '../utils/path'
import { toAssetHref } from '../utils/html'
import { createManifestRecovery } from '../utils/manifest-recovery'
import type { DependencyHost } from '../utils/failed-stylesheet-dependencies'

const HYDRATION_MANIFEST_ASSET_DIR = '_master-css/hydration'

export default function PreRenderPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let cssManifest: MasterCSSManifest | undefined = undefined
  let cssManifestDependencies: string[] = []
  let manifestSignature: string | undefined
  let enabled = true
  let renderer: ReturnType<typeof createServerRenderer> | undefined
  let devServer: ViteDevServer | undefined
  const hydrationManifestAssets = new Map<string, string>()
  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }
  const recovery = createManifestRecovery(context, '\0master-css:pre-render-manifest', async (onDependency, _host, active) => {
    try {
      const root = context.config?.root
      const entries = await discoverManifestEntries({ root })
      const dependencies = new Set<string>()
      const addDependency = (file: string) => {
        if (dependencies.has(file)) return
        dependencies.add(file)
        if (active()) {
          cssManifestDependencies = [...dependencies]
          addServerAllow([file])
        }
        onDependency(file)
      }
      const result = await loadProjectManifest({
        root,
        entries,
        baseManifest: defaultBuildManifest,
        onDependency: addDependency
      })
      const emittedGlobalsResult = await collectStylesheetEmittedGlobals([...entries], {
        baseManifest: result.manifest,
        projectDir: root
      })
      const nextSignature = JSON.stringify([result.manifest, emittedGlobalsResult.emittedGlobals])
      const changed = manifestSignature !== undefined && manifestSignature !== nextSignature
      const nextRenderer = createServerRenderer({
        manifest: result.manifest,
        emittedGlobals: emittedGlobalsResult.emittedGlobals,
        maxCachedClasses: context.config?.command === 'build' ? Infinity : undefined
      })
      if (active()) {
        manifestSignature = nextSignature
        cssManifest = result.manifest
        renderer?.dispose()
        renderer = nextRenderer
      } else nextRenderer.dispose()
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        dependencies.add(dependency)
        onDependency(dependency)
      }
      for (const dependency of emittedGlobalsResult.dependencies) {
        if (dependencies.has(dependency)) continue
        dependencies.add(dependency)
        onDependency(dependency)
      }
      if (active()) {
        cssManifestDependencies = [...dependencies]
        addServerAllow(cssManifestDependencies)
      }
      return changed
    } catch (error) {
      if (active()) {
        renderer?.dispose()
        renderer = undefined
        cssManifest = undefined
      }
      throw error
    }
  })
  const loadCSSManifest = (host: DependencyHost = { environment: devServer?.environments.client }) => recovery.run(host)
  const toBuildHydrationManifestAssetFileName = (fileName: string) => {
    const assetsDir = context.config?.build.assetsDir ?? 'assets'
    return [assetsDir.replace(/\/$/, ''), HYDRATION_MANIFEST_ASSET_DIR, fileName].filter(Boolean).join('/')
  }
  const addHydrationManifestAsset = (json: string, htmlPath?: string) => {
    const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
    hydrationManifestAssets.set(fileName, json)
    return context.config?.command === 'build'
      ? toAssetHref(toBuildHydrationManifestAssetFileName(fileName), context.config?.base, htmlPath)
      : `${MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE}${fileName}`
  }
  const renderHTML = (html: string, htmlPath?: string) => renderer?.renderHTML(html, {
    hydrationManifest: {
      type: 'external',
      source: json => addHydrationManifestAsset(json, htmlPath)
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
          console.log('[@master/css-vite] SvelteKit detected, skipping pre-render plugin')
        }
        return
      }
      // Watch failures must occur in buildStart, where dependencies can be watched.
      if (config.command === 'build' && config.build?.watch) return
      try { await loadCSSManifest() } catch (error) {
        if (config.command !== 'serve') throw error
      }
    },
    async buildStart() {
      if (!enabled) return
      try { await loadCSSManifest(this) } catch (error) {
        if (context.config?.command !== 'serve') throw error
      }
    },
    async handleHotUpdate({ file, server }) {
      if (!enabled || !includesFile(cssManifestDependencies, file)) return
      const environment = devServer?.environments.client
      const wasFailed = recovery.failed
      try {
        const changed = await loadCSSManifest({ environment })
        if (!recovery.isActive(environment)) return
        if (wasFailed || (changed && options.mode === 'pre-render')) server.ws.send({ type: 'full-reload' })
      } catch (error) {
        if (recovery.isActive(environment)) throw error
      }
    },
    configureServer(server) {
      devServer = server
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
    transformIndexHtml(html, htmlContext) {
      if (!enabled) return
      recovery.assertReady()
      if (!cssManifest || !renderer) return
      const rendered = renderHTML(html, htmlContext?.path)
      if (!rendered) return
      return {
        html: rendered.html,
        tags: [],
      }
    },
    transform(code, id) {
      if (!enabled) return
      if (id.endsWith('.html')) {
        recovery.assertReady()
        if (!cssManifest || !renderer) return null
        const htmlPath = context.config?.root ? relative(context.config.root, id).replace(/\\/g, '/') : undefined
        const rendered = renderHTML(code, htmlPath)
        if (!rendered) return null
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
    buildEnd(error) {
      if (error && context.config?.command === 'build') renderer?.dispose()
    },
    closeBundle() {
      if (!context.config?.build?.watch && this.environment) recovery.close(this.environment)
      if (context.config?.command === 'build') renderer?.dispose()
    },
    closeWatcher() {
      if (this.environment) recovery.close(this.environment)
      renderer?.dispose()
    }
  }
}
