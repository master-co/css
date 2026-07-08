import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { isCSSManifestRequest } from '@master/css-project/entries'
import { loadManifestJSONSync } from '@master/css-project/manifest-sync'
import {
  isMasterCSSManifestRequest,
  stripMasterCSSManifestQuery
} from '@master/css-integration/manifest-module'
import {
  ensureVirtualModulePackageJSONPath,
  toVirtualCSSManifestAssetPath,
  toVirtualCSSManifestModulePath
} from '@master/css-integration/node'
import { toUniversalManifestFacadeModule } from '@master/css-integration/manifest-facade'
import { collectStyleCSSDependencies } from '@master/css-stylesheet'

const MASTER_CSS_MANIFEST_IMPORT_PATTERN = /(\bimport\s+(?:[^'"]*?\s+from\s*)?|\bexport\s+[^'"]*?\s+from\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  addDependency?: (file: string) => void
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

function writeCSSManifestModule(context: LoaderContext, manifestPath: string) {
  if (!isCSSManifestRequest(manifestPath)) {
    throw new TypeError('Master CSS manifest queries only support CSS entry files.')
  }

  const projectDir = context.getOptions?.().projectDir || context.rootContext || process.cwd()
  const virtualManifestPath = toVirtualCSSManifestModulePath(projectDir, manifestPath)
  const virtualManifestAssetPath = toVirtualCSSManifestAssetPath(projectDir, manifestPath)
  const dependencies = new Set(collectStyleCSSDependencies(manifestPath, undefined, projectDir))
  for (const dependency of dependencies) {
    context.addDependency?.(dependency)
  }
  const result = loadManifestJSONSync(manifestPath)
  ensureVirtualModulePackageJSONPath(projectDir)
  mkdirSync(dirname(virtualManifestPath), { recursive: true })
  writeFileSync(virtualManifestAssetPath, result.json)
  writeFileSync(
    virtualManifestPath,
    toUniversalManifestFacadeModule(
      `new URL(${JSON.stringify(toModuleSpecifier(virtualManifestPath, virtualManifestAssetPath))}, import.meta.url)`
    )
  )
  for (const dependency of result.dependencies) {
    if (dependencies.has(dependency)) continue
    context.addDependency?.(dependency)
  }
  return virtualManifestPath
}

async function transformManifestImports(context: LoaderContext, source: string) {
  let result = ''
  let lastIndex = 0
  let matched = false

  for (const match of source.matchAll(MASTER_CSS_MANIFEST_IMPORT_PATTERN)) {
    const [fullMatch, prefix, quote, request] = match
    if (!isMasterCSSManifestRequest(request)) continue
    if (match.index === undefined) continue

    matched = true
    const manifestPath = await resolveRequest(context, stripMasterCSSManifestQuery(request))
    const virtualManifestPath = writeCSSManifestModule(context, manifestPath)
    result += source.slice(lastIndex, match.index)
    result += `${prefix}${quote}${toModuleSpecifier(context.resourcePath, virtualManifestPath)}${quote}`
    lastIndex = match.index + fullMatch.length
  }

  if (!matched) return source
  return result + source.slice(lastIndex)
}

export default function masterCSSManifestImportLoader(this: LoaderContext, source: string) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css.next] CSS manifest import loader requires an async loader context.')
  }

  transformManifestImports(this, source)
    .then((code) => callback(null, code))
    .catch((error: Error) => callback(error))
}
