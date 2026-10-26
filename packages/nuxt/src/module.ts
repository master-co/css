import { defineNuxtModule, addServerPlugin, createResolver, addPlugin, setGlobalHead } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { pathToFileURL } from 'node:url'
import { name } from '../package.json'
import { createMasterCSSVitePlugin } from '@master/css-vite'
import {
  VIRTUAL_MANIFEST_ID,
  toProductionManifestJSON
} from '@master/css-internal/manifest-module'
import {
  RESOLVED_VIRTUAL_PROGRAM_ID,
  VIRTUAL_PROGRAM_ID,
  toBrowserProgramFacadeModule,
  toInlineProgramModule,
  toProgramPreloadLinkAttrs
} from '@master/css-internal/program-module'
import { compileRuntimeProgram } from '@master/css/node'
import {
  toEmittedGlobalsModule,
  VIRTUAL_EMITTED_GLOBALS_ID
} from '@master/css-internal/emitted-globals-module'
import { toHashedManifestAssetFileName, toHashedProgramAssetFileName } from '@master/css-internal/node'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { collectStylesheetEmittedGlobals } from '@master/css-compiler/stylesheet'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { ModuleNode, Plugin } from 'vite'
import {
  resolveMasterCSSNuxtModuleOptions,
  type MasterCSSNuxtModuleOptions
} from './options'
import { registerNitroPrerenderHydrationManifest } from './external-hydration-manifest'

const MASTER_CSS_PROGRAM_ASSET_BASE = '/_master-css/program/'

