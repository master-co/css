import { compileProjectManifestSync } from '@master/css-compiler/project/sync'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  defaultBuildManifest,
  isManifestStylesheetRequest
} from '@master/css-internal/project'
import { stripMasterCSSManifestQuery } from '@master/css-internal/manifest-module'
import {
  toInlineManifestModule
} from '@master/css-internal/manifest-facade'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { collectStylesheetEmittedGlobals } from '@master/css-compiler/stylesheet'
import { toEmittedGlobalsModule } from '@master/css-internal/emitted-globals-module'

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  addDependency?: (file: string) => void
  async?: () => (error: Error | null, result?: string) => void
  getOptions?: () => MasterCSSManifestLoaderOptions
}

interface MasterCSSManifestLoaderOptions {
  virtual?: boolean
  module?: boolean
  emittedGlobals?: boolean
}

const manifestHost = {
  discoverManifestEntries,
  loadProjectManifest,
  collectStylesheetDependencies(entry: string, options: { root?: string }) {
    return collectStylesheetDependenciesSync(entry, undefined, {
      projectDir: options.root
    })
  }
}

function toLoaderResult(json: string, options: MasterCSSManifestLoaderOptions) {
  return options.module ? toInlineManifestModule(json) : json
}

async function loadVirtualManifestJSON(context: LoaderContext) {
  const projectDir = context.rootContext || process.cwd()
  const result = await loadMasterCSSVirtualManifest({
    host: manifestHost,
    root: projectDir,
    onDependency(dependency) {
      context.addDependency?.(dependency)
    }
  })
  return serializeMasterCSSManifest(result.manifest)
}

async function loadVirtualEmittedGlobalsModule(context: LoaderContext) {
  const projectDir = context.rootContext || process.cwd()
  const dependencies = new Set<string>()
  const addDependency = (dependency: string) => {
    if (dependencies.has(dependency)) return
    dependencies.add(dependency)
    context.addDependency?.(dependency)
  }
  const result = await loadMasterCSSVirtualManifest({
    host: manifestHost,
    root: projectDir,
    onDependency: addDependency
  })
  const emittedGlobals = await collectStylesheetEmittedGlobals([...result.entries], {
    baseManifest: result.manifest,
    projectDir
  })
  for (const dependency of emittedGlobals.dependencies) addDependency(dependency)
  return toEmittedGlobalsModule(emittedGlobals.emittedGlobals)
}

function loadCSSManifestJSON(context: LoaderContext) {
  const resourcePath = stripMasterCSSManifestQuery(context.resourcePath)
  if (!isManifestStylesheetRequest(resourcePath)) {
    throw new TypeError('Master CSS manifest queries only support CSS entry files.')
  }
  const dependencies = new Set(collectStylesheetDependenciesSync(resourcePath, undefined, {
    projectDir: context.rootContext
  }))
  for (const dependency of dependencies) {
    context.addDependency?.(dependency)
  }
  const result = compileProjectManifestSync({
    root: context.rootContext,
    entries: [resourcePath],
    baseManifest: defaultBuildManifest
  })
  for (const dependency of result.dependencies) {
    if (dependencies.has(dependency)) continue
    context.addDependency?.(dependency)
  }
  return serializeMasterCSSManifest(result.manifest)
}

export default function masterCSSManifestLoader(this: LoaderContext) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css-next] CSS manifest loader requires an async loader context.')
  }
  const options = this.getOptions?.() || {}
  if (options.emittedGlobals) {
    loadVirtualEmittedGlobalsModule(this)
      .then((source) => callback(null, source))
      .catch((error: Error) => callback(error))
    return
  }
  const result = options.virtual
    ? loadVirtualManifestJSON(this)
    : Promise.resolve(loadCSSManifestJSON(this))
  result
    .then((json) => callback(null, toLoaderResult(json, options)))
    .catch((error: Error) => callback(error))
}
