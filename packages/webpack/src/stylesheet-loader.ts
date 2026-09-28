import { dirname, join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { ensureVirtualModuleFile } from '@master/css-internal/node'
import { preserveModuleGlobals } from './utils/module-globals'
import { preserveCSSLoaderGlobals } from './utils/module-css-loader'
import { existsSync } from 'node:fs'
import { transformStyleSource } from './utils/transform-style-source'
import {
  collectStylesheetDependenciesSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'

interface StylesheetLoaderOptions {
  virtualCSSImportModuleId?: string
  preserveImports?: boolean
  nativeCSS?: boolean
}

interface LoaderContext {
  resourcePath: string
  rootContext?: string
  loaders?: { path: string }[]
  async?: () => (error: Error | null, result?: string) => void
  addDependency?: (file: string) => void
  addMissingDependency?: (file: string) => void
  addContextDependency?: (directory: string) => void
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
    const resolution = resolveStylesheetSync(resourcePath, source, { projectDir, preserveImports: true })
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
  const root = this.rootContext ?? dirname(this.resourcePath)
  const outputDirectory = join(root, 'node_modules', '.master-css', 'stylesheets')
  if (!relative(outputDirectory, this.resourcePath).startsWith('..')) {
    callback(null, source)
    return
  }
  this.addContextDependency?.(root)
  const dependencies = new Set<string>()
  const onDependency = (file: string) => {
    if (dependencies.has(file)) return
    dependencies.add(file)
    if (!existsSync(file) && this.addMissingDependency) this.addMissingDependency(file)
    else this.addDependency?.(file)
  }
  const initialDependencies = shouldAddStyleDependencies(this.resourcePath, source, this.rootContext)
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
      let code = result.code
      if (result.globalStylesheet) {
        const css = result.globalStylesheet.css
        if (options.nativeCSS) code = preserveModuleGlobals(code, css)
        else {
          const cssLoader = this.loaders?.find(loader => /[/\\]css-loader[/\\]/u.test(loader.path))
          if (cssLoader) code = preserveCSSLoaderGlobals(code, css, cssLoader.path)
        }
        const filename = join(outputDirectory, createHash('sha256').update(css).digest('hex') + '.css')
        ensureVirtualModuleFile(filename, css)
        code = `@import ${JSON.stringify(toCSSImportPath(this.resourcePath, filename))};\n${code}`
      }
      callback(null, code)
    })
    .catch((error: Error) => callback(error))
}
