import { defineNuxtModule, addServerPlugin, createResolver, addPlugin, setGlobalHead } from '@nuxt/kit'
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { pathToFileURL } from 'node:url'
import { name } from '../package.json'
import { createMasterCSSVitePlugin } from '@master/css-vite'
import { VIRTUAL_MANIFEST_ID } from '@master/css-internal/manifest-module'
import {
  EMPTY_EMITTED_GLOBALS_MODULE,
  VIRTUAL_EMITTED_GLOBALS_ID
} from '@master/css-internal/emitted-globals-module'
import {
  toBrowserManifestFacadeModule,
  toInlineManifestModule
} from '@master/css-internal/manifest-facade'
import { toHashedManifestAssetFileName } from '@master/css-internal/node'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-internal/project'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { ModuleNode, Plugin } from 'vite'
import {
  resolveMasterCSSNuxtModuleOptions,
  type MasterCSSNuxtModuleOptions
} from './options'
import { externalizeNitroPrerenderHydrationManifest } from './external-hydration-manifest'

const MASTER_CSS_MANIFEST_ASSET_BASE = '/_master-css/manifest/'

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

function externalizeNitroServerRenderer(config: {
  noExternals?: boolean
  externals?: {
    external?: (string | RegExp | ((id: string) => boolean))[]
  }
}) {
  config.noExternals = false
  config.externals ??= {}
  config.externals.external ??= []
  for (const packageName of ['@master/css-server', '@master/css-backend']) {
    if (!config.externals.external.includes(packageName)) {
      config.externals.external.push(packageName)
    }
  }
}

function normalizeFilePath(file: string) {
  try {
    return realpathSync.native(file).replace(/\\/g, '/')
  } catch {
    return resolvePath(file).replace(/\\/g, '/')
  }
}

function includesFile(dependencies: string[], file: string) {
  const normalizedFile = normalizeFilePath(file)
  return dependencies.some((dependency) => normalizeFilePath(dependency) === normalizedFile)
}

function toManifestPublicAssetBase(baseURL = '/') {
  return `${baseURL.replace(/\/?$/, '/')}_master-css/manifest/`
}

function toManifestAssetURL(fileName: string, base = MASTER_CSS_MANIFEST_ASSET_BASE) {
  return `${base.replace(/\/?$/, '/')}${fileName}`
}

function toManifestPreloadHeadLink(href: string) {
  return {
    rel: 'modulepreload',
    as: 'json',
    crossorigin: '',
    href
  }
}

function toNodeManifestReadFileModule(urlExpression: string) {
  return [
    `import { readFile } from 'node:fs/promises';`,
    `import { fileURLToPath } from 'node:url';`,
    ``,
    `const masterCSSManifestURL = ${urlExpression};`,
    `const masterCSSManifestFile = fileURLToPath(new URL(masterCSSManifestURL, import.meta.url));`,
    `export default JSON.parse(await readFile(masterCSSManifestFile, 'utf8'));`,
    ``
  ].join('\n')
}

function invalidateManifestModule(module: ModuleNode | undefined, server: { moduleGraph: { invalidateModule(module: ModuleNode): void } }) {
  if (!module) return []
  server.moduleGraph.invalidateModule(module)
  return [module]
}

function RuntimeVirtualModulesPlugin(publicManifestHref: string, projectDir: string): Plugin {
  const resolvedManifestId = `\0${VIRTUAL_MANIFEST_ID}`
  const resolvedEmittedGlobalsId = `\0${VIRTUAL_EMITTED_GLOBALS_ID}`
  let command: string | undefined
  let cssManifestDependencies: string[] = []
  const loadInlineManifest = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
    const entries = await discoverManifestEntries({ root: projectDir })
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStylesheetDependenciesSync(entry, undefined, { projectDir })) {
        dependencies.add(dependency)
      }
    }
    cssManifestDependencies = [...dependencies]
    for (const dependency of cssManifestDependencies) {
      pluginContext?.addWatchFile?.(dependency)
    }
    const result = await loadProjectManifest({
      root: projectDir,
      entries,
      baseManifest: defaultBuildManifest
    })
    for (const dependency of result.dependencies) {
      if (dependencies.has(dependency)) continue
      dependencies.add(dependency)
      pluginContext?.addWatchFile?.(dependency)
    }
    cssManifestDependencies = [...dependencies]
    return serializeMasterCSSManifest(result.manifest)
  }
  return {
    name: 'master-css:nuxt-runtime-manifest',
    enforce: 'pre',
    configResolved(config) {
      command = config.command
    },
    resolveId(id) {
      if (id === VIRTUAL_MANIFEST_ID) return resolvedManifestId
      if (id === VIRTUAL_EMITTED_GLOBALS_ID) return resolvedEmittedGlobalsId
    },
    async load(id) {
      if (id === resolvedEmittedGlobalsId) return EMPTY_EMITTED_GLOBALS_MODULE
      if (id === resolvedManifestId) {
        if (command === 'serve') {
          return toInlineManifestModule(await loadInlineManifest(this))
        }
        return toBrowserManifestFacadeModule(JSON.stringify(publicManifestHref))
      }
    },
    handleHotUpdate({ file, server }) {
      if (command !== 'serve' || !includesFile(cssManifestDependencies, file)) return
      const module = server.moduleGraph.getModuleById(resolvedManifestId)
      return invalidateManifestModule(module, server)
    }
  }
}

