import { dirname, relative } from 'node:path'
import { transformStyleSource } from './utils/transform-style-source'
import {
  collectStylesheetDependenciesSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'

interface StylesheetLoaderOptions {
  virtualCSSImportModuleId?: string
}

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  async?: () => (error: Error | null, result?: string) => void
  addDependency?: (file: string) => void
  getOptions?: () => StylesheetLoaderOptions
}

function toCSSImportPath(fromFile: string, toFile?: string) {
  if (!toFile) return undefined
  let importPath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath
  }
  return importPath
}

function shouldAddStyleDependencies(resourcePath: string, source: string, projectDir?: string) {
  try {
    const resolution = resolveStylesheetSync(resourcePath, source, { projectDir })
    return Boolean(resolution && resolution.kind !== 'plain')
  } catch {
    return true
  }
}

export default function masterCSSStylesheetLoader(this: LoaderContext, source: string) {
  const callback = this.async?.()
  if (!callback) {
    throw new Error('[@master/css-webpack] Stylesheet loader requires an async loader context.')
  }
  const options = this.getOptions?.() || {}
  const dependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
    ? new Set(collectStylesheetDependenciesSync(this.resourcePath, source, {
      projectDir: this.rootContext
    }))
    : new Set<string>()
  for (const dependency of dependencies) {
    this.addDependency?.(dependency)
  }
  transformStyleSource(this.resourcePath, source, {
    projectDir: this.rootContext,
    masterImport: toCSSImportPath(this.resourcePath, options.virtualCSSImportModuleId)
  })
    .then((result) => {
      for (const dependency of new Set(result.dependencies)) {
        if (dependencies.has(dependency)) continue
        this.addDependency?.(dependency)
      }
      callback(null, result.code)
    })
    .catch((error: Error) => callback(error))
}
