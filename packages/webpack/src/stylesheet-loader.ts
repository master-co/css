import { dirname, relative } from 'node:path'
import { existsSync } from 'node:fs'
import { transformStyleSource } from './utils/transform-style-source'
import {
  collectStylesheetDependenciesSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'

interface StylesheetLoaderOptions {
  virtualCSSImportModuleId?: string
  preserveImports?: boolean
}

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  async?: () => (error: Error | null, result?: string) => void
  addDependency?: (file: string) => void
  addMissingDependency?: (file: string) => void
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

function shouldAddStyleDependencies(resourcePath: string, source: string, projectDir?: string, preserveImports?: boolean) {
  try {
    const resolution = resolveStylesheetSync(resourcePath, source, { projectDir, preserveImports })
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
  const dependencies = new Set<string>()
  const onDependency = (file: string) => {
    if (dependencies.has(file)) return
    dependencies.add(file)
    if (!existsSync(file) && this.addMissingDependency) this.addMissingDependency(file)
    else this.addDependency?.(file)
  }
  const initialDependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext, options.preserveImports)
    ? collectStylesheetDependenciesSync(this.resourcePath, source, {
      projectDir: this.rootContext
    })
    : []
  for (const dependency of initialDependencies) {
    onDependency(dependency)
  }
  transformStyleSource(this.resourcePath, source, {
    projectDir: this.rootContext,
    preserveImports: options.preserveImports,
    onDependency,
    masterImport: toCSSImportPath(this.resourcePath, options.virtualCSSImportModuleId)
  })
    .then((result) => {
      for (const dependency of new Set(result.dependencies)) {
        onDependency(dependency)
      }
      callback(null, result.code)
    })
    .catch((error: Error) => callback(error))
}