export const masterCSSNuxtModule = defineNuxtModule<MasterCSSNuxtModuleOptions>({
  meta: {
    name,
    configKey: 'mastercss'
  },
  async setup(specifiedOptions: MasterCSSNuxtModuleOptions, nuxt) {
    const options = resolveMasterCSSNuxtModuleOptions(specifiedOptions)
    if (!options.enabled) return
    if (!nuxt.options.ssr || nuxt.options._prepare) return
    const { resolve } = createResolver(import.meta.url)
    const manifestEntries = await discoverManifestEntries({ root: nuxt.options.rootDir })
    let manifestDependencies = [...new Set(manifestEntries.flatMap((entry) =>
      collectStylesheetDependenciesSync(entry, undefined, {
        projectDir: nuxt.options.rootDir
      })
    ))]
    nuxt.hook('nitro:config', async (config) => {
      addNitroWatchDependencies(config, manifestDependencies)
    })
    const manifestResult = await loadProjectManifest({
      root: nuxt.options.rootDir,
      entries: manifestEntries,
      baseManifest: defaultBuildManifest
    })
    manifestDependencies = [...new Set([
      ...manifestDependencies,
      ...manifestResult.dependencies
    ])]
    const manifestJSON = serializeMasterCSSManifest(manifestResult.manifest)
    const manifestFileName = toHashedManifestAssetFileName(manifestJSON)
    const manifestDir = resolvePath(nuxt.options.rootDir, 'node_modules', '.master-css', 'manifest')
    const manifestAssetPath = resolvePath(manifestDir, manifestFileName)
    const publicManifestHref = toManifestAssetURL(
      manifestFileName,
      toManifestPublicAssetBase(nuxt.options.app.baseURL)
    )
    const ensureManifestAsset = () => {
      mkdirSync(dirname(manifestAssetPath), { recursive: true })
      writeFileSync(manifestAssetPath, manifestJSON)
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
      addNitroWatchDependencies(config, manifestDependencies)
      ensureManifestAsset()
      config.virtual ??= {}
      config.virtual[VIRTUAL_MANIFEST_ID] = toNodeManifestReadFileModule(
        `new URL(${JSON.stringify(pathToFileURL(manifestAssetPath).href)})`
      )
      if (options.mode === 'runtime' && options.injectRuntime) {
        addNitroPublicAsset(config, manifestDir, MASTER_CSS_MANIFEST_ASSET_BASE)
      }
    })
    const addCSSVitePlugin = (
      viteOptions: Pick<MasterCSSNuxtModuleOptions, 'enabled' | 'mode'> = {
        mode: options.mode
      }
    ) => {
      nuxt.hook('vite:extendConfig', (viteConfig) => {
        viteConfig.plugins = viteConfig.plugins || []
        if (
          (options.mode === 'runtime' || options.mode === 'progressive')
          && options.injectRuntime
          && viteOptions.enabled === false
        ) {
          viteConfig.plugins.push(RuntimeVirtualModulesPlugin(publicManifestHref, nuxt.options.rootDir))
        }
        viteConfig.plugins.push(createMasterCSSVitePlugin({
          enabled: viteOptions.enabled,
          mode: viteOptions.mode,
          scanner: options.scanner,
          runtime: options.runtime
        }) as unknown as Plugin)
      })
    }
    switch (options.mode) {
      case 'progressive':
      case 'runtime':
        addCSSVitePlugin({ enabled: false })
        if (options.injectRuntime) {
          addPlugin({
            mode: 'client',
            src: resolve('./runtime/css-runtime')
          }, {
            append: true
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
        nuxt.hook('nitro:config', (config) => {
          externalizeNitroServerRenderer(config)
        })
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

export default masterCSSNuxtModule
