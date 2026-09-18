import { removeSassPrefixMap, removeSassPrefixError } from './sass-source-context'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { prepareStylesheet, type MasterCSSSassCompiler } from '@master/css-compiler/stylesheet'

export interface NextStylesheetLoaderOptions {
  preprocessed?: boolean
  sassOptions?: Record<string, unknown>
}

export function prepareNextStylesheet(file: string, source: string, projectDir: string | undefined, options: NextStylesheetLoaderOptions, onDependency: (file: string) => void) {
  const configured = options.sassOptions
  const loadSass = configured ? () => {
    const { implementation, prependData, additionalData, includePaths, ...sassOptions } = configured
    const require = createRequire(join(projectDir ?? process.cwd(), 'package.json'))
    const sass = require(typeof implementation === 'string' ? implementation : 'sass') as MasterCSSSassCompiler
    const data = prependData || additionalData
    return {
      async compileStringAsync(source: string, preparation: Parameters<MasterCSSSassCompiler['compileStringAsync']>[1]) {
        const prefix = typeof data === 'string' ? `${data}\n` : ''
        const input = prefix + source
        const result = await sass.compileStringAsync(input, {
          ...sassOptions,
          ...(Array.isArray(includePaths) ? { loadPaths: includePaths.map(path => resolve(projectDir ?? process.cwd(), String(path))) } : {}),
          ...preparation
        }).catch(error => { throw removeSassPrefixError(error, preparation.url, source, prefix) })
        return { ...result, sourceMap: removeSassPrefixMap(result.sourceMap, preparation.url, source, prefix) }
      }
    }
  } : undefined
  return prepareStylesheet(file, source, { projectDir, loadSass, onDependency })
}
