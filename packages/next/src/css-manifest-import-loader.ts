import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { compileProjectManifestSync } from '@master/css-compiler/project/sync'
import {
  isMasterCSSManifestRequest,
  stripMasterCSSManifestQuery,
  toProductionManifestJSON
} from '@master/css-internal/manifest-module'
import {
  ensureVirtualModulePackageJSONPath,
  toVirtualCSSManifestModulePath,
  toVirtualCSSProgramModulePath
} from '@master/css-internal/node'
import { toInlineManifestModule } from '@master/css-internal/manifest-facade'
import {
  isMasterCSSProgramRequest,
  stripMasterCSSProgramQuery
} from '@master/css-internal/program-module'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import {
  defaultBuildManifest,
  isManifestStylesheetRequest
} from '@master/css-internal/project'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { toRuntimeProgramModule } from './runtime-program'

const MASTER_CSS_MANIFEST_IMPORT_PATTERN = /(\bimport\s+(?:[^'"]*?\s+from\s*)?|\bexport\s+[^'"]*?\s+from\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  mode?: string
  addDependency?: (file: string) => void
  cacheable?: (cacheable: boolean) => void
  async?: () => (error: Error | null, content?: string) => void
  getOptions?: () => {
    projectDir?: string
  }
  resolve?: (context: string, request: string, callback: (error: Error | null, result?: string) => void) => void
}

function toModuleSpecifier(from: string, to: string) {
  const specifier = relative(dirname(from), to).replace(/\\/g, '/')
  return specifier.startsWith('../') ? specifier : `./${specifier}`
}

function resolveRequest(context: LoaderContext, request: string) {
  return new Promise<string>((resolveRequest, reject) => {
    if (context.resolve) {
      context.resolve(dirname(context.resourcePath), request, (error, result) => {
        if (error) {
          reject(error)
          return
        }
        if (result) {
          resolveRequest(result)
          return
        }
        reject(new Error(`Unable to resolve ${request}`))
      })
      return
    }

    if (isAbsolute(request)) {
      resolveRequest(request)
      return
    }

    if (request.startsWith('./') || request.startsWith('../')) {
      resolveRequest(resolve(dirname(context.resourcePath), request))
      return
    }

    resolveRequest(createRequire(context.resourcePath).resolve(request))
  })
}

/** Writes the manifest, or with `program` the runtime program, of a CSS entry as a tracked ESM input. */
async function writeCSSManifestModule(context: LoaderContext, manifestPath: string, program: boolean) {
  if (!isManifestStylesheetRequest(manifestPath)) {
    throw new TypeError(`Master CSS ${program ? 'program' : 'manifest'} queries only support CSS entry files.`)
  }

  const projectDir = context.getOptions?.().projectDir || context.rootContext || process.cwd()
  const production = context.mode === 'production'
  const developmentModulePath = program
    ? toVirtualCSSProgramModulePath(projectDir, manifestPath)
    : toVirtualCSSManifestModulePath(projectDir, manifestPath)
  // `next dev` and `next build` may run at once; production modules omit
  // source provenance, so each mode owns its generated file.
  const virtualModulePath = production
    ? developmentModulePath.replace(/\.(manifest|program)\.js$/, '.production.$1.js')
    : developmentModulePath
  const dependencies = new Set(collectStylesheetDependenciesSync(manifestPath, undefined, { projectDir }))
  for (const dependency of dependencies) {
    context.addDependency?.(dependency)
  }
  const result = compileProjectManifestSync({
    root: projectDir,
    entries: [manifestPath],
    baseManifest: defaultBuildManifest
  })
  ensureVirtualModulePackageJSONPath(projectDir)
  mkdirSync(dirname(virtualModulePath), { recursive: true })
  const moduleSource = program
    ? await toRuntimeProgramModule(result.manifest, production)
    : toInlineManifestModule(production
      ? toProductionManifestJSON(result.manifest)
      : serializeMasterCSSManifest(result.manifest))
  if (!existsSync(virtualModulePath) || readFileSync(virtualModulePath, 'utf8') !== moduleSource) {
    writeFileSync(virtualModulePath, moduleSource)
  }
  context.addDependency?.(virtualModulePath)
  for (const dependency of result.dependencies) {
    if (dependencies.has(dependency)) continue
    context.addDependency?.(dependency)
  }
  return virtualModulePath
}

async function transformManifestImports(context: LoaderContext, source: string) {
  let result = ''
  let lastIndex = 0
  let matched = false

  for (const match of source.matchAll(MASTER_CSS_MANIFEST_IMPORT_PATTERN)) {
    const [fullMatch, prefix, quote, request] = match
    const program = isMasterCSSProgramRequest(request)
    if (!program && !isMasterCSSManifestRequest(request)) continue
    if (match.index === undefined) continue

    matched = true
    const manifestPath = await resolveRequest(context, program
      ? stripMasterCSSProgramQuery(request)
      : stripMasterCSSManifestQuery(request))
    const virtualModulePath = await writeCSSManifestModule(context, manifestPath, program)
    result += source.slice(lastIndex, match.index)
    result += `${prefix}${quote}${toModuleSpecifier(context.resourcePath, virtualModulePath)}${quote}`
    lastIndex = match.index + fullMatch.length
  }

  if (!matched) return source
  return result + source.slice(lastIndex)
}

export default function masterCSSManifestImportLoader(this: LoaderContext, source: string) {
  // The small generated ESM input must be recreated even after its directory is
  // cleaned while the bundler retains cached importer transforms.
  this.cacheable?.(false)
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css-next] CSS manifest import loader requires an async loader context.')
  }

  transformManifestImports(this, source)
    .then((code) => callback(null, code))
    .catch((error: Error) => callback(error))
}