const manifestHost = {
  discoverManifestEntries,
  loadProjectManifest,
  collectStylesheetDependencies(entry: string, options: { root?: string }) {
    return collectStylesheetDependenciesSync(entry, undefined, {
      projectDir: options.root
    })
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

function externalizeNitroServerRenderer(config: {
  noExternals?: boolean
  externals?: {
    external?: (string | RegExp | ((id: string) => boolean))[]
  }
}) {
  config.noExternals = false
  config.externals ??= {}
  config.externals.external ??= []
  for (const packageName of ['@master/css-server', '@master/css-binding']) {
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

function toProgramPublicAssetBase(baseURL = '/') {
  return `${baseURL.replace(/\/?$/, '/')}_master-css/program/`
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

function invalidateModule(module: ModuleNode | undefined, server: { moduleGraph: { invalidateModule(module: ModuleNode): void } }) {
  if (!module) return []
  server.moduleGraph.invalidateModule(module)
  return [module]
}

/** Client runtime inputs: the program, inline in development and a public asset in builds, and emitted globals. */
function RuntimeVirtualModulesPlugin(publicProgramHref: string, projectDir: string): Plugin {
  const resolvedEmittedGlobalsId = `\0${VIRTUAL_EMITTED_GLOBALS_ID}`
  let command: string | undefined
  let cssManifestDependencies: string[] = []
  const loadInlineProgram = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
    const dependencies = new Set<string>()
    const result = await loadMasterCSSVirtualManifest({
      host: manifestHost,
      root: projectDir,
      onDependency(dependency) {
        dependencies.add(dependency)
        cssManifestDependencies = [...dependencies]
        pluginContext?.addWatchFile?.(dependency)
      }
    })
    cssManifestDependencies = [...result.dependencies]
    return toInlineProgramModule(await compileRuntimeProgram(result.manifest))
  }
  const loadEmittedGlobals = async (pluginContext?: { addWatchFile?: (id: string) => void }) => {
    const dependencies = new Set<string>()
    const manifestResult = await loadMasterCSSVirtualManifest({
      host: manifestHost,
      root: projectDir,
      onDependency(dependency) {
        dependencies.add(dependency)
        cssManifestDependencies = [...dependencies]
        pluginContext?.addWatchFile?.(dependency)
      }
    })
    const emittedGlobalsResult = await collectStylesheetEmittedGlobals([...manifestResult.entries], {
      baseManifest: manifestResult.manifest,
      projectDir
    })
    for (const dependency of emittedGlobalsResult.dependencies) {
      dependencies.add(dependency)
      pluginContext?.addWatchFile?.(dependency)
    }
    cssManifestDependencies = [...dependencies]
    return toEmittedGlobalsModule(emittedGlobalsResult.emittedGlobals)
  }
  return {
    name: 'master-css:nuxt-runtime-inputs',
    enforce: 'pre',
    configResolved(config) {
      command = config.command
    },
    resolveId(id) {
      if (id === VIRTUAL_PROGRAM_ID) return RESOLVED_VIRTUAL_PROGRAM_ID
      if (id === VIRTUAL_EMITTED_GLOBALS_ID) return resolvedEmittedGlobalsId
    },
    async load(id) {
      if (id === resolvedEmittedGlobalsId) return loadEmittedGlobals(this)
      if (id === RESOLVED_VIRTUAL_PROGRAM_ID) {
        if (command === 'serve') return loadInlineProgram(this)
        return toBrowserProgramFacadeModule(JSON.stringify(publicProgramHref))
      }
    },
    handleHotUpdate({ file, server }) {
      if (command !== 'serve' || !includesFile(cssManifestDependencies, file)) return
      return [
        ...invalidateModule(
          server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_PROGRAM_ID),
          server
        ),
        ...invalidateModule(
          server.moduleGraph.getModuleById(resolvedEmittedGlobalsId),
          server
        )
      ]
    }
  }
}

export const masterCSSNuxtModule: NuxtModule<MasterCSSNuxtModuleOptions> = defineNuxtModule<MasterCSSNuxtModuleOptions>({
  meta: {
    name,
    configKey: 'mastercss'
  },
  async setup(specifiedOptions: MasterCSSNuxtModuleOptions, nuxt) {
    const options = resolveMasterCSSNuxtModuleOptions(specifiedOptions)
    if (!options.enabled) return
    if (!nuxt.options.ssr || nuxt.options._prepare) return
    const { resolve } = createResolver(import.meta.url)
    const manifestResult = await loadMasterCSSVirtualManifest({
      host: manifestHost,
      root: nuxt.options.rootDir
    })
    const emittedGlobalsResult = await collectStylesheetEmittedGlobals([...manifestResult.entries], {
      baseManifest: manifestResult.manifest,
      projectDir: nuxt.options.rootDir
    })
    const manifestDependencies = [...new Set([
      ...manifestResult.dependencies,
      ...emittedGlobalsResult.dependencies
    ])]
    const emittedGlobalsModule = toEmittedGlobalsModule(emittedGlobalsResult.emittedGlobals)
    // Nitro renders from this manifest file and the client runtime executes the
    // program compiled from it, so both run the same project.
    const manifestJSON = nuxt.options.dev
      ? serializeMasterCSSManifest(manifestResult.manifest)
      : toProductionManifestJSON(manifestResult.manifest)
    const manifestFileName = toHashedManifestAssetFileName(manifestJSON)
    const manifestAssetPath = resolvePath(nuxt.options.rootDir, 'node_modules', '.master-css', 'manifest', manifestFileName)
    const hasClientRuntime = (options.mode === 'runtime' || options.mode === 'progressive') && options.injectRuntime
    const program = hasClientRuntime ? await compileRuntimeProgram(JSON.parse(manifestJSON)) : undefined
    const programFileName = program ? toHashedProgramAssetFileName(program) : ''
    const programDir = resolvePath(nuxt.options.rootDir, 'node_modules', '.master-css', 'program')
    const publicProgramHref = `${toProgramPublicAssetBase(nuxt.options.app.baseURL)}${programFileName}`
    const ensureRuntimeAssets = () => {
      mkdirSync(dirname(manifestAssetPath), { recursive: true })
      writeFileSync(manifestAssetPath, manifestJSON)
      if (!program) return
      mkdirSync(programDir, { recursive: true })
      writeFileSync(resolvePath(programDir, programFileName), program)
    }
    ensureRuntimeAssets()
    if (options.mode === 'runtime' && options.injectRuntime) {
      setGlobalHead({
        link: [
          toProgramPreloadLinkAttrs(publicProgramHref)
        ]
      })
    }
    nuxt.hook('nitro:config', async (config) => {
      addNitroWatchDependencies(config, manifestDependencies)
      ensureRuntimeAssets()
      config.virtual ??= {}
      config.virtual[VIRTUAL_MANIFEST_ID] = toNodeManifestReadFileModule(
        `new URL(${JSON.stringify(pathToFileURL(manifestAssetPath).href)})`
      )
      config.virtual[VIRTUAL_EMITTED_GLOBALS_ID] = emittedGlobalsModule
      config.virtual['virtual:master-css-nuxt-hydration'] = `export default ${options.mode === 'progressive'}`
      if (hasClientRuntime) {
        addNitroPublicAsset(config, programDir, MASTER_CSS_PROGRAM_ASSET_BASE)
      }
    })
    const addCSSVitePlugin = () => {
      nuxt.hook('vite:extendConfig', (viteConfig) => {
        viteConfig.plugins = viteConfig.plugins || []
        if (hasClientRuntime) {
          viteConfig.plugins.push(RuntimeVirtualModulesPlugin(publicProgramHref, nuxt.options.rootDir))
        }
        viteConfig.plugins.push(createMasterCSSVitePlugin({
          // Nuxt owns client startup and Nitro rendering; Vite still compiles CSS.
          mode: options.mode,
          scanner: options.scanner,
          pruneNativeCSS: options.pruneNativeCSS,
          runtime: options.runtime
        }).filter(plugin => !['master-css:pre-render', 'master-css:inject-runtime', 'master-css:inject-runtime:serve', 'master-css:runtime-preload', 'master-css:program-preload'].includes(plugin.name)) as unknown as Plugin)
      })
    }
    switch (options.mode) {
      case 'progressive':
      case 'runtime':
        addCSSVitePlugin()
        if (options.injectRuntime) {
          addPlugin({
            mode: 'client',
            src: resolve(options.mode === 'progressive' ? './runtime/css-runtime-progressive' : './runtime/css-runtime')
          }, {
            append: true
          })
        }
        break
      case 'pre-render':
        addCSSVitePlugin()
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
          if (options.mode === 'progressive') registerNitroPrerenderHydrationManifest(nitro)
        })
        break
    }
  }
})

export default masterCSSNuxtModule
