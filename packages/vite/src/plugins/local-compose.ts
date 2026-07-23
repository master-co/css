import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-build-internal/project'
import {
  collectStylesheetEmittedGlobals,
  transformStylesheet
} from '@master/css-compiler/stylesheet'
import {
  collectStylesheetDependenciesSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { includesFile } from '../utils/path'

function invalidateModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
  if (!module) return false
  server.moduleGraph.invalidateModule(module)
  return true
}

export default function LocalComposePlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let projectManifest: Awaited<ReturnType<typeof loadProjectManifest>> | undefined
  let projectManifestEntries: string[] = []
  let projectManifestDependencies: string[] = []
  let styleEntryEmittedGlobals: Awaited<ReturnType<typeof collectStylesheetEmittedGlobals>> | undefined
  const localComposeModules = new Set<string>()

  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }

  const loadComposeContext = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    if (projectManifest) return projectManifest
    const root = context.config?.root
    const entries = await discoverManifestEntries({ root })
    projectManifestEntries = [...entries]
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStylesheetDependenciesSync(entry, undefined, { projectDir: root })) {
        dependencies.add(dependency)
      }
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(projectManifestDependencies)
    for (const dependency of projectManifestDependencies) {
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifest = await loadProjectManifest({
      root,
      entries,
      baseManifest: defaultBuildManifest
    })
    for (const dependency of projectManifest.dependencies) {
      if (dependencies.has(dependency)) continue
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(projectManifestDependencies)
    return projectManifest
  }

  const loadStyleEntryEmittedGlobals = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    const manifestResult = await loadComposeContext(pluginContext)
    if (styleEntryEmittedGlobals) return styleEntryEmittedGlobals
    const dependencies = new Set(projectManifestDependencies)
    styleEntryEmittedGlobals = await collectStylesheetEmittedGlobals(projectManifestEntries, {
      baseManifest: manifestResult.manifest,
      projectDir: context.config?.root
    })
    for (const dependency of styleEntryEmittedGlobals.dependencies) {
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(projectManifestDependencies)
    return styleEntryEmittedGlobals
  }

  return {
    name: 'master-css:local-compose',
    enforce: 'pre',
    async buildStart() {
      projectManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
      styleEntryEmittedGlobals = undefined
    },
    async transform(code, id) {
      if (id.startsWith('\0')) return
      const resolution = resolveStylesheetSync(id, code, {
        projectDir: context.config?.root
      })
      if (resolution?.kind !== 'local') return

      const dependencies = new Set(resolution.dependencies)
      for (const dependency of dependencies) {
        this.addWatchFile?.(dependency)
      }
      const manifestResult = await loadComposeContext(this)
      const emittedGlobalsResult = await loadStyleEntryEmittedGlobals(this)
      const result = await transformStylesheet(id, code, {
        baseManifest: manifestResult.manifest,
        projectDir: context.config?.root,
        emittedGlobals: emittedGlobalsResult.emittedGlobals
      })
      if (!result.transformed) return
      localComposeModules.add(id)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        this.addWatchFile?.(dependency)
      }
      return {
        code: result.code,
        map: null
      }
    },
    async handleHotUpdate({ file, server }) {
      if (!includesFile(projectManifestDependencies, file)) return
      projectManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
      styleEntryEmittedGlobals = undefined
      let handled = false
      for (const moduleId of localComposeModules) {
        const module = server.moduleGraph.getModuleById(moduleId)
        handled ||= Boolean(module)
        invalidateModule(module, server)
        if (module) await server.reloadModule(module)
      }
      if (handled) return []
    }
  }
}
