import type { AstroIntegration } from 'astro'
import type { ModuleNode, Plugin } from 'vite'
import {
  createMasterCSSVitePlugin,
  type MasterCSSVitePluginOptions
} from '@master/css-vite'
import {
  resolveMasterCSSAstroIntegrationOptions,
  type MasterCSSAstroIntegrationOptions,
  type ResolvedMasterCSSAstroIntegrationOptions
} from './options'
import { externalizeAstroHydrationManifests } from './external-hydration-manifest'
import { preloadAstroRuntimeAssets } from './runtime-preload'
import {
  createMasterCSSManifestVirtualModulePlugin
} from '@master/css-internal/manifest-virtual-module'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { collectStylesheetEmittedGlobals } from '@master/css-compiler/stylesheet'
import {
  createMasterCSSRuntimeBootstrapSource,
  MASTER_CSS_RUNTIME_BOOTSTRAP_ID,
  RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
} from '@master/css-internal/runtime-bootstrap'
import {
  toEmittedGlobalsModule,
  VIRTUAL_EMITTED_GLOBALS_ID
} from '@master/css-internal/emitted-globals-module'

export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css-astro/middleware'
export const ASTRO_SSR_EXTERNAL = ['@master/css-server']
export const ASTRO_RUNTIME_INJECTION = 'import "virtual:master-css-runtime";'

const manifestHost = {
  discoverManifestEntries,
  loadProjectManifest,
  collectStylesheetDependencies(entry: string, options: { root?: string }) {
    return collectStylesheetDependenciesSync(entry, undefined, {
      projectDir: options.root
    })
  }
}

function createManifestVirtualModulePlugin() {
  return createMasterCSSManifestVirtualModulePlugin(
    (options) => loadMasterCSSVirtualManifest({
      ...options,
      host: manifestHost
    })
  )
}

function createRuntimeBootstrapPlugin() {
  return {
    name: 'master-css:astro-runtime-bootstrap',
    resolveId(id: string) {
      if (id === MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
      }
    },
    load(id: string) {
      if (id === RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return createMasterCSSRuntimeBootstrapSource()
      }
    }
  }
}

function createEmittedGlobalsVirtualModulePlugin(): Plugin {
  const resolvedId = `\0${VIRTUAL_EMITTED_GLOBALS_ID}`
  let projectDir: string | undefined
  let dependencies: readonly string[] = []
  const loadEmittedGlobals = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
    const manifestResult = await loadMasterCSSVirtualManifest({
      host: manifestHost,
      root: projectDir,
      onDependency: (dependency) => pluginContext?.addWatchFile?.(dependency)
    })
    const emittedGlobalsResult = await collectStylesheetEmittedGlobals([...manifestResult.entries], {
      baseManifest: manifestResult.manifest,
      projectDir
    })
    dependencies = [...new Set([
      ...manifestResult.dependencies,
      ...emittedGlobalsResult.dependencies
    ])]
    for (const dependency of emittedGlobalsResult.dependencies) {
      pluginContext?.addWatchFile?.(dependency)
    }
    return toEmittedGlobalsModule(emittedGlobalsResult.emittedGlobals)
  }
  return {
    name: 'master-css:astro-emitted-globals',
    enforce: 'pre',
    configResolved(config) {
      projectDir = config.root
    },
    resolveId(id) {
      if (id === VIRTUAL_EMITTED_GLOBALS_ID) return resolvedId
    },
    async load(id) {
      if (id === resolvedId) return loadEmittedGlobals(this)
    },
    handleHotUpdate({ file, server }) {
      if (!dependencies.includes(file)) return
      const module = server.moduleGraph.getModuleById(resolvedId) as ModuleNode | undefined
      if (!module) return []
      server.moduleGraph.invalidateModule(module)
      return [module]
    }
  }
}

function getViteOptions(
  options: ResolvedMasterCSSAstroIntegrationOptions
): MasterCSSVitePluginOptions {
  switch (options.mode) {
    case 'pre-render':
    case 'progressive':
      return {
        ...options,
        enabled: false
      }
    case 'runtime':
      return {
        ...options,
        runtime: false
      }
    default:
      return options
  }
}

export function createMasterCSSAstroIntegration(
  specifiedOptions: MasterCSSAstroIntegrationOptions = {}
): AstroIntegration {
  const options = resolveMasterCSSAstroIntegrationOptions(specifiedOptions)
  if (!options.enabled) {
    return {
      name: '@master/css-astro',
      hooks: {}
    }
  }
  let astroBase: string | undefined
  let buildOutput: 'static' | 'server' | undefined
  return {
    name: '@master/css-astro',
    hooks: {
      'astro:config:setup': async ({ addMiddleware, injectScript, updateConfig }) => {
        switch (options.mode) {
          case 'progressive':
          case 'runtime':
            if (options.injectRuntime) {
              injectScript('page', ASTRO_RUNTIME_INJECTION)
            }
            break
        }
        switch (options.mode) {
          case 'pre-render':
          case 'progressive':
            addMiddleware({
              order: 'pre',
              entrypoint: ASTRO_MIDDLEWARE_ENTRYPOINT
            })
            break
        }
        updateConfig({
          vite: {
            plugins: [
              createMasterCSSVitePlugin(getViteOptions(options)) as never,
              ...(
                options.mode === 'pre-render' || options.mode === 'progressive'
                  ? [
                    createManifestVirtualModulePlugin() as never,
                    createEmittedGlobalsVirtualModulePlugin() as never
                  ]
                  : []
              ),
              ...(options.injectRuntime ? [createRuntimeBootstrapPlugin()] : [])
            ],
            ssr: {
              external: ASTRO_SSR_EXTERNAL
            },
            build: {
              rollupOptions: {
                external: ASTRO_SSR_EXTERNAL
              }
            }
          }
        })
      },
      'astro:config:done': async ({ config, buildOutput: output }) => {
        astroBase = config.base
        buildOutput = output
      },
      'astro:build:done': async ({ dir }) => {
        if (options.mode === 'runtime' && options.injectRuntime && buildOutput !== 'server') {
          await preloadAstroRuntimeAssets(dir, astroBase)
        }
        switch (options.mode) {
          case 'pre-render':
          case 'progressive':
            await externalizeAstroHydrationManifests(dir, astroBase)
            break
        }
      }
    },
  }
}

export default createMasterCSSAstroIntegration
