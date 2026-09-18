import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { PreparedStylesheetSource, SassModule, StylesheetPreparationOptions } from './types'

const require = createRequire(import.meta.url)

function defaultLoadSass(projectDir?: string): SassModule {
  if (projectDir) {
    try {
      return createRequire(join(projectDir, 'package.json'))('sass') as SassModule
    } catch {
      // Fall through to this package's dependency graph for tests and linked workspaces.
    }
  }
  return require('sass') as SassModule
}

// Preparation precedes CSS classification. Keep Sass-owned dependencies/maps
// so the host can watch original inputs and preserve their diagnostic origins.
export async function prepareSassSource(
  id: string, source: string, extension: string, options: StylesheetPreparationOptions
): Promise<PreparedStylesheetSource> {
  options.signal?.throwIfAborted()
  if (id.startsWith('\0') && !options.baseFile) {
    throw new TypeError('Preparing a virtual stylesheet requires a physical baseFile.')
  }
  const baseFile = resolve(options.baseFile ?? id)
  const dependencies = new Set<string>()
  function addDependency(file: string) {
    if (dependencies.has(file)) return
    dependencies.add(file)
    options.onDependency?.(file)
  }
  addDependency(baseFile)
  options.signal?.throwIfAborted()
  if (extension !== '.scss' && extension !== '.sass') {
    return Object.freeze({ id, baseFile, source, dependencies: Object.freeze([...dependencies]) })
  }
  const sass = (options.loadSass || defaultLoadSass)(options.projectDir)
  const result = await sass.compileStringAsync(source, {
    url: pathToFileURL(baseFile), style: 'expanded', syntax: extension === '.sass' ? 'indented' : 'scss',
    sourceMap: true, sourceMapIncludeSources: true
  }).catch((error: unknown) => {
    const url = (error as { span?: { url?: URL } })?.span?.url
    if (url?.protocol === 'file:') addDependency(fileURLToPath(url))
    throw error
  })
  options.signal?.throwIfAborted()
  for (const url of result.loadedUrls ?? []) {
    if (url.protocol === 'file:') addDependency(fileURLToPath(url))
  }
  options.signal?.throwIfAborted()
  return Object.freeze({
    id, baseFile, source: result.css, dependencies: Object.freeze([...dependencies]),
    ...(result.sourceMap ? { sourceMap: JSON.stringify(result.sourceMap) } : {})
  })
}
