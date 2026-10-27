import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createNextPostCSSResourceHook, type NextPostCSSResourcePolicy } from './postcss-resource-policy'

export function pitch(this: {
  resourcePath: string
  getOptions(): { snapshot: string }
  addDependency(file: string): void
  callback(error: Error | null, css?: string, map?: object, meta?: object): void
}) {
  const { snapshot } = this.getOptions()
  this.addDependency(snapshot)
  this.addDependency(this.resourcePath)
  const input = JSON.parse(readFileSync(snapshot, 'utf8')) as { source: string, sourceMap?: string, generatedCSS?: string, resources?: NextPostCSSResourcePolicy }
  if (input.generatedCSS || input.resources) {
    const require = createRequire(import.meta.url)
    const postcss = createRequire(require.resolve('next/package.json'))('postcss')
    const root = postcss.parse(input.source, { from: this.resourcePath, map: { prev: input.sourceMap ? JSON.parse(input.sourceMap) : false } })
    root.walk((node: { masterCSSGlobal?: boolean }) => { node.masterCSSGlobal = false })
    const generated = postcss.parse(input.generatedCSS ?? '', { from: this.resourcePath + '?master-css-generated' })
    generated.walk((node: { masterCSSGlobal?: boolean }) => { node.masterCSSGlobal = true })
    root.append(generated.nodes)
    this.callback(null, root.toString(), undefined, { ast: { type: 'postcss', version: postcss().version, root }, masterPostCSSResources: input.resources ? createNextPostCSSResourceHook(input.resources) : undefined })
    return
  }
  this.callback(null, input.source, input.sourceMap ? JSON.parse(input.sourceMap) : undefined)
}

export default function inputLoader() {
  throw new Error('Next stylesheet input must be supplied by its pitch phase.')
}
