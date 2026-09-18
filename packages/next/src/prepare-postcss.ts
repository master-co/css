import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishFile } from './static-publication'
import type { ModuleContext } from './prepare-module'
import type { NextPostCSSResourcePolicy } from './postcss-resource-policy'
import { protectNextGeneratedGlobals } from './prepare-global-module'

export function createNextPostCSS(context: ModuleContext, projectDir: string, onDependency: (file: string) => void) {
  const native = context.loaders?.find(loader => loader.path?.endsWith('/webpack-postcss-loader.js'))
  if (!native?.request || !context.importModule) return
  return async (file: string, source: string, sourceMap?: string, resource = file, generatedCSS = '', scoped = true, knownAnimations: readonly string[] = [], resources?: NextPostCSSResourcePolicy) => {
    const input = JSON.stringify({ source, sourceMap, generatedCSS, resources })
    const digest = createHash('sha256').update(input).digest('hex')
    const snapshot = join(projectDir, '.master/postcss', digest + '.json')
    await publishFile(snapshot, Buffer.from(input), true)
    onDependency(snapshot)
    onDependency(file)
    const capture = fileURLToPath(new URL('./stylesheet-source-loader.js', import.meta.url))
    const loader = fileURLToPath(new URL('./stylesheet-input-loader.js', import.meta.url))
    const result = await context.importModule!(`!!${capture}!${native.request}!${loader}?${JSON.stringify({ snapshot })}!${resource}`)
    if (!resources && !generatedCSS && !knownAnimations.length) return { ...result, globalAnimations: [] as string[] }
    if (!result.ast) throw new Error('Native PostCSS did not preserve the generated-global AST.')
    return protectNextGeneratedGlobals(file, result.ast, scoped, knownAnimations)
  }
}
